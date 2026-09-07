# Panduan Lengkap Integrasi SSO Sentral FSM UNDIP
> Versi 2.0 — Berbasis Source Code Aktual Backend SSO

Panduan ini ditulis berdasarkan analisis langsung terhadap *source code* server SSO FSM dan aplikasi-aplikasi yang **telah berhasil berintegrasi** (E-Office, Persuratan Mahasiswa, dll). Cocok untuk pengembang yang membangun aplikasi baru atau yang ingin men-debug kegagalan integrasi.

---

## Bagian 1: Arsitektur Sistem

### 1.1 Komponen Utama
```
[Browser User]
     │
     ▼ (1) Buka Aplikasi Anda
[Aplikasi Klien (Anda)]
     │
     ▼ (2) Redirect ke Portal SSO
[Portal SSO – apps-fsm.undip.ac.id/sso]
     │
     ▼ (3) User Login (Azure AD / Lokal FSM)
[SSO Backend – apps-fsm.undip.ac.id/sso_api]
     │
     ▼ (4) SSO menembak GET ke Callback URL Anda
[Callback API Aplikasi Anda]
     │
     ▼ (5) Respon { callback_url: "..." }
[SSO Backend – melanjutkan alur]
     │
     ▼ (6) Browser user di-redirect ke callback_url
[Halaman Dashboard Aplikasi Anda – USER MASUK!]
```

### 1.2 Dua Metode Login yang Didukung SSO
SSO FSM mendukung dua metode autentikasi:
1. **Azure Active Directory (Microsoft SSO Undip)**: Login menggunakan akun `@students.undip.ac.id`, `@lecturer.undip.ac.id`, `@staff.undip.ac.id`.
2. **Lokal SSO FSM**: Login menggunakan akun username dan password yang dibuat secara manual di portal admin SSO.

Kedua metode menghasilkan JWT yang identik dan akan memicu *Callback* ke aplikasi Anda dengan cara yang **persis sama**.

---

## Bagian 2: Alur Kerja Detail (Step-by-Step)

### Langkah 1 — Frontend: Buat Tombol Login SSO
Di UI aplikasi Anda, buat tombol yang mengarahkan user ke portal SSO dengan menyisipkan `clientId` Anda ke dalam URL:

```html
<!-- Tombol Login di Frontend Aplikasi Anda -->
<a href="https://apps-fsm.undip.ac.id/sso?clientId=MASUKKAN_CLIENT_ID_ANDA_DI_SINI">
  Login dengan SSO FSM UNDIP
</a>
```

### Langkah 2 — SSO: User Berhasil Login
Sistem SSO akan memverifikasi identitas user (via Azure AD atau Lokal), membuat token JWT internal FSM, dan **secara otomatis** menembak URL Callback yang Anda daftarkan di database.

### Langkah 3 — Backend Anda: Menerima Request dari SSO
Ini adalah inti dari integrasi. Endpoint ini yang Anda implementasikan sendiri.

**Request yang dikirim SSO ke Anda:**
```
Method  : GET
URL     : (URL yang Anda daftarkan, contoh: /peminjaman-ruang-api/auth/sso)
Headers :
  Content-Type  : application/json
  Authorization : <token_jwt_fsm>   ← PERHATIAN: Tidak ada prefix "Bearer"!
```

