require('dotenv').config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const prompt = require("prompt-sync")({ sigint: true });

// ====== INPUT USER ======
const TOKEN_ADDRESS = prompt("🪙 Masukkan alamat token ERC20: ").trim();
const MIN_TOKEN = prompt("🔢 Minimum token per wallet (contoh: 0.003): ").trim();
const MAX_TOKEN = prompt("🔢 Maksimum token per wallet (contoh: 1): ").trim();
const DELAY_MIN = parseInt(prompt("⏱️ Delay minimum antar tx (detik): ").trim());
const DELAY_MAX = parseInt(prompt("⏱️ Delay maksimum antar tx (detik): ").trim());

let delayMinMs = isNaN(DELAY_MIN) ? 1000 : DELAY_MIN * 1000;
let delayMaxMs = isNaN(DELAY_MAX) ? 30000 : DELAY_MAX * 1000;

if (delayMinMs > delayMaxMs) {
  console.log("⚠️ Delay minimum lebih besar dari maksimum, menggunakan default 1–30 detik.");
  delayMinMs = 1000;
  delayMaxMs = 30000;
}

const CONFIRM = prompt(`\n⚠️ Kirim token dari wallet di .env ke semua wallet di recipients.txt?\nMIN: ${MIN_TOKEN}, MAX: ${MAX_TOKEN}, Token: ${TOKEN_ADDRESS}\nKetik 'yes' untuk lanjut: `).toLowerCase();

if (CONFIRM !== 'yes') {
  console.log("❌ Operasi dibatalkan.");
  process.exit(0);
}

// ====== CONFIG ======
const RPC_URL = "https://tea-sepolia.g.alchemy.com/public";
const LOG_FILE = path.join(__dirname, "batch-log.csv");
const RECIPIENTS_PATH = path.join(__dirname, "recipients.txt");
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ====== ERC20 ABI ======
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint)",
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// ====== UTIL ======
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function initLog() {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "Recipient,Status,TxHash/Error\n");
  }
}

function writeLog(recipient, status, info) {
  const row = `"${recipient}","${status}","${info}"\n`;
  fs.appendFileSync(LOG_FILE, row);
}

// ====== LOAD WALLET LIST ======
let RECIPIENTS = [];
try {
  const raw = fs.readFileSync(RECIPIENTS_PATH, "utf8");
  const lines = raw.split(/\r?\n/).map(line => line.trim());
  RECIPIENTS = lines.filter(addr => ethers.isAddress(addr));
  console.log(`📥 ${RECIPIENTS.length} alamat dimuat dari recipients.txt\n`);
} catch (error) {
  console.error("❌ Gagal membaca recipients.txt:", error.message);
  process.exit(1);
}

// ====== RANDOM AMOUNT GENERATOR ======
function getRandomAmount(min, max, decimals) {
  const rand = Math.random() * (max - min) + min;
  const fixed = rand.toFixed(decimals > 6 ? 6 : decimals);
  return ethers.parseUnits(fixed.toString(), decimals);
}

// ====== MAIN FUNCTION ======
async function batchSend() {
  initLog();

  const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const minFloat = parseFloat(MIN_TOKEN);
  const maxFloat = parseFloat(MAX_TOKEN);
  let balance = await token.balanceOf(wallet.address);

  // 💡 Generate semua amount yang akan dikirim
  const amountList = RECIPIENTS.map(() => getRandomAmount(minFloat, maxFloat, decimals));
  const totalNeeded = amountList.reduce((sum, amt) => sum + BigInt(amt), 0n);

  console.log(`🔐 Wallet: ${wallet.address}`);
  console.log(`📦 Saldo awal: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
  console.log(`🧮 Total estimasi pengiriman: ${ethers.formatUnits(totalNeeded, decimals)} ${symbol}`);

  if (balance < totalNeeded) {
    console.log("❌ Saldo tidak mencukupi untuk semua transaksi. Operasi dibatalkan.");
    return;
  }

  console.log(`✅ Saldo cukup. Memulai pengiriman...\n`);

  for (let i = 0; i < RECIPIENTS.length; i++) {
    const recipient = RECIPIENTS[i];
    const amount = amountList[i];

    try {
      const tx = await token.transfer(recipient, amount);
      console.log(`⏳ Mengirim ${ethers.formatUnits(amount, decimals)} ${symbol} ke ${recipient}... TX: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Berhasil ke ${recipient}`);
      writeLog(recipient, "SUCCESS", `Tx: ${tx.hash}, Amount: ${ethers.formatUnits(amount, decimals)}`);
      balance = await token.balanceOf(wallet.address);
    } catch (err) {
      const errorMsg = err.reason || err.message || "Unknown error";
      console.error(`❌ Gagal kirim ke ${recipient}:`, errorMsg);
      writeLog(recipient, "FAILED", errorMsg);
    }

    console.log(`💰 Sisa saldo: ${ethers.formatUnits(balance, decimals)} ${symbol}`);

    // 💤 Delay antar transaksi (acak)
    const sleep = delayMinMs + Math.random() * (delayMaxMs - delayMinMs);
    console.log(`⏱️ Delay selama ${(sleep / 1000).toFixed(2)} detik...\n`);
    await delay(sleep);
  }

  console.log(`✅ Semua transaksi selesai. Log tersimpan di: ${LOG_FILE}`);
}

batchSend().catch(console.error);
