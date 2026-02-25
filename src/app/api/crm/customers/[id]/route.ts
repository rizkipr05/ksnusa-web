import { prisma } from "@/lib/db";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";
type AuthPayload = { id: string; role: string };
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "CRM error");

type CustomerServiceOrder = {
  id: string;
  orderNumber: string;
  serviceType: string;
  status: string;
  scheduledDate: Date;
  completedDate: Date | null;
  totalCost: number | null;
  mechanicNotes: Array<{
    id: string;
    content: string;
    createdAt: Date;
    createdBy: { name: string | null; email: string };
  }>;
};

type ServiceRule = {
  intervalDays: number;
  intervalKm: number;
  guide: string[];
};

const DEFAULT_RULE: ServiceRule = {
  intervalDays: 90,
  intervalKm: 3000,
  guide: [
    "Cek level oli mesin setiap minggu dan isi ulang bila di bawah batas minimum.",
    "Periksa tekanan ban saat ban dingin untuk menjaga efisiensi bahan bakar.",
  ],
};

const DIY_KNOWLEDGE_BASE = [
  {
    id: "diy-1",
    title: "Cek Tekanan Ban di Rumah",
    type: "VIDEO",
    tags: ["ban", "servis berkala"],
    url: "https://www.youtube.com/watch?v=8xYf8lA8Z2A",
  },
  {
    id: "diy-2",
    title: "Cara Cek Ketinggian Air Radiator",
    type: "VIDEO",
    tags: ["radiator", "pendingin"],
    url: "https://www.youtube.com/watch?v=vqQbM5YQk6E",
  },
  {
    id: "diy-3",
    title: "Panduan Cek Oli Mesin",
    type: "ARTICLE",
    tags: ["oli", "mesin", "servis berkala"],
    url: "https://www.wikihow.com/Check-Your-Car%27s-Oil",
  },
  {
    id: "diy-4",
    title: "Pemeriksaan Kampas Rem Dasar",
    type: "ARTICLE",
    tags: ["rem", "safety"],
    url: "https://www.wikihow.com/Check-Brake-Pads",
  },
];

function getServiceRule(serviceType: string): ServiceRule {
  const type = serviceType.toLowerCase();
  if (type.includes("oli")) {
    return {
      intervalDays: 60,
      intervalKm: 2500,
      guide: [
        "Pantau warna oli; jika sudah pekat dan bau terbakar, jadwalkan servis lebih cepat.",
        "Hindari menunda ganti oli untuk mencegah keausan komponen mesin.",
      ],
    };
  }
  if (type.includes("berkala")) {
    return {
      intervalDays: 90,
      intervalKm: 3000,
      guide: [
        "Lakukan cek ban, oli, dan sistem pengereman tiap 2 minggu sekali.",
        "Gunakan checklist sederhana agar inspeksi mandiri lebih konsisten.",
      ],
    };
  }
  if (type.includes("rem")) {
    return {
      intervalDays: 120,
      intervalKm: 5000,
      guide: [
        "Jika rem terasa dalam atau berbunyi, segera konsultasi sebelum dipakai jauh.",
        "Periksa ketebalan kampas rem saat cuci kendaraan mingguan.",
      ],
    };
  }
  if (type.includes("radiator") || type.includes("coolant")) {
    return {
      intervalDays: 120,
      intervalKm: 5000,
      guide: [
        "Pastikan level coolant berada di antara min-max saat mesin dingin.",
        "Cek kebocoran kecil di selang radiator setelah perjalanan panjang.",
      ],
    };
  }
  return DEFAULT_RULE;
}

function getAverageIntervalDays(orders: CustomerServiceOrder[]) {
  if (orders.length < 2) return null;
  const sorted = [...orders].sort(
    (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
  );
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const ms = sorted[i].scheduledDate.getTime() - sorted[i - 1].scheduledDate.getTime();
    const days = ms / (1000 * 60 * 60 * 24);
    if (days > 0) diffs.push(days);
  }
  if (!diffs.length) return null;
  return Math.round(diffs.reduce((acc, v) => acc + v, 0) / diffs.length);
}

function inferConsistency(totalServices: number, averageIntervalDays: number | null) {
  if (totalServices < 2) return "NEW";
  if (averageIntervalDays !== null && averageIntervalDays <= 90) return "ROUTINE";
  return "IRREGULAR";
}

