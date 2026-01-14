// src/lib/olap-engine.ts
import { prisma } from "@/lib/db";

interface ProductWithFacts {
  id: string;
  name: string;
  category: string;
  facts: Array<{
    id: string;
    type: string;
    quantity: number;
    amount: number;
  }>;
}

interface FactInventoryWithProduct {
  id: string;
  type: string;
  quantity: number;
  amount: number;
  product: {
    id: string;
    name: string;
    category: string;
    supplierId?: string;
  };
}

interface SupplierWithProducts {
  id: string;
  name: string;
  products: Array<{
    id: string;
  }>;
}

// ==========================================
// 1. BAGIAN DASHBOARD (Visualisasi & KPI)
// ==========================================

export const getDashboardStats = async () => {
  const totalSku = await prisma.product.count();

  const revenueAgg = await prisma.factInventory.aggregate({
    where: { type: "OUT" }, // Hapus status: "completed" jika ingin menghitung semua yang keluar
    _sum: { amount: true }
  });

  const pendingCount = await prisma.factInventory.count({
    where: { status: "pending" }
  });

  const products: ProductWithFacts[] = await prisma.product.findMany({ include: { facts: true } });
  let lowStockCount = 0;

  products.forEach((p: ProductWithFacts) => {
    const totalIn = p.facts.filter((f: ProductWithFacts['facts'][0]) => f.type === "IN").reduce((acc: number, curr: ProductWithFacts['facts'][0]) => acc + curr.quantity, 0);
    const totalOut = p.facts.filter((f: ProductWithFacts['facts'][0]) => f.type === "OUT").reduce((acc: number, curr: ProductWithFacts['facts'][0]) => acc + curr.quantity, 0);
    if ((totalIn - totalOut) < 5) lowStockCount++;
  });

  return {
    totalParts: totalSku,
    monthlyRevenue: revenueAgg._sum.amount || 0,
    pendingOrders: pendingCount,
    lowStockAlerts: lowStockCount
  };
};

export const getSalesAnalytics = async () => {
  const products: ProductWithFacts[] = await prisma.product.findMany({ include: { facts: true } });

  const data = products.map((p: ProductWithFacts) => {
    const totalSold = p.facts
      .filter((f: ProductWithFacts['facts'][0]) => f.type === "OUT")
      .reduce((acc: number, curr: ProductWithFacts['facts'][0]) => acc + curr.quantity, 0);

    return {
      productName: p.name,
      totalSold: totalSold
    };
  });

  return data.sort((a: { totalSold: number }, b: { totalSold: number }) => b.totalSold - a.totalSold).slice(0, 5);
};

export const getCategoryDistribution = async () => {
  const products: ProductWithFacts[] = await prisma.product.findMany({ include: { facts: true } });
  const categoryMap: Record<string, number> = {};

  products.forEach((p: ProductWithFacts) => {
    const totalIn = p.facts.filter((f: ProductWithFacts['facts'][0]) => f.type === "IN").reduce((acc: number, curr: ProductWithFacts['facts'][0]) => acc + curr.quantity, 0);
    const totalOut = p.facts.filter((f: ProductWithFacts['facts'][0]) => f.type === "OUT").reduce((acc: number, curr: ProductWithFacts['facts'][0]) => acc + curr.quantity, 0);
    const currentStock = totalIn - totalOut;

    if (!categoryMap[p.category]) categoryMap[p.category] = 0;
    categoryMap[p.category] += Math.max(0, currentStock);
  });

  return Object.keys(categoryMap).map((key: string) => ({
    name: key,
    value: categoryMap[key]
  }));
};

export const getRecentActivity = async () => {
  return await prisma.factInventory.findMany({
    take: 4,
    orderBy: { transactionDate: 'desc' },
    include: { product: true }
  });
};

export const getLowStockItems = async () => {
  const products: ProductWithFacts[] = await prisma.product.findMany({ include: { facts: true } });

  const items = products.map((p: ProductWithFacts) => {
    const totalIn = p.facts.filter((f: ProductWithFacts['facts'][0]) => f.type === "IN").reduce((acc: number, c: ProductWithFacts['facts'][0]) => acc + c.quantity, 0);
    const totalOut = p.facts.filter((f: ProductWithFacts['facts'][0]) => f.type === "OUT").reduce((acc: number, c: ProductWithFacts['facts'][0]) => acc + c.quantity, 0);
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      currentStock: totalIn - totalOut,
      minStock: 5
    };
  }).filter((i: { currentStock: number }) => i.currentStock < 5);

  return items.slice(0, 3);
};

