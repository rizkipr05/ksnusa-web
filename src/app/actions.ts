// src/app/actions.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUserFromCookie, requirePermission } from "@/lib/server-auth";

// --- CREATE (Sudah ada sebelumnya) ---
export async function createTransaction(formData: FormData) {
  const user = await getCurrentUserFromCookie();
  await requirePermission(user, "orders_create");

  const productId = formData.get("productId") as string;
  const type = formData.get("type") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const amount = parseInt(formData.get("amount") as string);

  if (!productId || !type || !quantity || !amount) throw new Error("Data tidak lengkap");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { supplier: true }
  });

  if (!product) throw new Error("Produk tidak ditemukan");

  await prisma.factInventory.create({
    data: {
      productId: product.id,
      supplierId: product.supplierId,
      type: type,
      quantity: quantity,
      amount: amount,
      transactionDate: new Date(),
    },
  });

  refreshAll();
}

// --- DELETE (Hapus Transaksi) ---
export async function deleteTransaction(id: string) {
  const user = await getCurrentUserFromCookie();
  await requirePermission(user, "orders_delete");

  await prisma.factInventory.delete({
    where: { id: id }
  });
  refreshAll();
}

// --- UPDATE (Edit Transaksi) ---
export async function updateTransaction(formData: FormData) {
  const user = await getCurrentUserFromCookie();
  await requirePermission(user, "orders_edit");

  const id = formData.get("id") as string;
  const productId = formData.get("productId") as string;
  const type = formData.get("type") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const amount = parseInt(formData.get("amount") as string);

  // Cek apakah produk berubah? Jika ya, update juga supplierId-nya
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { supplier: true }
  });

  if (!product) throw new Error("Produk tidak valid");

  await prisma.factInventory.update({
    where: { id: id },
    data: {
      productId: productId,
      supplierId: product.supplierId, // Update supplier sesuai produk baru
      type: type,
      quantity: quantity,
      amount: amount,
    }
  });

  refreshAll();
}

// Helper untuk merefresh semua halaman OLAP
function refreshAll() {
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/inventory");
  revalidatePath("/suppliers");
}

// --- MASTER DATA: SUPPLIER ---
export async function createSupplier(formData: FormData) {
    const user = await getCurrentUserFromCookie();
    await requirePermission(user, "suppliers_create");
    
    const name = formData.get("name") as string;
    
    if (!name) throw new Error("Nama supplier wajib diisi");
  
    await prisma.supplier.create({
      data: { name }
    });
  
    revalidatePath("/suppliers"); // Refresh halaman supplier
    revalidatePath("/inventory"); // Refresh halaman inventory (karena butuh data supplier)
    revalidatePath("/orders");    // Refresh halaman order
  }

export async function updateSupplier(formData: FormData) {
  const user = await getCurrentUserFromCookie();
  await requirePermission(user, "suppliers_edit");

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;

  if (!id || !name) throw new Error("Data tidak lengkap");

  await prisma.supplier.update({
    where: { id },
    data: { name }
  });

  revalidatePath("/suppliers");
  revalidatePath("/inventory");
  revalidatePath("/orders");
}

export async function deleteSupplier(id: string) {
  const user = await getCurrentUserFromCookie();
  await requirePermission(user, "suppliers_delete");

  // Cek apakah ada produk yang terkait
  const productsCount = await prisma.product.count({
    where: { supplierId: id }
  });

  if (productsCount > 0) {
    throw new Error(`Tidak bisa hapus supplier yang masih memiliki ${productsCount} produk terkait`);
  }

  await prisma.supplier.delete({
    where: { id }
  });

  revalidatePath("/suppliers");
  revalidatePath("/inventory");
  revalidatePath("/orders");
}
  
  // --- MASTER DATA: PRODUK ---
  export async function createProduct(formData: FormData) {
    const user = await getCurrentUserFromCookie();
    await requirePermission(user, "inventory_create");

    const sku = formData.get("sku") as string;
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const supplierId = formData.get("supplierId") as string;

    if (!sku || !name || !category || !supplierId) {
      throw new Error("Data produk tidak lengkap");
    }

    await prisma.product.create({
      data: {
        sku,
        name,
        category,
        supplierId
      }
    });

    revalidatePath("/inventory");
    revalidatePath("/orders");
    revalidatePath("/"); // Update dashboard (karena ada hitungan total SKU)
  }

export async function updateProduct(formData: FormData) {
  const user = await getCurrentUserFromCookie();
  await requirePermission(user, "inventory_edit");

  const id = formData.get("id") as string;
  const sku = formData.get("sku") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const supplierId = formData.get("supplierId") as string;

  if (!id || !sku || !name || !category || !supplierId) {
    throw new Error("Data produk tidak lengkap");
  }

  await prisma.product.update({
    where: { id },
    data: {
      sku,
      name,
      category,
      supplierId
    }
  });

  revalidatePath("/inventory");
  revalidatePath("/orders");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUserFromCookie();
  await requirePermission(user, "inventory_delete");

  // Cek apakah ada transaksi yang terkait
  const transactionsCount = await prisma.factInventory.count({
    where: { productId: id }
  });

  if (transactionsCount > 0) {
    throw new Error(`Tidak bisa hapus produk yang masih memiliki ${transactionsCount} transaksi terkait`);
  }

  await prisma.product.delete({
    where: { id }
  });

  revalidatePath("/inventory");
  revalidatePath("/orders");
  revalidatePath("/");
}
