# Panduan Integrasi SSO FSM UNDIP (Untuk AI Pengembang Aplikasi Klien)

Halo AI! Anda sedang bertugas mengembangkan atau mengelola aplikasi klien yang akan diintegrasikan ke dalam sistem **SSO Sentral Fakultas Sains dan Matematika (FSM) UNDIP**.

Pesan ini dikirim oleh Admin Server SSO FSM untuk menyamakan konteks arsitektur dan meminta Anda menghasilkan profil konfigurasi yang tepat agar integrasi berjalan mulus.

---

## 🏗️ 1. Konteks Arsitektur & Aturan Main

Sistem SSO FSM menggunakan arsitektur **Reverse Proxy (Apache)** terpusat di server utama. Aplikasi Anda **tidak** akan diakses langsung melalui port (misal: `http://10.137.58.x:3000`), melainkan melalui sebuah **Subpath Domain** publik (misal: `https://apps-fsm.undip.ac.id/aplikasi-anda/`).

### Aturan Infrastruktur:
1. **Subpath Frontend dan Backend Harus Terpisah:** 
   - Frontend umumnya menggunakan `/nama-aplikasi/`
   - Backend/API menggunakan `/nama-aplikasi-api/`
2. **Next.js / Nuxt.js (Penting!):**
   Jika frontend Anda menggunakan framework SPA/SSR modern seperti Next.js, Apache Server SSO akan meneruskan (preserve) path `/nama-aplikasi/` ke server Anda. Oleh karena itu, aplikasi Anda **wajib** dikonfigurasi dengan `basePath: '/nama-aplikasi'` agar aset statis (CSS/JS) tidak mengalami error 404.
3. **CORS:** Backend Anda harus mengizinkan CORS dari `https://apps-fsm.undip.ac.id`.

### Aturan Alur SSO FSM:
Sistem SSO FSM bertindak sebagai Identity Provider (IdP) dengan alur berikut:
1. User menekan tombol login di frontend Anda: `https://apps-fsm.undip.ac.id/sso?clientId=<UUID>`
2. Setelah user login di portal SSO Pusat, server SSO akan menembak **Endpoint Callback API Backend Anda** menggunakan HTTP `GET`.
3. Server SSO Pusat akan menyertakan JWT Token FSM langsung di dalam header `Authorization` **tanpa** prefix `"Bearer "`.
4. Backend Anda harus memvalidasi token tersebut, membuat sesi lokal (karena cookie tidak bisa di-set dari backend-to-backend calls), dan **merespons SSO Pusat dengan JSON** berisi kunci `"callback_url"`.
5. Server SSO Pusat akan me-redirect browser user ke `"callback_url"` tersebut (yang mengarah kembali ke frontend Anda beserta token/ID sesi lokal).

---

## 📝 2. Tugas Anda Sekarang

Tugas utama Anda saat ini BUKAN menulis kode integrasinya, melainkan **merumuskan parameter infrastrukturnya** agar Admin SSO bisa mendaftarkannya terlebih dahulu.

Tolong pelajari kode dan environtment aplikasi yang sedang Anda pegang, lalu isi formulir Markdown di bawah ini secara akurat. Jangan mengarang IP atau Port; gunakan konfigurasi yang benar-benar siap atau sedang digunakan di server internal aplikasi tersebut.

Silakan salin dan lengkapi blok di bawah ini, lalu berikan hasilnya kepada User agar bisa diteruskan ke Admin SSO:

```markdown
## Formulir Permintaan Integrasi SSO FSM

**[A] Identitas Aplikasi (Untuk Dashboard FSM)**
- **Nama Resmi Aplikasi**  : [Isi dengan nama baku aplikasi]
- **Deskripsi Singkat**    : [Maksimal 2 kalimat fungsi utama]
- **Role Pengguna**        : [Mahasiswa / Dosen / Staff - pilih yang relevan]
- **Idenetitas Visual**    : [Deskripsikan wujud logo yang diinginkan, Admin SSO akan men-generate logo 3D Premium]
- **Kategori Dashboard**   : [Pilih salah satu: Akademik / Persuratan / Kemahasiswaan / Fasilitas]

**[B] Data Jaringan Internal & Proxy**
*(Penting: tentukan subpath yang singkat dan merepresentasikan aplikasi)*
- **Subpath Frontend**     : [Misal: /lab-kimia/]
- **Subpath Backend API**  : [Misal: /lab-kimia-api/]
- **IP Server Internal**   : [IP VM tempat aplikasi ini berjalan, misal 10.137.58.12x]
- **Port Frontend**        : [Port aplikasi frontend berjalan, misal 20101]
- **Port Backend**         : [Port aplikasi backend berjalan, misal 20102]
- **Framework Frontend**   : [Sebutkan framework, misal: Next.js. Jika ya, pastikan Anda nanti menyetting basePath-nya!]
- **Framework Backend**    : [Sebutkan framework]

**[C] URL Integrasi (Gunakan domain publik apps-fsm.undip.ac.id)**
- **API Callback SSO**     : [Misal: https://apps-fsm.undip.ac.id/lab-kimia-api/auth/sso - ini endpoint GET yang akan Anda buat]
- **Redirect URI Home**    : [Misal: https://apps-fsm.undip.ac.id/lab-kimia/dashboard - tempat user mendarat setelah login sso]
```

Terima kasih atas kerja samanya. Setelah data ini dikembalikan, Admin SSO akan mendaftarkan aplikasi Anda, membuatkan Client ID (UUID), mengatur Nginx/Apache, dan kita bisa berlanjut ke tahap implementasi *code*.
