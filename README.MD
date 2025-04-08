Batch Token Sender Tool untuk Jaringan Tea Sepolia
🧩 Fitur Utama:
Mengirim token ERC20 ke banyak wallet sekaligus (batch).

Jumlah token acak per penerima, dalam rentang 0.003 – 1 TEA.

Ambil daftar wallet dari file JSON (recipients.json).

Hanya mengirim jika saldo cukup.

Menyimpan hasil log ke file batch-log.csv (berisi alamat, status, dan hash/error).

Jaringan: Tea Sepolia (chainId: 10218, RPC Alchemy).


project-folder/
├── batchSendToken.js
├── .env
├── recipients.json
└── batch-log.csv (akan otomatis dibuat)

.env (isi dengan private key kamu):
PRIVATE_KEY=0xYOUR_PRIVATE_KEY

recipients.json (alamat tujuan):

Cara Jalankan:
Install dependency:
npm init -y
npm install ethers dotenv prompt-sync
node batchSendToken.js

Contoh Output Log (batch-log.csv):

