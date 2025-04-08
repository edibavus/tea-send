# 🧪 Batch Token Sender Tool untuk Jaringan Tea Sepolia

Alat ini memungkinkan kamu mengirim token ERC20 ke banyak alamat sekaligus dengan jumlah acak per penerima, langsung di jaringan **Tea Sepolia**.

---

## 🧩 Fitur Utama

- 🚀 Mengirim token ERC20 ke banyak wallet sekaligus (batch).
- 🎲 Jumlah token **acak** per penerima, dalam rentang **0.003 – 1 TEA**.
- 📂 Mengambil daftar wallet dari file **`recipients.json`**.
- 🛡️ Hanya mengirim jika saldo cukup.
- 📝 Menyimpan hasil log ke file **`batch-log.csv`** (berisi alamat, status, dan hash/error).
- 🌐 Jaringan: **Tea Sepolia** (`chainId: 10218`, RPC via Alchemy).

---

## 📁 Struktur Proyek

```
project-folder/
├── batchSendToken.js
├── .env
├── recipients.json
└── batch-log.csv  ← (akan otomatis dibuat)
```

---

## 🔐 Konfigurasi `.env`

Buat file `.env` dan masukkan private key kamu:

```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

---

## 📄 Format `recipients.json`

File ini harus berisi array dari alamat wallet tujuan:

```json
0x123...
0xabc...
0xdef...

```

---

## ⚙️ Cara Menjalankan

1. Inisialisasi project:

```bash
npm init -y
```

2. Install dependency:

```bash
npm install ethers dotenv prompt-sync
```

3. Jalankan script:

```bash
node batchSendToken.js
```

---

## 📌 Catatan

- Pastikan wallet kamu memiliki cukup token TEA di jaringan **Tea Sepolia**.
- Gunakan **RPC Alchemy** yang sesuai dengan chainId `10218`.

---


## 🧪 License

MIT © 2025
