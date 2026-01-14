// prisma/seed.ts
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Hapus data lama agar tidak duplikat
  try {
    await prisma.mechanicNote.deleteMany();
    await prisma.serviceOrder.deleteMany();
    await prisma.signature.deleteMany();
    await prisma.followUp.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.communicationLog.deleteMany();
    await prisma.satisfactionSurvey.deleteMany();
    await prisma.reward.deleteMany();
    await prisma.loyaltyTierBenefit.deleteMany();
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.loyaltyProfile.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.factInventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();
    console.log("Data lama berhasil dihapus.");
  } catch (e) {
    console.log("Tabel masih bersih.");
  }

  // 1. Buat Permissions
  const permissions = [
    // Dashboard
    { name: "dashboard_view", resource: "dashboard", action: "view", description: "Akses ke halaman dashboard" },
    
    // Inventory
    { name: "inventory_view", resource: "inventory", action: "view", description: "Lihat data inventory" },
    { name: "inventory_create", resource: "inventory", action: "create", description: "Tambah produk inventory" },
    { name: "inventory_edit", resource: "inventory", action: "edit", description: "Edit produk inventory" },
    { name: "inventory_delete", resource: "inventory", action: "delete", description: "Hapus produk inventory" },
    
    // Suppliers
    { name: "suppliers_view", resource: "suppliers", action: "view", description: "Lihat data supplier" },
    { name: "suppliers_create", resource: "suppliers", action: "create", description: "Tambah supplier" },
    { name: "suppliers_edit", resource: "suppliers", action: "edit", description: "Edit supplier" },
    { name: "suppliers_delete", resource: "suppliers", action: "delete", description: "Hapus supplier" },
    
    // Orders/Transactions
    { name: "orders_view", resource: "orders", action: "view", description: "Lihat data transaksi" },
    { name: "orders_create", resource: "orders", action: "create", description: "Buat transaksi baru" },
    { name: "orders_edit", resource: "orders", action: "edit", description: "Edit transaksi" },
    { name: "orders_delete", resource: "orders", action: "delete", description: "Hapus transaksi" },
    
    // BI Dashboard
    { name: "bi_view", resource: "bi", action: "view", description: "Akses ke dashboard BI & OLAP" },

    // CRM
    { name: "crm_view", resource: "crm", action: "view", description: "Akses ke data pelanggan & CRM" },
    { name: "crm_manage", resource: "crm", action: "manage", description: "Kelola data pelanggan & kendaraan" },
    
    // Approvals
    { name: "approvals_view", resource: "approvals", action: "view", description: "Lihat pending approvals" },
    { name: "approvals_approve", resource: "approvals", action: "approve", description: "Approve/reject barang masuk" },
    
    // Mechanic Notes
    { name: "mechanic_notes_view", resource: "mechanic-notes", action: "view", description: "Lihat catatan mekanik" },
    { name: "mechanic_notes_create", resource: "mechanic-notes", action: "create", description: "Buat catatan mekanik" },
    { name: "mechanic_notes_edit", resource: "mechanic-notes", action: "edit", description: "Edit catatan mekanik" },
    { name: "mechanic_notes_delete", resource: "mechanic-notes", action: "delete", description: "Hapus catatan mekanik" },
    
    // Settings & Role Management
    { name: "settings_view", resource: "settings", action: "view", description: "Akses settings" },
    { name: "role_management", resource: "admin", action: "manage", description: "Kelola role & permissions" },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const created = await prisma.permission.create({ data: perm });
    createdPermissions.push(created);
  }
  console.log('✓ Permissions created');

  // 2. Buat Role Permissions (default mapping)
  // OWNER: Full access ke semua
  for (const perm of createdPermissions) {
    await prisma.rolePermission.create({
      data: {
        role: 'OWNER',
        permissionId: perm.id
      }
    });
  }
  console.log('✓ OWNER: Full access granted');

  // ADMIN: Semua kecuali role_management
  for (const perm of createdPermissions) {
    if (perm.name !== 'role_management') {
      await prisma.rolePermission.create({
        data: {
          role: 'ADMIN',
          permissionId: perm.id
        }
      });
    }
  }
  console.log('✓ ADMIN: Access granted (except role management)');

  // MEKANIK: Hanya view dashboard, view inventory, view orders, mechanic notes
  const mekanikPermissions = createdPermissions.filter(p => 
    p.name === 'dashboard_view' ||
    p.name === 'inventory_view' ||
    p.name === 'orders_view' ||
    p.name.startsWith('mechanic_notes_') ||
    p.name === 'crm_view'
  );
  for (const perm of mekanikPermissions) {
    await prisma.rolePermission.create({
      data: {
        role: 'MEKANIK',
        permissionId: perm.id
      }
    });
  }
  console.log('✓ MEKANIK: Limited access granted');

  // 3. Buat User Accounts
  const ownerPass = await bcrypt.hash('ownerpass', 10);
  const adminPass = await bcrypt.hash('adminpass', 10);
  const mekanikPass = await bcrypt.hash('mekanikpass', 10);

  await prisma.user.create({
    data: {
      email: 'owner@example.com',
      name: 'Owner',
      password: ownerPass,
      role: 'OWNER'
    }
  });

  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin',
      password: adminPass,
      role: 'ADMIN'
    }
  });

  await prisma.user.create({
    data: {
      email: 'mekanik@example.com',
      name: 'Mekanik',
      password: mekanikPass,
      role: 'MEKANIK'
    }
  });

  await prisma.user.create({
    data: {
      email: 'mekanik2@example.com',
      name: 'Mekanik 2',
      password: mekanikPass,
      role: 'MEKANIK'
    }
  });

  console.log('✓ User accounts created (owner/admin/mekanik/mekanik2)');

  // 4. Buat Dimensi Supplier
  const s1 = await prisma.supplier.create({ data: { name: "PT. Mitra Oli Sejati" } });
  const s2 = await prisma.supplier.create({ data: { name: "CV. Sparepart Racing" } });
  
  // 5. Buat Dimensi Produk
  const p1 = await prisma.product.create({ data: { sku: "OIL-001", name: "Motul 5100", category: "Oli", supplierId: s1.id } });
  const p2 = await prisma.product.create({ data: { sku: "BRK-001", name: "Kampas Rem", category: "Kaki-kaki", supplierId: s2.id } });
  const p3 = await prisma.product.create({ data: { sku: "FLT-001", name: "Filter Udara", category: "Mesin", supplierId: s1.id } });

  // 6. Buat Tabel Fakta (Transaksi)
  await Promise.all([
    prisma.factInventory.create({
      data: { transactionDate: new Date('2025-10-01'), type: "IN", quantity: 50, amount: 2500000, status: "completed", approvalStatus: "APPROVED", productId: p1.id, supplierId: s1.id }
    }),
    prisma.factInventory.create({
      data: { transactionDate: new Date('2025-10-05'), type: "OUT", quantity: 20, amount: 1000000, status: "completed", approvalStatus: "APPROVED", productId: p1.id, supplierId: s1.id }
    }),
    prisma.factInventory.create({
      data: { transactionDate: new Date('2025-10-10'), type: "OUT", quantity: 5, amount: 250000, status: "completed", approvalStatus: "APPROVED", productId: p2.id, supplierId: s2.id }
    }),
    prisma.factInventory.create({
      data: { transactionDate: new Date('2025-11-01'), type: "OUT", quantity: 15, amount: 750000, status: "completed", approvalStatus: "APPROVED", productId: p1.id, supplierId: s1.id }
    }),
    prisma.factInventory.create({
      data: { transactionDate: new Date('2025-11-05'), type: "IN", quantity: 10, amount: 500000, status: "completed", approvalStatus: "PENDING", productId: p3.id, supplierId: s1.id }
    })
  ]);

  // 7. Buat Service Orders (untuk catatan mekanik)
  const customer1 = await prisma.customer.create({
    data: {
      name: "Budi Santoso",
      email: "budi@example.com",
      phone: "081234567890",
      address: "Jakarta",
      preferredService: "Servis berkala & ganti oli",
      customerType: "INDIVIDU",
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Siti Aminah",
      email: "siti@example.com",
      phone: "081298765432",
      address: "Depok",
      preferredService: "Perbaikan rem dan kaki-kaki",
      customerType: "KOMUNITAS",
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: "Andi Wijaya",
      email: "andi@example.com",
      phone: "081355566677",
      address: "Tangerang",
      preferredService: "Servis rutin & tune up",
      customerType: "INDIVIDU",
    }
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: "Dewi Lestari",
      email: "dewi@example.com",
      phone: "081322244455",
      address: "Bekasi",
      preferredService: "Engine rebuild & performance upgrade",
      customerType: "RACING_TEAM",
    }
  });

  const v1 = await prisma.vehicle.create({
    data: {
      customerId: customer1.id,
      plateNumber: "B 1234 ABC",
      brand: "Honda",
      model: "Beat",
      year: 2021
    }
  });
  const v2 = await prisma.vehicle.create({
    data: {
      customerId: customer2.id,
      plateNumber: "B 5678 XYZ",
      brand: "Yamaha",
      model: "Mio",
      year: 2020
    }
  });
  const v3 = await prisma.vehicle.create({
    data: {
      customerId: customer3.id,
      plateNumber: "B 9012 DEF",
      brand: "Suzuki",
      model: "Nex",
      year: 2019
    }
  });
  const v4 = await prisma.vehicle.create({
    data: {
      customerId: customer4.id,
      plateNumber: "B 3456 GHI",
      brand: "Honda",
      model: "Vario",
      year: 2022
    }
  });

  const so1 = await prisma.serviceOrder.create({
    data: {
      orderNumber: "SO-2025-001",
      customerName: "Budi Santoso",
      vehicleInfo: "Honda Beat - B 1234 ABC",
      serviceType: "Ganti Oli & Filter",
      description: "Servis berkala 5000 km",
      status: "COMPLETED",
      scheduledDate: new Date('2025-12-01'),
      completedDate: new Date('2025-12-01'),
      totalCost: 150000,
      customerId: customer1.id,
      vehicleId: v1.id
    }
  });

  const so2 = await prisma.serviceOrder.create({
    data: {
      orderNumber: "SO-2025-002",
      customerName: "Siti Aminah",
      vehicleInfo: "Yamaha Mio - B 5678 XYZ",
      serviceType: "Perbaikan Rem",
      description: "Ganti kampas rem depan dan belakang",
      status: "COMPLETED",
      scheduledDate: new Date('2025-12-05'),
      completedDate: new Date('2025-12-05'),
      totalCost: 200000,
      customerId: customer2.id,
      vehicleId: v2.id
    }
  });

  const so3 = await prisma.serviceOrder.create({
    data: {
      orderNumber: "SO-2025-003",
      customerName: "Andi Wijaya",
      vehicleInfo: "Suzuki Nex - B 9012 DEF",
      serviceType: "Servis Rutin",
      description: "Servis berkala 10000 km",
      status: "IN_PROGRESS",
      scheduledDate: new Date('2025-12-15'),
      totalCost: 300000,
      customerId: customer3.id,
      vehicleId: v3.id
    }
  });

  const so4 = await prisma.serviceOrder.create({
    data: {
      orderNumber: "SO-2025-004",
      customerName: "Dewi Lestari",
      vehicleInfo: "Honda Vario - B 3456 GHI",
      serviceType: "Tune Up Mesin",
      description: "Tune up lengkap mesin motor",
      status: "PENDING",
      scheduledDate: new Date('2025-12-20'),
      totalCost: 250000,
      customerId: customer4.id,
      vehicleId: v4.id
    }
  });

  console.log('✓ Service orders created');

  // 8. Buat sample mechanic notes
  const mekanikUser = await prisma.user.findFirst({ where: { role: 'MEKANIK' } });
  if (mekanikUser) {
    await prisma.mechanicNote.create({
      data: {
        serviceOrderId: so1.id,
        content: "Ganti oli Motul 5100, filter udara dibersihkan. Kondisi mesin bagus.",
        createdById: mekanikUser.id
      }
    });

    await prisma.mechanicNote.create({
      data: {
        serviceOrderId: so2.id,
        content: "Kampas rem depan dan belakang sudah diganti. Tested dan aman.",
        createdById: mekanikUser.id
      }
    });

    await prisma.mechanicNote.create({
      data: {
        serviceOrderId: so3.id,
        content: "Sedang proses pembersihan karburator dan penggantian busi.",
        createdById: mekanikUser.id
      }
    });

    console.log('✓ Mechanic notes created');
  }

  // 9. Buat sample complaints & follow-ups
  await prisma.complaint.create({
    data: {
      customerId: customer2.id,
      serviceOrderId: so2.id,
      title: "Rem masih berdecit",
      description: "Setelah ganti kampas rem, masih terdengar bunyi decit saat pengereman.",
      status: "IN_PROGRESS",
      channel: "Whatsapp"
    }
  });

  await prisma.complaint.create({
    data: {
      customerId: customer4.id,
      serviceOrderId: so4.id,
      title: "Jadwal servis tertunda",
      description: "Ingin reschedule karena ada keperluan mendadak.",
      status: "OPEN",
      channel: "Phone"
    }
  });

  await prisma.followUp.create({
    data: {
      customerId: customer1.id,
      type: "POST_SERVICE",
      status: "PENDING",
      dueAt: new Date('2025-12-08'),
      message: "Follow-up setelah servis berkala, tanyakan kondisi motor."
    }
  });

  await prisma.followUp.create({
    data: {
      customerId: customer3.id,
      type: "REMINDER",
      status: "PENDING",
      dueAt: new Date('2025-12-20'),
      message: "Reminder servis 10.000 km berikutnya."
    }
  });

  console.log('✓ Complaints & follow-ups created');

  // 10. Buat sample loyalty profiles
  const lp1 = await prisma.loyaltyProfile.create({
    data: {
      customerId: customer1.id,
      points: 120,
      lifetimePoints: 120,
      tier: "Silver"
    }
  });
  const lp2 = await prisma.loyaltyProfile.create({
    data: {
      customerId: customer2.id,
      points: 620,
      lifetimePoints: 620,
      tier: "Gold"
    }
  });
  const lp3 = await prisma.loyaltyProfile.create({
    data: {
      customerId: customer3.id,
      points: 1550,
      lifetimePoints: 1550,
      tier: "Platinum"
    }
  });

  await prisma.loyaltyTransaction.create({
    data: {
      profileId: lp1.id,
      points: 120,
      type: "EARN",
      reason: "Servis berkala",
      serviceOrderId: so1.id
    }
  });
  await prisma.loyaltyTransaction.create({
    data: {
      profileId: lp2.id,
      points: 620,
      type: "EARN",
      reason: "Perbaikan rem + sparepart",
      serviceOrderId: so2.id
    }
  });
  await prisma.loyaltyTransaction.create({
    data: {
      profileId: lp3.id,
      points: 1550,
      type: "EARN",
      reason: "Servis rutin + tune up",
      serviceOrderId: so3.id
    }
  });

  console.log('✓ Loyalty profiles created');

  // 10b. Loyalty tier benefits
  await prisma.loyaltyTierBenefit.createMany({
    data: [
      { tier: "Silver", title: "Diskon servis 5%", description: "Diskon untuk servis berkala", discountPercent: 5 },
      { tier: "Gold", title: "Diskon servis 10%", description: "Diskon servis + prioritas booking", discountPercent: 10 },
      { tier: "Platinum", title: "Diskon servis 15%", description: "Diskon besar + prioritas booking", discountPercent: 15 },
      { tier: "Platinum", title: "Gratis check-up ringan", description: "Free check-up setiap 3 bulan" },
    ]
  });

  await prisma.reward.create({
    data: {
      customerId: customer2.id,
      type: "DISCOUNT",
      title: "Voucher Diskon 10%",
      status: "PENDING",
      pointsCost: 200
    }
  });

  console.log('✓ Loyalty benefits & rewards created');

  // 11. Sample satisfaction & communication logs
  await prisma.satisfactionSurvey.create({
    data: {
      customerId: customer1.id,
      serviceOrderId: so1.id,
      rating: 5,
      feedback: "Servis cepat, mekanik ramah.",
      channel: "WhatsApp"
    }
  });

  await prisma.satisfactionSurvey.create({
    data: {
      customerId: customer2.id,
      serviceOrderId: so2.id,
      rating: 3,
      feedback: "Perbaikan oke, tapi masih ada suara.",
      channel: "Phone"
    }
  });

  await prisma.communicationLog.create({
    data: {
      customerId: customer1.id,
      type: "WHATSAPP",
      channel: "WhatsApp",
      message: "Reminder servis berkala bulan depan.",
      status: "SENT",
      sentAt: new Date('2025-12-08'),
      source: "MANUAL",
      campaign: "Reminder Berkala"
    }
  });

  await prisma.communicationLog.create({
    data: {
      customerId: customer3.id,
      type: "CALL",
      channel: "Phone",
      message: "Follow-up pasca servis, cek kondisi motor.",
      status: "SENT",
      sentAt: new Date('2025-12-16'),
      source: "MANUAL",
      campaign: "Follow-up Servis"
    }
  });

  console.log('✓ Satisfaction & communication logs created');

  console.log('Database berhasil diisi data awal!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
