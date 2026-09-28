# AZKOM — Vercel Web Build

Versi ini adalah **web-only** untuk Vercel.

## Tidak digunakan
- Expo
- expo-image
- expo-splash-screen
- @expo/vector-icons
- react-native-safe-area-context
- react-native-screens
- React Navigation native stack
- AsyncStorage

## Build
```bash
npm install
npm run vercel-build
```

Vercel:
- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- Root Directory: kosong jika `package.json` berada di root repository

## Environment Variables Vercel
Server-only:
```env
AUTH_SECRET=SECRET_RANDOM_MIN_32_KARAKTER
SUPABASE_URL=https://PROJECT-ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_KEY_SUPABASE
ADMIN_SECRET=SECRET_ADMIN_RANDOM
```

Frontend tidak memakai `EXPO_PUBLIC_API_URL`. Semua endpoint akun memakai same-origin `/api/...`, sehingga setelah deploy AZKOM otomatis memanggil API pada domain Vercel yang sama.

**Jangan memasukkan `SUPABASE_SERVICE_ROLE_KEY` ke source code atau variabel `VITE_*`.**
