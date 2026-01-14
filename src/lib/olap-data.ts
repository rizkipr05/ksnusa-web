// src/lib/olap-data.ts

// --- DEFINISI DIMENSI (CONTEXT) ---
// Sesuai Proposal: Dimensi Waktu, Produk (Sparepart), Supplier, Kategori

export type DimTime = {
    id: string;
    date: string;
    month: string;
    year: number;
    quarter: string;
  };
  
  export type DimProduct = {
    id: string;
    sku: string;
    name: string;
    category: "Mesin" | "Kaki-kaki" | "Body" | "Oli" | "Elektrikal";
    supplierId: string;
  };
  
  export type DimSupplier = {
    id: string;
    name: string;
  };
  
  // --- DEFINISI FAKTA (METRICS) ---
  // Sesuai Proposal: Jumlah barang masuk/keluar, Nilai Rupiah
  
  export type FactInventory = {
    id: string;
    timeId: string;
    productId: string;
    supplierId: string;
    type: "IN" | "OUT"; // Transaksi Masuk (Restock) atau Keluar (Servis/Jual)
    quantity: number;
    amount: number; // Nilai Rupiah (Harga * Qty)
  };
  
  // --- MOCK DATA WAREHOUSE (DUMMY DATA) ---
  
  export const products: DimProduct[] = [
    { id: "P001", sku: "OIL-001", name: "Motul 5100", category: "Oli", supplierId: "S01" },
    { id: "P002", sku: "BRK-001", name: "Kampas Rem Depan", category: "Kaki-kaki", supplierId: "S02" },
    { id: "P003", sku: "FLT-001", name: "Filter Udara", category: "Mesin", supplierId: "S01" },
    { id: "P004", sku: "VBL-001", name: "V-Belt Racing", category: "Mesin", supplierId: "S02" },
    { id: "P005", sku: "LGT-001", name: "Lampu LED Utama", category: "Elektrikal", supplierId: "S03" },
  ];
  
  export const suppliers: DimSupplier[] = [
    { id: "S01", name: "PT. Mitra Oli Sejati" },
    { id: "S02", name: "CV. Sparepart Racing" },
    { id: "S03", name: "Toko Elektronik Motor" },
  ];
  
  // Data Fakta Transaksi (Simulasi 3 Bulan Terakhir untuk Analisis Tren)
  export const facts: FactInventory[] = [
    // Bulan Oktober
    { id: "F1", timeId: "2025-10-01", productId: "P001", supplierId: "S01", type: "IN", quantity: 50, amount: 2500000 },
    { id: "F2", timeId: "2025-10-05", productId: "P001", supplierId: "S01", type: "OUT", quantity: 20, amount: 1200000 }, // Fast Moving
    { id: "F3", timeId: "2025-10-10", productId: "P002", supplierId: "S02", type: "OUT", quantity: 5, amount: 250000 },
    
    // Bulan November
    { id: "F4", timeId: "2025-11-01", productId: "P001", supplierId: "S01", type: "OUT", quantity: 15, amount: 900000 },
    { id: "F5", timeId: "2025-11-02", productId: "P004", supplierId: "S02", type: "IN", quantity: 10, amount: 1500000 },
    { id: "F6", timeId: "2025-11-15", productId: "P005", supplierId: "S03", type: "OUT", quantity: 1, amount: 150000 }, // Slow Moving
  
    // Bulan Desember
    { id: "F7", timeId: "2025-12-01", productId: "P001", supplierId: "S01", type: "OUT", quantity: 10, amount: 600000 },
    { id: "F8", timeId: "2025-12-02", productId: "P003", supplierId: "S01", type: "IN", quantity: 20, amount: 1000000 },
  ];