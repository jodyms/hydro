# Standard Pembuatan Page Master Data - Hydromart

Dokumen ini berisi standar teknis untuk pembuatan dan modifikasi halaman Master Data dalam aplikasi Hydromart. Seluruh modul baru wajib mengikuti struktur ini untuk menjaga konsistensi, auditability, dan user experience premium.

## 1. Komponen Utama & Layout
- **Halaman**: Setiap modul harus menggunakan `page-container`.
- **Top Bar**: Memiliki judul halaman, Checkbox "Tampilkan Nonaktif", dan Tombol "Tambah [Data]" (jika memiliki otoritas).
- **Tabel**: Menggunakan komponen `DataTable` untuk menampilkan data secara dinamis dengan fitur sort, search, dan pagination otomatis.

## 2. Fitur Audit (Wajib)
Semua tabel master data harus mencatat dan menampilkan informasi audit berikut:
- **Created By** (`created_by`): Menyimpan ID user pembuat saat *insert*.
- **Updated By** (`updated_by`): Menyimpan ID user terakhir yang melakukan perubahan saat *update*.
- **Kolom Tabel**: Wajib menampilkan kolom "Dibuat Oleh" dan "Diubah Oleh" pada `DataTable`.

## 3. Otoritas & Keamanan (RBAC)
- Gunakan fungsi `can('permission_name')` untuk pengecekan hak akses di frontend.
- **Read**: `if (!can('module_read')) return <AccessDenied />`.
- **Create/Update/Delete**: Bungkus tombol aksi dengan pengecekan `can()`.
- **Backend API**: Pastikan API menerima `user_id` dari frontend untuk kebutuhan kolom `updated_by`.

## 4. Advanced Filter (Multi-Select)
Jika diperlukan filter khusus (seperti filter Region atau Company), wajib mengikuti standar berikut:
- **Autocomplete Multi-Select**: Menggunakan input dengan `datalist` yang terintegrasi dengan "Tags/Chips".
- **Case-Insensitive**: Pencarian filter tidak boleh sensitif terhadap huruf besar/kecil.
- **UI Premium**: Tag pilihan harus muncul di **dalam** kotak filter (menggunakan `flex-wrap`) agar tidak merusak tata letak atau membuat baris baru yang tidak rapi.
- **DataTable Search**: Gunakan fitur pencarian bawaan `DataTable` untuk pencarian teks umum; jangan membuat input pencarian manual tambahan jika fitur ini sudah cukup.

## 5. Metadata Khusus
- **Inactive Records**: Selalu gunakan filter `status_active` (atau kolom status lain) dan berikan opsi "Tampilkan Nonaktif" kepada user.
- **Aksi Status**: Gunakan tombol toggle/badge yang jelas untuk mengaktifkan atau menonaktifkan data (soft-delete).

---
*Dibuat pada: 2026-04-05*
