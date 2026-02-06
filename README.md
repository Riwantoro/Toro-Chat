# Toro Chat

Fullstack realtime chat demo (admin approval) dengan Web + Mobile.

## Struktur
- `apps/backend` NestJS + Socket.IO
- `apps/web` React + Vite
- `apps/mobile` Expo (placeholder UI)

## Setup cepat
1. Copy `.env.example` ke `.env` dan sesuaikan jika perlu.
2. Install dependencies:
   - `npm install`
3. Jalankan backend:
   - `npm run dev:backend`
4. Jalankan web:
   - `npm run dev:web`

Backend akan berjalan di `http://localhost:4000`.
Web di `http://localhost:5173`.

## Akun admin default
- Email: `admin@torochat.local`
- Password: `admin123`

## Alur auth
- User register -> status `pending`
- Admin approve -> status `active`
- User hanya bisa login setelah approved

## Catatan
Data masih in-memory (sementara). Next step: ganti ke PostgreSQL + Redis.
