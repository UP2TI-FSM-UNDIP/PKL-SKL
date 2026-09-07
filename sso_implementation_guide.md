# Panduan Implementasi Endpoint SSO UNDIP (End-to-End)

Panduan ini ditujukan bagi pengembang yang ingin mengintegrasikan Single Sign-On (SSO) UNDIP ke dalam aplikasi baru. Implementasi ini menggunakan *Flow Integrasi API* di mana SSO Engine berinteraksi langsung dengan Backend aplikasi, lalu melakukan *redirect* kembali ke Frontend.

---

## 1. Konfigurasi Awal (SSO Engine)

Sebelum masuk ke kode, pastikan aplikasi Anda telah terdaftar di sistem SSO UNDIP. Anda perlu mendapatkan dan mengatur variabel berikut:

*   **`CLIENT_ID`**: ID unik aplikasi Anda dari tim SSO UNDIP.
*   **`CALLBACK_URL`**: URL Backend Anda yang akan menerima *webhook* token dari SSO Engine.
    *   *Contoh:* `https://domain-anda.undip.ac.id/api/auth/sso`

---

## 2. Alur Autentikasi (Alur Kerja)

Berikut adalah urutan proses yang terjadi saat user melakukan login:

1.  **User (Frontend)** menekan tombol "Login SSO".
2.  Browser melakukan *redirect* ke halaman login SSO UNDIP dengan menyertakan `CLIENT_ID` dan `CALLBACK_URL`.
3.  User memasukkan kredensial di SSO UNDIP.
4.  **SSO Engine** memvalidasi kredensial. Jika sukses, secara "Server-to-Server", SSO Engine memanggil Backend Anda (`CALLBACK_URL`) dengan mengirimkan *Token Validasi* melalui header `Authorization`.
5.  **Backend** menerima token panjang, memvalidasi profil user ke server SSO, membuat akun lokal (auto-register), dan membuat token sesi internal. Backend lalu merespons SSO Engine dengan URL *redirect* spesifik (contoh: `/redirect?token=SESI_LOKAL`).
6.  **SSO Engine** akhirnya melakukan *redirect* browser user ke URL respons tersebut (masuk kembali ke Backend).
7.  **Backend** (di endpoint `/redirect`) melakukan HTTP 302 *Redirect* ke Frontend (halaman callback).
8.  **Frontend** (halaman callback) mengekstrak `token` lokal dari URL, menukarnya (atau memvalidasinya) ke Backend untuk menerima Cookie Sesi / JWT asli.
9.  User berhasil masuk ke aplikasi.

---

## 3. Implementasi Frontend

### A. Tombol Login (Pemicu)
Buat tombol yang akan langsung mengarahkan user ke halaman login SSO UNDIP.

```typescript
// app/page.tsx (Contoh pada framework React/Next.js)
const handleSSOLogin = (e: React.MouseEvent) => {
  e.preventDefault();
  const clientId = process.env.NEXT_PUBLIC_SSO_CLIENT_ID || 'ID-APLIKASI-ANDA';
  const callbackUrl = 'https://api.domain-anda.com/auth/sso'; // URL Backend
  
  // Arahkan browser ke SSO Engine
  window.location.href = `https://apps-fsm.undip.ac.id/sso/?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}`;
};

<button onClick={handleSSOLogin}>Login SSO UNDIP</button>
```

### B. Halaman Callback Frontend
Halaman ini bertugas menangkap token sesi dari URL (yang dilempar oleh Backend) lalu memberitahu Backend untuk "mengatur sesi/cookie".

```typescript
// app/sso/callback/page.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SSOCallbackComponent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Panggil backend untuk set cookie session
      fetch(`https://api.domain-anda.com/auth/sso/set-session?token=${token}`, {
        method: 'GET',
        credentials: 'include', // PENTING: Untuk menerima Set-Cookie
      })
      .then(res => {
         if(res.ok) {
            // Sukses! Redirect ke Dashboard
            window.location.href = '/dashboard';
         }
      });
    }
  }, [token]);

  return <p>Mengonfirmasi identitas SSO...</p>;
}
```

---

## 4. Implementasi Backend

Backend memiliki peran ganda: menangkap *webhook* dari SSO dan melakukan *redirect* ke Frontend.

### A. Konfigurasi Variabel Lingkungan (.env)
```env
SSO_HOST="https://apps-fsm.undip.ac.id/sso_api"
FRONTEND_URL="https://app.domain-anda.com"
```

### B. Route Auth SSO (Contoh di Node.js / Elysia.js / Express)

```typescript
// 1. Endpoint Webhook (Dipanggil oleh SSO Engine Server-to-Server)
// POST /auth/sso atau GET /auth/sso (tergantung konfigurasi engine SSO)
app.get('/auth/sso', async (req) => {
  // Ambil token dari header
  const authHeader = req.headers.authorization;
  const ssoToken = authHeader?.replace('Bearer ', '');

  // Validasi token kembali ke SSO Engine untuk mengambil profil user
  const ssoRes = await fetch(`${process.env.SSO_HOST}/users/me`, {
    headers: { Authorization: `Bearer ${ssoToken}` }
  });
  const ssoUser = (await ssoRes.json()).data;
  const email = ssoUser.username; // Perhatikan field ini

  // Logic Database: Cari user dari db lokal berdasarkan email
  let user = await db.user.findByEmail(email);
  if (!user) {
    // AUTO-REGISTER: Jika tidak ada, buat akun baru berdasarkan profil SSO
    user = await db.user.create({
      email: email,
      name: ssoUser.name,
      role: ssoUser.role // Map ke role lokal jika diperlukan
    });
  }

  // Buat Token Sesi Internal
  const internalToken = generateRandomHash(); // contoh: randomBytes(32).toString("hex")
  await db.session.create({ token: internalToken, userId: user.id });

  // PENTING: Response harus berupa URL relatif agar diteruskan browser oleh SSO Engine
  return {
    callback_url: `/redirect?token=${internalToken}` 
  };
});

// 2. Endpoint Redirect (Browser user masuk ke sini setelah dari SSO Engine)
app.get('/auth/sso/redirect', (req, res) => {
  const token = req.query.token;
  // Banting / Lempar ke Frontend
  res.redirect(`${process.env.FRONTEND_URL}/sso/callback?token=${token}`);
});

// 3. Endpoint Set Session (Dipanggil Frontend secara AJAX saat mendarat di Callback)
app.get('/auth/sso/set-session', async (req, res) => {
  const token = req.query.token;
  
  // Validasi di tabel session logikamu
  const session = await db.session.findByToken(token);
  if (!session) return res.status(401).send("Invalid session");

  // Jika Anda pakai framework auth (seperti Better Auth, Passport, dsj), set Cookie di sini
  setAuthCookie(res, session.userId);

  return res.send({ success: true, message: "Session enabled" });
});
```

### C. Alur Lengkap Profil Mahasiswa / Pegawai
Jika SSO belum menyimpan data lengkap (seperti NIM, NIP, Alamat), disarankan untuk:
1. Tetap melakukan Auto-Register dan izinkan login.
2. Buat status *`isProfileComplete`* pada user (atau cek relasi tabel).
3. Di *Frontend*, jika user belum lengkap, munculkan **Modal Wajib Paksa (Force Modal)** untuk `melengkapi profil` dan kunci akses fitur lainnya. Gunakan rute terpisah seperti `PATCH /api/me/complete-profile`.