> **⚠️ PERHATIAN KRITIS:** Berdasarkan analisis [integrationController.js](file:///var/www/html/sso_be/controllers/integrationController.js) dan [userController.js](file:///var/www/html/sso_be/controllers/userController.js), token yang dikirim ke aplikasi Anda di Header `Authorization` adalah **raw JWT** tanpa prefix `"Bearer "`. Nilai yang dikirim langsung berupa string JWT (`eyJhbGci...`). Jangan mencoba melakukan `split(' ')[1]` pada header ini atau hasilnya akan kosong!

### Langkah 4 — Backend Anda: Validasi Token (Opsional tapi Disarankan)
Setelah menerima token, Anda bisa memeriksa kembali apakah token tersebut valid dengan memanggil endpoint validasi SSO:

```
Method  : GET/POST
URL     : https://apps-fsm.undip.ac.id/sso_api/users/validate
Headers :
  Authorization : Bearer <token_jwt_fsm_yang_anda_terima>
```

Respon dari SSO saat token valid:
```json
{
    "status": 200,
    "message": "Get token successful",
    "data": {
        "user": {
            "id": "uuid-user",
            "username": "username@students.undip.ac.id",
            "role": "mahasiswa",
            "name": "Nama Lengkap User"
        }
    }
}
```

### Langkah 5 — Backend Anda: Buat Sesi Lokal & Kirim Respons
Ini adalah bagian paling krusial. Berdasarkan inspeksi langsung [integrationController.js](file:///var/www/html/sso_be/controllers/integrationController.js):

```javascript
// Baris 51 di integrationController.js:
response_callback_url: callbackResponse.data.callback_url,
```

**SSO membaca nilai `callback_url`** dari JSON yang Anda kembalikan. Anda WAJIB mengembalikan struktur berikut:

```json
{
    "status": true,
    "session_id": "id-sesi-lokal-opsional",
    "callback_url": "/path-halaman-dashboard-anda?token=JWT_LOKAL_ANDA"
}
```

---

## Bagian 3: Implementasi Backend — Contoh per Framework

### 3.1 Elysia (Bun/TypeScript) — Digunakan Mayoritas Aplikasi FSM
```typescript
import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';

const app = new Elysia()
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET! }))
  .get('/auth/sso', async ({ headers, jwt, set }) => {
    // Token dari SSO tanpa prefix "Bearer"
    const ssoToken = headers['authorization'];
    
    if (!ssoToken) {
      set.status = 401;
      return { status: false, message: 'No token provided' };
    }
    
    // Opsional: Validasi token ke SSO Pusat
    const ssoValidation = await fetch('https://apps-fsm.undip.ac.id/sso_api/users/validate', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ssoToken}` }
    }).then(r => r.json());
    
    if (ssoValidation.status !== 200) {
      set.status = 401;
      return { status: false, message: 'Invalid SSO Token' };
    }
    
    const userData = ssoValidation.data.user;
    
    // Cari atau buat user di database lokal Anda
    let localUser = await db.users.findByEmail(userData.username);
    if (!localUser) {
      localUser = await db.users.create({ email: userData.username, name: userData.name });
    }
    
    // Buat JWT Lokal Aplikasi Anda
    const localToken = await jwt.sign({ userId: localUser.id, email: localUser.email });
    
    // WAJIB: Return dengan key "callback_url"
    return {
      status: true,
      session_id: localUser.id,
      callback_url: `/dashboard?token=${localToken}`
    };
  });
```

### 3.2 Express.js (Node.js)
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const router = express.Router();

router.get('/auth/sso', async (req, res) => {
  // Token dari SSO tanpa prefix "Bearer"
  const ssoToken = req.headers['authorization'];
  
  if (!ssoToken) {
    return res.status(401).json({ status: false, message: 'No token' });
  }
  
  try {
    // Opsional: Validasi ke SSO Pusat
    const validationResponse = await axios.get(
      'https://apps-fsm.undip.ac.id/sso_api/users/validate',
      { headers: { 'Authorization': `Bearer ${ssoToken}` } }
    );
    
    const userData = validationResponse.data.data.user;
    
    // Buat JWT Lokal
    const localToken = jwt.sign(
      { email: userData.username, role: userData.role },
      process.env.LOCAL_SECRET,
      { expiresIn: '8h' }
    );
    
    // WAJIB: Kirim dengan "callback_url"
    return res.json({
      status: true,
      session_id: `session_${Date.now()}`,
      callback_url: `/dashboard?token=${localToken}`
    });
    
  } catch (error) {
    return res.status(401).json({ status: false, message: 'Authentication failed' });
  }
});
```

### 3.3 Laravel (PHP)
```php
<?php
// routes/api.php:
// Route::get('/auth/sso', [AuthController::class, 'ssoCallback']);

// app/Http/Controllers/API/AuthController.php:
public function ssoCallback(Request $request)
{
    // Token dari SSO tanpa prefix "Bearer"
    $ssoToken = $request->header('Authorization');
    
    if (!$ssoToken) {
        return response()->json(['status' => false, 'message' => 'No token'], 401);
    }
    
    // Opsional: Validasi ke SSO Pusat
    $response = Http::withHeaders([
        'Authorization' => 'Bearer ' . $ssoToken
    ])->get('https://apps-fsm.undip.ac.id/sso_api/users/validate');
    
    if ($response->status() !== 200) {
        return response()->json(['status' => false, 'message' => 'Invalid token'], 401);
    }
    
    $userData = $response->json('data.user');
    
    // Cari atau buat user
    $user = User::firstOrCreate(
        ['email' => $userData['username']],
        ['name' => $userData['name'], 'role' => $userData['role']]
    );
    
    // Buat token lokal (Sanctum, Passport, atau custom JWT)
    $localToken = $user->createToken('app-token')->plainTextToken;
    
    // WAJIB: Kirim dengan "callback_url"
    return response()->json([
        'status' => true,
        'session_id' => session()->getId(),
        'callback_url' => '/dashboard?token=' . $localToken
    ]);
}
```

