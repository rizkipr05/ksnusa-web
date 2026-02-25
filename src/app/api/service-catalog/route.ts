import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";

type AuthPayload = { id: string; role: string };

type ServiceRule = { intervalDays: number };

const DEFAULT_RULE: ServiceRule = { intervalDays: 90 };

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Service catalog error";

async function requireOneOfPermissions(user: AuthPayload, permissions: string[]) {
  let lastError: unknown = null;
  for (const permission of permissions) {
    try {
      await requirePermission(user, permission);
      return;
    } catch (error: unknown) {
      lastError = error;
    }
  }
  throw lastError || new Error("Forbidden");
}

function getServiceRule(serviceType: string): ServiceRule {
  const type = serviceType.toLowerCase();
  if (type.includes("oli")) return { intervalDays: 60 };
  if (type.includes("berkala")) return { intervalDays: 90 };
  if (type.includes("rem")) return { intervalDays: 120 };
  if (type.includes("radiator") || type.includes("coolant")) return { intervalDays: 120 };
  return DEFAULT_RULE;
}

function preferenceFromDistribution(distribution: {
  original: number;
  aftermarket: number;
  mixed: number;
  unknown: number;
}) {
  const sorted = [
    { key: "ORIGINAL", count: distribution.original },
    { key: "AFTERMARKET", count: distribution.aftermarket },
    { key: "MIXED", count: distribution.mixed },
    { key: "UNKNOWN", count: distribution.unknown },
  ].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  if (!top || top.count === 0) return "UNKNOWN";
  return top.key;
}

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as AuthPayload | null;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await requireOneOfPermissions(payload, ["crm_view", "orders_view"]);

    const { searchParams } = new URL(req.url);
    const serviceId = (searchParams.get("serviceId") || "").trim();
    const plateNumber = (searchParams.get("plateNumber") || "").trim();
    const vehicleType = (searchParams.get("vehicleType") || "").trim();
    const ownerName = (searchParams.get("ownerName") || "").trim();

    const conditions: Prisma.Sql[] = [];

    if (serviceId) {
      conditions.push(
        Prisma.sql`(so.id LIKE ${`%${serviceId}%`} OR so.orderNumber LIKE ${`%${serviceId}%`})`
      );
    }
    if (plateNumber) {
      conditions.push(Prisma.sql`v.plateNumber LIKE ${`%${plateNumber}%`}`);
    }
    if (vehicleType) {
      conditions.push(
        Prisma.sql`(
          CONCAT(COALESCE(v.brand, ''), ' ', COALESCE(v.model, '')) LIKE ${`%${vehicleType}%`}
          OR so.vehicleInfo LIKE ${`%${vehicleType}%`}
        )`
      );
    }
    if (ownerName) {
      conditions.push(
        Prisma.sql`(c.name LIKE ${`%${ownerName}%`} OR so.customerName LIKE ${`%${ownerName}%`})`
      );
    }

    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<
      Array<{
        serviceOrderId: string;
        orderNumber: string;
        serviceType: string;
        status: string;
        scheduledDate: Date;
        completedDate: Date | null;
        totalCost: number | null;
        ownerId: string | null;
        ownerName: string | null;
        customerName: string;
        plateNumber: string | null;
        brand: string | null;
        model: string | null;
        year: number | null;
        vehicleInfo: string | null;
      }>
    >(Prisma.sql`
      SELECT
        so.id AS serviceOrderId,
        so.orderNumber,
        so.serviceType,
        so.status,
        so.scheduledDate,
        so.completedDate,
        so.totalCost,
        so.customerId AS ownerId,
        c.name AS ownerName,
        so.customerName,
        v.plateNumber,
        v.brand,
        v.model,
        v.year,
        so.vehicleInfo
      FROM ServiceOrder so
      LEFT JOIN Customer c ON c.id = so.customerId
      LEFT JOIN Vehicle v ON v.id = so.vehicleId
      ${whereClause}
      ORDER BY so.scheduledDate DESC
      LIMIT 100
    `);

    if (!rows.length) {
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    }

    const serviceOrderIds = rows.map((row) => row.serviceOrderId);
    const ownerIds = rows.map((row) => row.ownerId).filter((id): id is string => Boolean(id));

    const liveRows = await prisma.$queryRaw<
      Array<{
        serviceOrderId: string;
        liveCount: bigint;
        lastLiveUpdateAt: Date | null;
        lastDirectNote: string | null;
      }>
    >(Prisma.sql`
      SELECT
        slu.serviceOrderId,
        COUNT(*) AS liveCount,
        MAX(slu.createdAt) AS lastLiveUpdateAt,
        (
          SELECT x.directNote
          FROM ServiceLiveUpdate x
          WHERE x.serviceOrderId = slu.serviceOrderId
          ORDER BY x.createdAt DESC
          LIMIT 1
        ) AS lastDirectNote
      FROM ServiceLiveUpdate slu
      WHERE slu.serviceOrderId IN (${Prisma.join(serviceOrderIds)})
      GROUP BY slu.serviceOrderId
    `);

    const feedbackRows =
      ownerIds.length > 0
        ? await prisma.$queryRaw<Array<{ customerId: string; openFeedbackCount: bigint }>>(Prisma.sql`
            SELECT customerId, COUNT(*) AS openFeedbackCount
            FROM PostServiceFeedback
            WHERE customerId IN (${Prisma.join(ownerIds)}) AND status = 'OPEN'
            GROUP BY customerId
          `)
        : [];

    const serviceCountRows =
      ownerIds.length > 0
        ? await prisma.$queryRaw<Array<{ customerId: string; serviceCount: bigint }>>(Prisma.sql`
            SELECT customerId, COUNT(*) AS serviceCount
            FROM ServiceOrder
            WHERE customerId IN (${Prisma.join(ownerIds)})
            GROUP BY customerId
          `)
        : [];

    const preferenceRows =
      ownerIds.length > 0
        ? await prisma.$queryRaw<
            Array<{ customerId: string; partType: string | null; total: bigint }>
          >(Prisma.sql`
            SELECT so.customerId AS customerId, mn.partType AS partType, COUNT(*) AS total
            FROM MechanicNote mn
            JOIN ServiceOrder so ON so.id = mn.serviceOrderId
            WHERE so.customerId IN (${Prisma.join(ownerIds)})
            GROUP BY so.customerId, mn.partType
          `)
        : [];

    const completedRows =
      ownerIds.length > 0
        ? await prisma.$queryRaw<
            Array<{ customerId: string; serviceType: string; completedDate: Date | null; scheduledDate: Date }>
          >(Prisma.sql`
            SELECT so.customerId AS customerId, so.serviceType, so.completedDate, so.scheduledDate
            FROM ServiceOrder so
            WHERE so.customerId IN (${Prisma.join(ownerIds)}) AND so.status = 'COMPLETED'
            ORDER BY COALESCE(so.completedDate, so.scheduledDate) DESC
          `)
        : [];

    const liveMap = new Map(
      liveRows.map((row) => [
        row.serviceOrderId,
        {
          liveCount: Number(row.liveCount),
          lastLiveUpdateAt: row.lastLiveUpdateAt,
          lastDirectNote: row.lastDirectNote,
        },
      ])
    );
    const feedbackMap = new Map(
      feedbackRows.map((row) => [row.customerId, Number(row.openFeedbackCount)])
    );
    const serviceCountMap = new Map(
      serviceCountRows.map((row) => [row.customerId, Number(row.serviceCount)])
    );

    const preferenceMap = new Map<
      string,
      { original: number; aftermarket: number; mixed: number; unknown: number }
    >();
    for (const row of preferenceRows) {
      const current = preferenceMap.get(row.customerId) || {
        original: 0,
        aftermarket: 0,
        mixed: 0,
        unknown: 0,
      };
      const count = Number(row.total);
      if (row.partType === "ORIGINAL") current.original += count;
      else if (row.partType === "AFTERMARKET") current.aftermarket += count;
      else if (row.partType === "MIXED") current.mixed += count;
      else current.unknown += count;
      preferenceMap.set(row.customerId, current);
    }

    const latestCompletedMap = new Map<
      string,
      { serviceType: string; baseDate: Date }
    >();
    for (const row of completedRows) {
      if (latestCompletedMap.has(row.customerId)) continue;
      latestCompletedMap.set(row.customerId, {
        serviceType: row.serviceType,
        baseDate: row.completedDate || row.scheduledDate,
      });
    }

    const items = rows.map((row) => {
      const ownerId = row.ownerId || "";
      const distribution = preferenceMap.get(ownerId) || {
        original: 0,
        aftermarket: 0,
        mixed: 0,
        unknown: 0,
      };
      const latestCompleted = latestCompletedMap.get(ownerId);
      const rule = latestCompleted ? getServiceRule(latestCompleted.serviceType) : DEFAULT_RULE;
      const nextServiceDate = latestCompleted
        ? new Date(latestCompleted.baseDate.getTime() + rule.intervalDays * 24 * 60 * 60 * 1000)
        : null;
      const daysRemaining = nextServiceDate
        ? Math.ceil((nextServiceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
      const vehicleTypeText = [row.brand, row.model].filter(Boolean).join(" ").trim();

      return {
        serviceOrderId: row.serviceOrderId,
        orderNumber: row.orderNumber,
        serviceType: row.serviceType,
        status: row.status,
        scheduledDate: row.scheduledDate,
        completedDate: row.completedDate,
        totalCost: row.totalCost,
        ownerId: row.ownerId,
        ownerName: row.ownerName || row.customerName,
        plateNumber: row.plateNumber,
        vehicleType: vehicleTypeText || null,
        vehicleInfo: row.vehicleInfo,
        transparency: liveMap.get(row.serviceOrderId) || {
          liveCount: 0,
          lastLiveUpdateAt: null,
          lastDirectNote: null,
        },
        behaviorTracking: {
          serviceCount: ownerId ? serviceCountMap.get(ownerId) || 0 : 0,
          productPreference: preferenceFromDistribution(distribution),
        },
        postServiceCare: {
          nextServiceDate,
          daysRemaining,
          openFeedbackCount: ownerId ? feedbackMap.get(ownerId) || 0 : 0,
        },
      };
    });

    return new Response(JSON.stringify({ items }), { status: 200 });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { status: 500 });
  }
}