function parseParts(partsUsed: string | null) {
  if (!partsUsed) return [];
  return partsUsed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getCountdownStatus(daysRemaining: number | null) {
  if (daysRemaining === null) return "NO_DATA";
  if (daysRemaining < 0) return "OVERDUE";
  if (daysRemaining <= 7) return "DUE_SOON";
  return "ON_TRACK";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as AuthPayload | null;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await requirePermission(payload, "crm_view");

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        serviceOrders: {
          orderBy: { scheduledDate: "desc" },
          include: {
            mechanicNotes: {
              orderBy: { createdAt: "desc" },
              include: {
                createdBy: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return new Response(JSON.stringify({ error: "Customer not found" }), { status: 404 });
    }

    const allOrders = customer.serviceOrders as CustomerServiceOrder[];
    const completedOrders = allOrders.filter((order) => order.status === "COMPLETED");
    const latestOrder = allOrders[0] || null;
    const averageIntervalDays = getAverageIntervalDays(allOrders);
    const consistency = inferConsistency(allOrders.length, averageIntervalDays);

    const partDistribution = {
      original: 0,
      aftermarket: 0,
      mixed: 0,
      unknown: 0,
    };

    const partCounter = new Map<string, { name: string; count: number }>();
    const noteInsights = await prisma.$queryRaw<
      Array<{
        noteId: string;
        orderNumber: string;
        content: string;
        partType: string | null;
        partsUsed: string | null;
        createdAt: Date;
        mechanicName: string | null;
        mechanicEmail: string;
      }>
    >(Prisma.sql`
      SELECT 
        mn.id AS noteId,
        so.orderNumber AS orderNumber,
        mn.content AS content,
        mn.partType AS partType,
        mn.partsUsed AS partsUsed,
        mn.createdAt AS createdAt,
        u.name AS mechanicName,
        u.email AS mechanicEmail
      FROM MechanicNote mn
      JOIN ServiceOrder so ON so.id = mn.serviceOrderId
      JOIN User u ON u.id = mn.createdById
      WHERE so.customerId = ${id}
      ORDER BY mn.createdAt DESC
    `);

    const normalizedInsights = noteInsights.map((note) => ({
      noteId: note.noteId,
      orderNumber: note.orderNumber,
      content: note.content,
      partType: note.partType || "UNKNOWN",
      partsUsed: parseParts(note.partsUsed),
      createdAt: note.createdAt,
      mechanic: note.mechanicName || note.mechanicEmail,
    }));

    for (const note of normalizedInsights) {
      if (note.partType === "ORIGINAL") partDistribution.original += 1;
      else if (note.partType === "AFTERMARKET") partDistribution.aftermarket += 1;
      else if (note.partType === "MIXED") partDistribution.mixed += 1;
      else partDistribution.unknown += 1;

      for (const part of note.partsUsed) {
        const key = part.toLowerCase();
        const prev = partCounter.get(key);
        if (prev) {
          prev.count += 1;
        } else {
          partCounter.set(key, { name: part, count: 1 });
        }
      }
    }

    const sortedPartPreference = [
      { key: "ORIGINAL", count: partDistribution.original },
      { key: "AFTERMARKET", count: partDistribution.aftermarket },
      { key: "MIXED", count: partDistribution.mixed },
      { key: "UNKNOWN", count: partDistribution.unknown },
    ].sort((a, b) => b.count - a.count);

    const topPreference = sortedPartPreference[0];
    const preference =
      topPreference.count === 0 || topPreference.key === "UNKNOWN" ? "UNKNOWN" : topPreference.key;

    const topParts = Array.from(partCounter.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const latestCompletedOrder = completedOrders
      .sort((a, b) => {
        const aDate = (a.completedDate || a.scheduledDate).getTime();
        const bDate = (b.completedDate || b.scheduledDate).getTime();
        return bDate - aDate;
      })[0];
    const serviceRule = latestCompletedOrder
      ? getServiceRule(latestCompletedOrder.serviceType)
      : DEFAULT_RULE;
    const baseServiceDate = latestCompletedOrder
      ? latestCompletedOrder.completedDate || latestCompletedOrder.scheduledDate
      : null;
    const nextServiceDate = baseServiceDate
      ? new Date(baseServiceDate.getTime() + serviceRule.intervalDays * 24 * 60 * 60 * 1000)
      : null;
    const daysRemaining = nextServiceDate
      ? Math.ceil((nextServiceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const countdownStatus = getCountdownStatus(daysRemaining);

    const diyKnowledgeBase = DIY_KNOWLEDGE_BASE.filter((item) => {
      if (!latestCompletedOrder) return true;
      const serviceType = latestCompletedOrder.serviceType.toLowerCase();
      return item.tags.some((tag) => serviceType.includes(tag) || tag.includes("servis"));
    }).slice(0, 4);

    const personalizedGuide = [
      ...(latestCompletedOrder
        ? [`Fokus perawatan pasca ${latestCompletedOrder.serviceType.toLowerCase()} dalam 7 hari pertama.`]
        : ["Belum ada servis selesai. Panduan umum perawatan mandiri ditampilkan terlebih dahulu."]),
      ...serviceRule.guide,
      ...(topParts.length
        ? [`Part yang sering digunakan: ${topParts.map((item) => item.name).join(", ")}.`]
        : []),
    ];

    const feedbackLoop = await prisma.$queryRaw<
      Array<{
        id: string;
        serviceOrderId: string | null;
        orderNumber: string | null;
        question: string;
        answer: string | null;
        status: string;
        askedAt: Date;
        answeredAt: Date | null;
        answeredByName: string | null;
        answeredByEmail: string | null;
      }>
    >(Prisma.sql`
      SELECT
        f.id,
        f.serviceOrderId,
        so.orderNumber,
        f.question,
        f.answer,
        f.status,
        f.askedAt,
        f.answeredAt,
        u.name AS answeredByName,
        u.email AS answeredByEmail
      FROM PostServiceFeedback f
      LEFT JOIN ServiceOrder so ON so.id = f.serviceOrderId
      LEFT JOIN User u ON u.id = f.answeredById
      WHERE f.customerId = ${id}
      ORDER BY f.askedAt DESC
      LIMIT 20
    `);

    const behaviorTracking = {
      serviceFrequency: {
        totalServices: allOrders.length,
        completedServices: completedOrders.length,
        consistency,
        averageIntervalDays,
        lastServiceAt: latestOrder?.scheduledDate || null,
        history: allOrders.slice(0, 10).map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          serviceType: order.serviceType,
          status: order.status,
          scheduledDate: order.scheduledDate,
          completedDate: order.completedDate,
          totalCost: order.totalCost,
        })),
      },
      productPreference: {
        preference,
        distribution: partDistribution,
        topParts,
      },
      technicalInsights: normalizedInsights.slice(0, 10).map((note) => ({
        noteId: note.noteId,
        orderNumber: note.orderNumber,
        content: note.content,
        partType: note.partType,
        partsUsed: note.partsUsed,
        createdAt: note.createdAt,
        mechanic: note.mechanic,
      })),
    };

    const postServiceCare = {
      latestCompletedService: latestCompletedOrder
        ? {
            serviceOrderId: latestCompletedOrder.id,
            orderNumber: latestCompletedOrder.orderNumber,
            serviceType: latestCompletedOrder.serviceType,
            completedDate: latestCompletedOrder.completedDate || latestCompletedOrder.scheduledDate,
          }
        : null,
      nextServiceCountdown: {
        nextServiceDate,
        estimatedKilometer: serviceRule.intervalKm,
        daysRemaining,
        status: countdownStatus,
      },
      personalizedGuide,
      diyKnowledgeBase,
      feedbackLoop: feedbackLoop.map((feedback) => ({
        id: feedback.id,
        serviceOrderId: feedback.serviceOrderId,
        orderNumber: feedback.orderNumber,
        question: feedback.question,
        answer: feedback.answer,
        status: feedback.status,
        askedAt: feedback.askedAt,
        answeredAt: feedback.answeredAt,
        answeredBy: feedback.answeredByName || feedback.answeredByEmail,
      })),
    };

    return new Response(
      JSON.stringify({
        customer: {
          ...customer,
          serviceOrders: allOrders.slice(0, 10).map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            serviceType: order.serviceType,
            status: order.status,
            scheduledDate: order.scheduledDate,
            completedDate: order.completedDate,
            totalCost: order.totalCost,
          })),
          behaviorTracking,
          postServiceCare,
        },
      }),
      { status: 200 }
    );
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as AuthPayload | null;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await requirePermission(payload, "crm_manage");

    const body = await req.json();
    const { name, email, phone, address, preferredService, notes, customerType } = body || {};

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        preferredService: preferredService || null,
        customerType: customerType || null,
        notes: notes || null,
      },
    });

    return new Response(JSON.stringify({ customer }), { status: 200 });
  } catch (error: unknown) {
    const isUniqueError =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002";
    const message = isUniqueError ? "Email sudah terdaftar" : getErrorMessage(error);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as AuthPayload | null;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await requirePermission(payload, "crm_manage");

    await prisma.customer.delete({ where: { id } });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { status: 500 });
  }
}