export const getTopProducts = async () => {
    return await getSalesAnalytics(); // Reuse fungsi sales analytics
};


// ==========================================
// 2. BAGIAN INVENTORY (Perbaikan Error 1)
// ==========================================

export type SalesAnalysis = {
  productName: string;
  category: string;
  totalSold: number;
  revenue: number;
  status: "Fast-Moving" | "Slow-Moving" | "Normal";
};

// Fungsi ini yang sebelumnya hilang, sekarang dikembalikan:
export const getInventoryAnalytics = async () => {
  const allFacts: FactInventoryWithProduct[] = await prisma.factInventory.findMany({
    include: { product: true },
  });

  const analysisMap = new Map<string, any>();

  allFacts.forEach((fact: FactInventoryWithProduct) => {
    const p = fact.product;
    const existing = analysisMap.get(p.id) || {
      id: p.id,
      productName: p.name,
      category: p.category,
      totalIn: 0,
      totalOut: 0,
      revenue: 0,
      status: "Normal",
    };

    if (fact.type === "IN") {
      existing.totalIn += fact.quantity;
    } else if (fact.type === "OUT") {
      existing.totalOut += fact.quantity;
      existing.revenue += fact.amount;
    }
    analysisMap.set(p.id, existing);
  });

  const result = Array.from(analysisMap.values()).map((item: any) => {
    const currentStock = item.totalIn - item.totalOut;
    const totalSold = item.totalOut;
    return {
      productName: item.productName,
      category: item.category,
      currentStock: Math.max(0, currentStock),
      totalSold: totalSold,
      revenue: item.revenue,
      status: (totalSold >= 20
        ? "Fast-Moving"
        : totalSold <= 5
        ? "Slow-Moving"
        : "Normal") as "Fast-Moving" | "Slow-Moving" | "Normal",
    };
  });

  // Jika produk belum pernah ada transaksi, tambahkan dengan stock 0
  const allProducts = await prisma.product.findMany();
  allProducts.forEach((p: { id: string; name: string; category: string }) => {
      if(!analysisMap.has(p.id)) {
          result.push({
              id: p.id,
              productName: p.name,
              category: p.category,
              currentStock: 0,
              totalSold: 0,
              revenue: 0,
              status: "Slow-Moving"
          })
      }
  })

  return result.sort((a: any, b: any) => b.currentStock - a.currentStock);
};


// ==========================================
// 3. BAGIAN SUPPLIERS (Perbaikan Error 2)
// ==========================================

// Fungsi ini juga dikembalikan:
export const getSupplierAnalytics = async () => {
  const suppliers: SupplierWithProducts[] = await prisma.supplier.findMany({
    include: {
      products: true
    }
  });

  const facts: FactInventoryWithProduct[] = await prisma.factInventory.findMany({
    where: { type: "OUT" },
    include: { product: true }
  });

  const result = suppliers.map((supplier: SupplierWithProducts) => {
    const supplierFacts = facts.filter((f: FactInventoryWithProduct) => f.product.supplierId === supplier.id);

    const totalRevenue = supplierFacts.reduce((acc: number, curr: FactInventoryWithProduct) => acc + curr.amount, 0);
    const totalSold = supplierFacts.reduce((acc: number, curr: FactInventoryWithProduct) => acc + curr.quantity, 0);

    let fastMovingCount = 0;
    supplier.products.forEach((prod: SupplierWithProducts['products'][0]) => {
       const prodSold = supplierFacts
          .filter((f: FactInventoryWithProduct) => f.product.id === prod.id)
          .reduce((acc: number, curr: FactInventoryWithProduct) => acc + curr.quantity, 0);
       if (prodSold >= 20) fastMovingCount++;
    });

    return {
      id: supplier.id,
      name: supplier.name,
      productCount: supplier.products.length,
      revenue: totalRevenue,
      sold: totalSold,
      fastMovingCount: fastMovingCount,
    };
  });

  return result.sort((a: any, b: any) => b.revenue - a.revenue);
};
