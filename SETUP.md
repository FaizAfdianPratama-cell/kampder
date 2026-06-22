# 🎓 StudyLife — Panduan Setup Lengkap

## Stack
- **Next.js 15** + TypeScript + Tailwind CSS
- **Neon** (PostgreSQL cloud, gratis)
- **Prisma** ORM
- **NextAuth v5** (login email + Google)
- **OneSignal** (push notification)
- **Vercel** (hosting gratis, always-on)
- **PWA** (install di HP)

---

## Step 1 — Clone & Install

```bash
# Buat folder project
mkdir student-dashboard && cd student-dashboard

# Copy semua file kode yang sudah dibuat ke folder ini
# Lalu install dependencies
npm install

# Install bcryptjs untuk hash password
npm install bcryptjs
npm install -D @types/bcryptjs
```

---

## Step 2 — Setup Neon Database (gratis)

1. Buka **https://neon.tech** → Sign up gratis
2. Klik **New Project** → beri nama `student-dashboard`
3. Pilih region **Asia Pacific (Singapore)**
4. Setelah project dibuat, klik **Connection Details**
5. Copy string koneksi yang ada (format: `postgresql://...`)

---

## Step 3 — Setup Environment Variables

Buat file `.env` di root project:

```env
# Database Neon
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# NextAuth — generate dengan: openssl rand -base64 32
AUTH_SECRET="isi-dengan-random-string-panjang"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (opsional)
AUTH_GOOGLE_ID="isi-nanti"
AUTH_GOOGLE_SECRET="isi-nanti"

# OneSignal
NEXT_PUBLIC_ONESIGNAL_APP_ID="isi-nanti"
```

---

## Step 4 — Setup Google OAuth (Login dengan Google)

1. Buka **https://console.cloud.google.com**
2. Buat project baru → **APIs & Services → Credentials**
3. Klik **Create Credentials → OAuth Client ID**
4. Application type: **Web application**
5. Authorized redirect URIs tambahkan:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://nama-app-kamu.vercel.app/api/auth/callback/google`
6. Copy **Client ID** dan **Client Secret** → paste ke `.env`

---

## Step 5 — Migrate Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema ke Neon database
npx prisma db push

# (Opsional) Buka Prisma Studio untuk lihat data
npx prisma studio
```

---

## Step 6 — Setup Icon PWA

Buat icons untuk PWA di folder `public/icons/`:
- Gunakan **https://realfavicongenerator.net** atau **https://pwa-asset-generator**
- Upload logo kamu → download semua ukuran icon
- Letakkan di `public/icons/`

Ukuran yang dibutuhkan:
`72x72`, `96x96`, `128x128`, `144x144`, `152x152`, `192x192`, `384x384`, `512x512`

---

## Step 7 — Jalankan Lokal

```bash
npm run dev
```

Buka **http://localhost:3000** → akan redirect ke `/login`

---

## Step 8 — Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

Atau cara lebih mudah:
1. Push project ke **GitHub**
2. Buka **https://vercel.com** → Import repository
3. Vercel auto-detect Next.js, klik **Deploy**
4. Setelah deploy, tambahkan **Environment Variables** di Vercel Dashboard:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` → ganti ke `https://nama-app.vercel.app`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `NEXT_PUBLIC_ONESIGNAL_APP_ID`
5. **Redeploy** setelah env variable ditambahkan

---

## Step 9 — Setup OneSignal (Push Notification)

1. Buka **https://onesignal.com** → Create account gratis
2. **New App** → pilih **Web**
3. Pilih **Custom Code** integration
4. Isi **Site URL**: `https://nama-app.vercel.app`
5. Copy **App ID** → paste ke env `NEXT_PUBLIC_ONESIGNAL_APP_ID`
6. Download **OneSignal SDK files** → letakkan di `public/`
7. Tambahkan ke `_document.tsx`:

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({ appId: "YOUR_APP_ID" });
  });
</script>
```

---

## Step 10 — Install App di HP (PWA)

### Android (Chrome):
1. Buka website di Chrome
2. Muncul banner "Tambahkan ke layar utama" → Klik
3. Atau: Menu (⋮) → **Add to Home Screen**

### iOS (Safari):
1. Buka website di Safari
2. Tap ikon **Share** (kotak dengan panah)
3. Scroll ke bawah → **Add to Home Screen**
4. Klik **Add**

---

## Struktur File

```
student-dashboard/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Register + NextAuth
│   │   │   ├── tasks/         # CRUD tugas
│   │   │   └── transactions/  # CRUD keuangan
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Home dashboard
│   │   │   ├── tasks/         # Halaman tugas
│   │   │   ├── calendar/      # Halaman kalender
│   │   │   └── finance/       # Halaman keuangan
│   │   ├── login/             # Halaman login/register
│   │   └── layout.tsx
│   ├── components/
│   │   └── layout/
│   │       └── BottomNav.tsx  # Navigasi bawah
│   └── lib/
│       ├── auth.ts            # NextAuth config
│       ├── prisma.ts          # Database client
│       └── utils.ts           # Helper functions
├── .env                       # Environment variables (jangan di-commit!)
├── .env.example               # Template env
└── next.config.ts             # Next.js + PWA config
```

---

## Troubleshooting

**Error: "DATABASE_URL must start with..."**
→ Pastikan DATABASE_URL diisi dengan benar di `.env`

**Error: "Cannot find module '@prisma/client'"**
→ Jalankan `npx prisma generate`

**Push notification tidak muncul di iOS**
→ iOS hanya support PWA notification di iOS 16.4+. Pastikan app diinstall via Safari

**Login Google tidak berfungsi**
→ Cek redirect URI di Google Console sudah sesuai URL deployment

---

## Selesai! 🎉

App kamu sekarang:
- ✅ Online 24/7 di Vercel
- ✅ Bisa diinstall di HP sebagai PWA
- ✅ Data tersimpan aman di Neon cloud
- ✅ Login dengan email atau Google
- ✅ Push notification deadline tugas