### 3.4 Next.js (App Router / API Route)
```typescript
// app/api/auth/sso/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  // Token dari SSO tanpa prefix "Bearer"
  const ssoToken = request.headers.get('authorization');
  
  if (!ssoToken) {
    return NextResponse.json({ status: false, message: 'No token' }, { status: 401 });
  }
  
  // Opsional: Validasi ke SSO Pusat
  const validation = await fetch('https://apps-fsm.undip.ac.id/sso_api/users/validate', {
    headers: { 'Authorization': `Bearer ${ssoToken}` }
  }).then(r => r.json());
  
  if (validation.status !== 200) {
    return NextResponse.json({ status: false, message: 'Invalid token' }, { status: 401 });
  }
  
  const userData = validation.data.user;
  const localToken = sign({ email: userData.username }, process.env.JWT_SECRET!, { expiresIn: '8h' });
  
  // WAJIB: Kirim dengan "callback_url"
  return NextResponse.json({
    status: true,
    session_id: userData.id,
    callback_url: `/dashboard?token=${localToken}` // PATH RELATIF OK
  });
}
```

---

## Bagian 4: Konfigurasi Apache (untuk Admin SSO)

### 4.1 Pola A — Framework TANPA `basePath` (Laravel, Express API)
Gunakan untuk Backend API yang tidak memiliki konfigurasi sub-path internal.
```apache
# Backend API — Path stripping DIIZINKAN
<Location "/nama-aplikasi-api/">
    ProxyPreserveHost Off
    DirectoryCheckHandler Off
    RequestHeader set X-Forwarded-Proto "https"
    ProxyPass http://10.137.58.124:PORT_API/
    ProxyPassReverse http://10.137.58.124:PORT_API/
</Location>
```

### 4.2 Pola B — Next.js / Nuxt.js (DENGAN `basePath`)
Framework-framework ini MEMBUTUHKAN prefix path diteruskan ke server internal. Tanpa ini, halaman akan tampil 404.
```apache
# Frontend — Path HARUS DIPRESERVASI
Redirect temp "/nama-aplikasi" "/nama-aplikasi/"
<Location "/nama-aplikasi/">
    DirectoryCheckHandler Off
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    # Sertakan nama sub-path di akhir URL tujuan!
    ProxyPass http://10.137.58.124:PORT_FRONTEND/nama-aplikasi/ nocanon
    ProxyPassReverse http://10.137.58.124:PORT_FRONTEND/nama-aplikasi/
</Location>
```

### 4.3 Tabel Port yang Sudah Terdaftar (Referensi)
| Aplikasi | Port Frontend | Port Backend |
|---|---|---|
| Persuratan Mahasiswa | — | 3077 |
| E-Office (e-office) | 3600 | 3500 |
| Pengantar PKL | 20061 | 20062 |
| Rekomendasi | 20041 | 20042 |
| Pernyataan Masih Kuliah | 20021 | 20022 |
| SK/ST | 20091 | 20092 |
| Peminjaman Ruang | 20081 | 20082 |
| Lapor FSM! | — | 20072 |

---

## Bagian 5: Data yang Diserahkan ke Admin SSO

Kirimkan data berikut dalam sebuah dokumen untuk memulai proses registrasi:

```markdown
## Permintaan Integrasi SSO

| Field | Nilai |
|---|---|
| Nama Aplikasi | Nama Sistem Anda |
| Deskripsi | Penjelasan singkat fungsi aplikasi |
| Callback URL | https://apps-fsm.undip.ac.id/nama-api/auth/sso |
| Redirect URI | https://apps-fsm.undip.ac.id/nama-aplikasi |
| Framework | Next.js / Laravel / Elysia / Lainnya |
| Port Frontend | 200XX |
| Port Backend (API) | 200XX |
| IP Server Internal | 10.137.58.XXX |
| Akses Role | Mahasiswa / Dosen / Staff |
```

