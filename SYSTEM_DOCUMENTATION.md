# 🌊 Hydromart Sales & Work Order System - Technical Documentation

Dokumen ini adalah "Ingatan Utama" (System Memory) untuk proyek Hydromart. Gunakan dokumen ini sebagai basis konteks jika berpindah ke sesi AI baru atau pengembang baru.

---

## 1. 🏗️ Tech Stack
Halaman muka menggunakan arsitektur modern yang dipisahkan antara Client (Vite/React) dan Server (PHP Native API).

- **Frontend**: Vite + React.js, Lucide Icons, Vanilla CSS (Premium Glassmorphism Design).
- **Backend**: PHP Native (PDO) REST API.
- **Database**: MySQL / MariaDB.
- **Tools**: `npx vite build` untuk produksi, Node.js untuk development env.

---

## 2. 🗄️ Database Schema (`hydromar_sales`)
Struktur data dirancang untuk mendukung multi-sales, multi-tim, dan audit trail.

### Tabel Utama:
- **`users`**: Data user (Sales, Admin, Manager), password (Bcrypt), status (`active`, `inactive`).
- **`roles`**: Master level akses (Admin=1, Manager=2, Sales=3).
- **`permissions` & `role_permissions`**: Role-Based Access Control (RBAC) yang sangat detail (e.g., `installation_read`, `workorder_showall`).
- **`companies`**: Master data pelanggan & prospek. Memiliki kolom `assigned_sales_id` (Legacy) tapi sistem sekarang fokus pada level instalasi.
- **`regions`**: Master area (Jabodetabek, Bali, dsb).
- **`company_pics`**: Data kontak person di setiap perusahaan.
- **`installations`**: **Core Table.** Menyimpan data filter/produk terpasang.
    - `assigned_to`: Foreign Key ke `users.id`. Menentukan siapa yang berhak melihat/mengelola data ini.
    - `replacement_date`: Tanggal target ganti (Lifecycle).
    - `maintenance_cycle`: Nilai recurring (e.g., 6 Bulan).
    - `is_history`: Flag 0/1 untuk membedakan data aktif vs arsip.
- **`handover_logs`**: Mencatat setiap kali ada transfer owner instalasi antar sales.
- **`user_sessions`**: Tracking login session (expire dalam 2 jam).

---

## 3. 🔐 Permission System (RBAC)
Sistem menggunakan permission string untuk menentukan visibilitas menu dan tombol di frontend.

### Logika Visibilitas Data:
1. **`all_access` / `showall`**: User bisa melihat semua data dari sales manapun (biasanya Admin/Manager).
2. **Team Based**: Jika user TIDAK punya `showall`, sistem akan mengecek tabel `team_members`. User bisa melihat data miliknya sendiri **DAN** data rekan satu timnya.
3. **Strict Ownership**: Jika input manual, user otomatis menjadi owner (`assigned_to`) dan pembuat (`created_by`).

### Key Permissions:
- `workorder_showall`: Bypass filter tim di Work Order.
- `installation_transfer`: Otoritas melakukan bulk transfer per company.
- `role_set_authority`: Akses ke matriks checkbox otoritas di Master Role.

---

## 4. ⚙️ Alur Logika Bisnis (Business Logic)

### A. Lifecycle Instalasi & Work Order
Data di **Work Order** berasal dari **Installations**.
- Jika sebuah produk mencapai `replacement_date`, sales melakukan **Renew**.
- **Proses Renew**: Data lama diubah status menjadi `Done` & `is_history = 1`, lalu sistem otomatis meng-insert baris baru (siklus baru) dengan `replacement_date` yang sudah dikalkulasi berdasarkan cycle (Hari/Bulan/Tahun).

### B. Bulk Transfer System
Fungsi ini memungkinkan Admin/Manager memindahkan **seluruh** aset instalasi sebuah perusahaan dari Sales A ke Sales B.
- Endpoint: `api/installations.php?action=transfer`.
- Efek: Mengubah kolom `assigned_to` secara masal + Menulis ke `handover_logs`.

### C. Modal Logic (UX)
Semua modal di aplikasi (`modal-overlay`) menerapkan:
- **X-Button**: Menutup modal.
- **Backdrop Click**: Klik di area gelap luar modal otomatis menutup (`setModalOpen(false)`).
- **Stop Propagation**: Klik di dalam konten modal tidak akan memicu penutupan.

---

## 5. 📂 Struktur File Utama

### Backend (`/api`)
- `db.php`: Koneksi PDO & Header CORS.
- `config.php`: Konfigurasi DB (Ubah ini saat pindah hosting).
- `auth.php`: Login, Register, Update Profile.
- `installations.php`: Jantung aplikasi (List, Create, Update, Renew, Transfer).
- `setup_permissions.php`: Master script untuk inisialisasi semua permission ke DB.
- `inject_permissions.php`: Script emergency untuk menambah permission baru tanpa reset DB.

### Frontend (`/web-poc/src`)
- `main.jsx`: Entry point dengan Error Boundary global.
- `App.jsx`: **The Core UI.** Berisi routing, state global, sidebar, dan semua komponen halaman (Dashboard, InstallationPage, dsb).
- `Login.jsx`: Halaman login dengan connection tester otomatis ke API.
- `App.css` & `index.css`: Styling premium dengan tema Blue-Sky/Glassmorphism.

---

## 6. 🚀 Cara Deploy / Setup di AI Baru
1. Pastikan database MySQL sudah dibuat menggunakan file `hydromart_sales_schema.sql`.
2. Ubah `api/config.php` sesuai kredensial database.
3. Jalankan `http://localhost/api/setup_permissions.php` (atau `inject_permissions.php`) untuk mengisi otoritas.
4. Di folder `web-poc`, buat file `.env` berisi `VITE_API_URL=http://localhost/api`.
5. Jalankan `npm install` lalu `npm run dev`.

---

## 7. 📝 Catatan Sesi Terakhir (Work Log)
- ✅ Implementasi Bulk Transfer per Company (Aksi 🔀 Transfer).
- ✅ Fix UX: Semua modal (12+ komponen) bisa ditutup via backdrop click.
- ✅ Fix Ownership: Menambah kolom `assigned_to` di tabel `installations`.
- ✅ Fix Permissions: Melonggarkan tombol Transfer agar terlihat oleh user dengan akses `installation_update` (fallback).
- ✅ Penghapusan tombol "Tambah WO" di halaman Work Order (WO dikelola via Input Instalasi).

---
*Dokumentasi ini dibuat pada 18 April 2026. Semua system sehat dan siap dilanjutkan.*
