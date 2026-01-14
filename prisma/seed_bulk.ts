// prisma/seed_bulk.ts
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const firstNames = [
  "Adi","Bima","Citra","Doni","Eka","Fajar","Gina","Hadi","Intan","Joko",
  "Kiki","Lia","Mira","Nanda","Oka","Putri","Raka","Sari","Tono","Vina",
  "Wawan","Yani","Zaki","Agus","Bela","Cahya","Dewi","Edi","Fina","Gilang",
  "Hana","Iwan","Jati","Karin","Lukman","Mega","Nina","Oki","Rino","Salsa"
];

const customerTypes = ["INDIVIDU", "KOMUNITAS", "RACING_TEAM"];
const serviceTypes = [
  "Tuning Performance",
  "Engine Rebuild",
  "Race Preparation",
  "Servis Berkala",
  "Perbaikan Rem",
  "Tune Up Mesin",
];
const vehicleBrands = ["Honda", "Yamaha", "Suzuki", "Kawasaki"];
const vehicleModels = ["Beat", "Vario", "Mio", "Nmax", "Satria", "Ninja"];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateInLastMonths(months = 6) {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - months);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function ensureSuppliersAndProducts() {
  let suppliers = await prisma.supplier.findMany();
  if (!suppliers.length) {
    const s1 = await prisma.supplier.create({ data: { name: "PT. Mitra Oli Sejati" } });
    const s2 = await prisma.supplier.create({ data: { name: "CV. Sparepart Racing" } });
    suppliers = [s1, s2];
  }

  let products = await prisma.product.findMany();
  if (!products.length) {
    products = await Promise.all([
      prisma.product.create({ data: { sku: "OIL-101", name: "Oli Premium", category: "Oli", supplierId: suppliers[0].id } }),
      prisma.product.create({ data: { sku: "BRK-101", name: "Kampas Rem Racing", category: "Kaki-kaki", supplierId: suppliers[1].id } }),
      prisma.product.create({ data: { sku: "ENG-101", name: "Filter Mesin", category: "Mesin", supplierId: suppliers[0].id } }),
    ]);
  }

  return { suppliers, products };
}

async function main() {
  const { suppliers, products } = await ensureSuppliersAndProducts();

  const customerData = Array.from({ length: 40 }).map((_, i) => ({
    name: `${firstNames[i % firstNames.length]} ${String.fromCharCode(65 + (i % 26))}`,
    email: `user${i + 1}@example.com`,
    phone: `08${rand(1000000000, 9999999999)}`,
    address: "Jakarta",
    preferredService: "Servis berkala",
    customerType: customerTypes[i % customerTypes.length],
  }));

  await prisma.customer.createMany({ data: customerData, skipDuplicates: true });

  const allCustomers = await prisma.customer.findMany({
    where: {
      email: { startsWith: "user" },
    },
    include: { serviceOrders: true, vehicles: true },
  });

  const orderCreates = [];
  const vehicleCreates = [];
  const usedOrderNumbers = new Set();
  const today = new Date();
  let seq = 1;

  for (const c of allCustomers) {
    if (!c.vehicles.length) {
      vehicleCreates.push({
        customerId: c.id,
        plateNumber: `B ${rand(1000, 9999)} ${String.fromCharCode(65 + rand(0, 25))}${String.fromCharCode(65 + rand(0, 25))}`,
        brand: vehicleBrands[rand(0, vehicleBrands.length - 1)],
        model: vehicleModels[rand(0, vehicleModels.length - 1)],
        year: rand(2018, 2024),
      });
    }

    if (!c.serviceOrders.length) {
      const serviceType = serviceTypes[rand(0, serviceTypes.length - 1)];
      const scheduledDate = randomDateInLastMonths(6);
      let orderNumber = `SO-BULK-${today.getFullYear()}-${String(seq).padStart(3, "0")}`;
      while (usedOrderNumbers.has(orderNumber)) {
        seq += 1;
        orderNumber = `SO-BULK-${today.getFullYear()}-${String(seq).padStart(3, "0")}`;
      }
      usedOrderNumbers.add(orderNumber);
      seq += 1;

      orderCreates.push({
        orderNumber,
        customerName: c.name,
        vehicleInfo: `${serviceType} - ${c.name}`,
        serviceType,
        description: "Dummy servis otomatis",
        status: "COMPLETED",
        scheduledDate,
        completedDate: scheduledDate,
        totalCost: rand(150000, 750000),
        customerId: c.id,
      });
    }
  }

  if (vehicleCreates.length) {
    await prisma.vehicle.createMany({ data: vehicleCreates });
  }
  if (orderCreates.length) {
    await prisma.serviceOrder.createMany({ data: orderCreates });
  }

  const updatedCustomers = await prisma.customer.findMany({
    where: { email: { startsWith: "user" } },
    include: { serviceOrders: true },
  });

  const loyaltyProfiles = [];
  const loyaltyTransactions = [];

  for (const c of updatedCustomers) {
    const revenue = c.serviceOrders.reduce((acc: number, s: { totalCost?: number | null }) => acc + (s.totalCost || 0), 0);
    const points = Math.round(revenue / 10000);
    const tier = points >= 1500 ? "Platinum" : points >= 500 ? "Gold" : "Silver";

    loyaltyProfiles.push({
      customerId: c.id,
      points,
      lifetimePoints: points,
      tier,
    });
  }

  if (loyaltyProfiles.length) {
    await prisma.loyaltyProfile.createMany({ data: loyaltyProfiles, skipDuplicates: true });

    const createdProfiles = await prisma.loyaltyProfile.findMany({
      where: { customerId: { in: loyaltyProfiles.map((p) => p.customerId) } },
    });

    for (const profile of createdProfiles) {
      const customer = updatedCustomers.find((c: { id: string }) => c.id === profile.customerId);
      if (!customer || !customer.serviceOrders.length) continue;
      loyaltyTransactions.push({
        profileId: profile.id,
        points: profile.points,
        type: "EARN",
        reason: "Servis dummy bulk",
        serviceOrderId: customer.serviceOrders[0].id,
      });
    }
  }

  if (loyaltyTransactions.length) {
    await prisma.loyaltyTransaction.createMany({ data: loyaltyTransactions });
  }

  const allProducts = await prisma.product.findMany();
  const allSuppliers = await prisma.supplier.findMany();

  const factData = Array.from({ length: 40 }).map(() => {
    const product = allProducts[rand(0, allProducts.length - 1)];
    const supplier = allSuppliers.find((s: { id: string }) => s.id === product.supplierId) || allSuppliers[0];
    const quantity = rand(5, 50);
    const amount = quantity * rand(20000, 80000);
    return {
      transactionDate: randomDateInLastMonths(6),
      type: "IN",
      quantity,
      amount,
      status: "completed",
      approvalStatus: "APPROVED",
      productId: product.id,
      supplierId: supplier.id,
    };
  });

  await prisma.factInventory.createMany({ data: factData });

  console.log(`✓ Added ${customerData.length} customers + ${factData.length} IN transactions`);
  console.log(`✓ Added ${vehicleCreates.length} vehicles + ${orderCreates.length} service orders`);
  console.log(`✓ Added ${loyaltyProfiles.length} loyalty profiles + ${loyaltyTransactions.length} loyalty transactions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