Admin SSO akan mengembalikan informasi berikut kepada Anda:
- **Client ID (UUID)**: Gunakan ini di tombol login frontend.
- **Konfirmasi Sub-path Apache**: Sub-path yang sudah aktif di server.

---

## Bagian 6: Troubleshooting (Panduan Debug Lengkap)

### 6.1 Error `500 Internal Server Error` dengan pesan `"Request failed with status code 404"`
- **Penyebab**: SSO berhasil menembak Callback URL Anda, tapi server Anda merespon `404 Not Found`.
- **Debug**: Pastikan path Apache di [000-default.conf](file:///etc/apache2/sites-available/000-default.conf) sudah benar. Coba akses Callback URL secara langsung dari browser: `https://apps-fsm.undip.ac.id/nama-api/auth/sso` — apakah Anda mendapat respon (meski 401)?
- **Solusi**: Verifikasi rute di backend Anda sudah terdaftar sebagai `GET` dan path Apache sudah aktif.

### 6.2 Error `500 Internal Server Error` dengan pesan `"Request failed with status code 405"`
- **Penyebab**: SSO menembak dengan `GET`, tapi rute Anda hanya menerima `POST`.
- **Solusi**: Ubah rute `/auth/sso` di backend Anda dari `POST` menjadi `GET`.

### 6.3 Frontend `404 Not Found` setelah aplikasi Next.js dideploy
- **Penyebab**: Apache memotong prefix sub-path sebelum diteruskan ke Next.js. Ini disebut *path stripping*.
- **Solusi**: Terapkan konfigurasi Apache **Pola B** (lihat Bagian 4.2), yaitu menyertakan nama sub-path di bagian **target** ProxyPass internal.

### 6.4 Auth Token Kosong / `undefined` di Backend
- **Penyebab**: Kode developer mencoba `header('Authorization').split(' ')[1]` tapi SSO TIDAK mengirim prefix `"Bearer "`.
- **Solusi**: Baca header langsung: `const ssoToken = request.headers['authorization']` — nilai ini sudah berupa raw JWT.

### 6.5 Login Berhasil di SSO, tapi user kembali ke halaman Login Aplikasi
- **Penyebab**: `callback_url` yang dikembalikan aplikasi tidak menangkap dan menyimpan token lokal yang disebutkan di URL.
- **Debug**: Cek apakah halaman yang dituju oleh `callback_url` Anda memiliki logika untuk membaca query param `?token=...` dan menyimpannya sebagai *LocalStorage/Cookie*.
- **Solusi**: Tambahkan halaman `/auth/magic-login` yang bertugas membaca token dari query, validasikan secara lokal, dan redirect ke dashboard utama.

### 6.6 Tombol Login SSO di Frontend Tidak Mengarah ke SSO
- **Penyebab**: `clientId` yang dimasukkan ke href belum didaftarkan di database SSO.
- **Solusi**: Hubungi Admin SSO untuk memverifikasi `clientId` Anda ada di tabel `applications`.

---

## Bagian 7: Checklist Final untuk Developer

Sebelum meminta Admin SSO untuk mendaftarkan aplikasi, pastikan semua poin berikut sudah terpenuhi:

```
BACKEND:
  [ ]  Endpoint GET /auth/sso sudah aktif dan bisa diakses publik.
  [ ]  Token dibaca dari Header 'Authorization' (tanpa split "Bearer").
  [ ]  Response JSON mengandung kunci "callback_url".
  [ ]  Nilai "callback_url" mengarah ke halaman yang benar-benar menangani login lokal.
  [ ]  Aplikasi sudah di-deploy di server internal di port yang ditentukan.

APACHE / INFRASTRUKTUR:
  [ ]  Nomor port frontend dan backend sudah ditentukan dan bebas.
  [ ]  Informasi IP server internal sudah siap.
  [ ]  Jika menggunakan Next.js/Nuxt: konfigurasi "basePath" sudah diset.
  [ ]  CORS di backend diizinkan minimal untuk domain apps-fsm.undip.ac.id.

DATA REGISTRASI:
  [ ]  Nama dan deskripsi aplikasi sudah disiapkan.
  [ ]  Logo aplikasi sudah ada (format PNG/JPG).
  [ ]  Role yang diizinkan sudah ditentukan (Mahasiswa/Dosen/Staff).
```
