This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database setup (MySQL)

This project uses MySQL via Prisma. Make sure a MySQL server is running and matches `DATABASE_URL` in `.env`.

If you want a local MySQL via Docker:

```bash
docker compose up -d
```

Then initialize Prisma:

```bash
npx prisma generate
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Instalasi Lengkap (Local)

Prasyarat:

- Node.js 18+ (disarankan 20+)
- MySQL 8+ (atau gunakan Docker)
- npm (atau pnpm/yarn/bun)

1) Install dependencies:

```bash
npm install
```

2) Siapkan environment variables (buat atau edit `.env`):

```bash
JWT_SECRET=your_strong_secret_here
DATABASE_URL="mysql://ksnusa_user:kiki05@localhost:3306/ksnusa"
```

3) Jalankan database MySQL (opsional via Docker):

```bash
docker compose up -d
```

4) Generate Prisma client, migrate schema, dan seed data:

```bash
npx prisma generate
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

5) Jalankan aplikasi:

```bash
npm run dev
```

Default: `http://localhost:3000`

# Tech Stack

- App framework: Next.js 15 (App Router)
- Language: TypeScript + React 19
- Styling: Tailwind CSS + Radix UI primitives
- Charts: Recharts
- ORM: Prisma
- Auth: JWT (jsonwebtoken) + bcryptjs
- Tooling: ESLint, PostCSS

# Database

- Engine: MySQL 8
- ORM/Schema: Prisma (`prisma/schema.prisma`)
- Seed data: `prisma/seed.ts`
- Local Docker config: `docker-compose.yml` (MySQL + volume persist)

# Permission-based Access — Versi Singkat

Tujuan:

- Ganti cek role keras (ADMIN/OWNER) ke permission yang lebih rinci supaya kontrol lebih fleksibel.

Inti perubahan:

- Server action: gunakan requirePermission(user, "permission_name")
- Komponen UI: PermissionGuard untuk proteksi halaman
- Hook: usePermission() untuk cek permission di komponen
- API: semua route penting pakai requirePermission
- DB: tabel Permission + RolePermission, seed default permissions

Permissions (copyable):

```text
dashboard_view
inventory_view
inventory_create
inventory_edit
inventory_delete
suppliers_view
suppliers_create
suppliers_edit
suppliers_delete
orders_view
orders_create
orders_edit
orders_delete
mechanic_notes_view
mechanic_notes_create
mechanic_notes_edit
mechanic_notes_delete
approvals_view
approvals_approve
bi_view
crm_view
crm_manage
settings_view
users_manage
role_management
```

Role → permissions (singkat, copyable):

OWNER:

- Semua permission di atas

ADMIN:

- Semua kecuali role_management

MEKANIK:

- dashboard_view
- inventory_view (read)
- orders_view (read)
- mechanic_notes_view/create/edit/delete
- crm_view

Halaman utama → permission:

- /inventory → inventory_view
- /suppliers → suppliers_view
- /orders → orders_view
- /bi → bi_view
- /approvals → approvals_view
- /mechanic-notes → mechanic_notes_view
- /crm/customers → crm_view
- /crm/complaints → crm_view
- /crm/follow-ups → crm_view
- /crm/segmentation → crm_view
- /crm/loyalty → crm_view
- /crm/satisfaction → crm_view
- /crm/communications → crm_view
- /crm/promo → crm_view
- /profile → dashboard_view
- /role-management → role_management

Cara tes cepat:

1. Login OWNER (owner@example.com / ownerpass) → lihat semua menu.
2. Login ADMIN (admin@example.com / adminpass) → lihat hampir semua, tanpa Role Management.
3. Login MEKANIK (mekanik@example.com / mekanikpass) → lihat Dashboard, Inventory (read), Orders (read), Mechanic Notes.
4. Ubah permission sebagai OWNER → logout/login ulang untuk lihat perubahan.

Perintah dev:

```bash
npx prisma generate
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
npm run dev
```

Catatan singkat:

- Perubahan permission butuh relogin untuk efek.
- Role Management tetap hanya OWNER.
