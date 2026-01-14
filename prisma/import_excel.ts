const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
    // Path to the Excel file - adjusting relative path to match execution context
    const filePath = path.join(process.cwd(), '../Stock Part ATK Imelda Tgl. 19 Nov 2025.xlsx');
    console.log(`Reading file from: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error('File not found at:', filePath);
        process.exit(1);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Read using header: 1 to get array of arrays
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`Found ${jsonData.length} rows in sheet "${sheetName}"`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];

        // Safety check for row existence
        if (!row) continue;

        // Structure validation based on observed data
        // Index 0: No (should be number)
        // Index 1: Brand/Supplier
        // Index 2: Part Number (SKU)
        // Index 3: Product Name
        const no = row[0];
        const partNumber = row[2];

        // Check if valid row data
        if (typeof no === 'number' && partNumber) {
            let supplierName = (row[1] && typeof row[1] === 'string') ? row[1].trim() : 'DORMAN';
            const sku = String(row[2]).trim();
            const productName = (row[3] && typeof row[3] === 'string') ? row[3].trim() : 'Unknown Product';
            const qty = Number(row[4]) || 0;
            const price = Number(row[6]) || 0;

            // Extra check to ignore header rows if logic above didn't catch them
            if (no === 'No') continue;

            console.log(`Processing: ${supplierName} - ${sku} - ${productName}`);

            try {
                // 1. Find or Create Supplier
                let supplierRecord = await prisma.supplier.findFirst({
                    where: { name: supplierName }
                });

                if (!supplierRecord) {
                    supplierRecord = await prisma.supplier.create({
                        data: { name: supplierName }
                    });
                }

                // 2. Upsert Product
                const product = await prisma.product.upsert({
                    where: { sku: sku },
                    update: {
                        name: productName,
                        // If product exists, just update name. Maintain supplier if needed or update?
                        // Let's keep existing supplier if set, or update to current file's supplier.
                        supplierId: supplierRecord.id,
                    },
                    create: {
                        sku: sku,
                        name: productName,
                        category: 'Sparepart',
                        supplierId: supplierRecord.id
                    }
                });

                // 3. Create FactInventory (IN)
                if (qty > 0) {
                    await prisma.factInventory.create({
                        data: {
                            type: 'IN',
                            quantity: qty,
                            amount: price * qty, // Total Value
                            status: 'completed',
                            approvalStatus: 'APPROVED',
                            productId: product.id,
                            supplierId: supplierRecord.id,
                            notes: 'Initial Stock Import from Excel'
                        }
                    });
                }

                successCount++;
            } catch (error) {
                console.error(`Error processing ${sku}:`, error);
                errorCount++;
            }
        }
    }

    console.log(`Import finished. Success: ${successCount}, Errors: ${errorCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
