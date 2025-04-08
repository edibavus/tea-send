require("dotenv").config();
const { ethers } = require("ethers");
const prompt = require("prompt-sync")();
const fs = require("fs");
const path = require("path");

// ====== RPC & Wallet Setup ======
const provider = new ethers.JsonRpcProvider("https://tea-sepolia.g.alchemy.com/public");
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ====== Load Recipients ======
const recipientsPath = path.join(__dirname, "recipients.txt");
const recipients = fs
  .readFileSync(recipientsPath, "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line !== "");

// ====== CLI Input ======
const minAmount = parseFloat(prompt("🔢 Minimum TEA per wallet (misal: 0.003): "));
const maxAmount = parseFloat(prompt("🔢 Maksimum TEA per wallet (misal: 1): "));
const minDelay = parseInt(prompt("⏱️ Delay minimum antar tx (detik): "), 10);
const maxDelay = parseInt(prompt("⏱️ Delay maksimum antar tx (detik): "), 10);

console.log(`\n🚀 Akan mengirim TEA dari wallet ${wallet.address}`);
console.log(`🎯 Jumlah wallet: ${recipients.length}`);
console.log(`💸 Min TEA: ${minAmount}, Max TEA: ${maxAmount}`);
console.log(`⏳ Delay: ${minDelay}s ~ ${maxDelay}s\n`);

// ====== Estimasi Total Kebutuhan ======
function getRandomAmount() {
  return (Math.random() * (maxAmount - minAmount) + minAmount);
}
const estimatedTotal = recipients.reduce((total) => total + getRandomAmount(), 0);
console.log(`💰 Estimasi kebutuhan total: ~${estimatedTotal.toFixed(4)} TEA`);

const confirm = prompt("Ketik 'yes' untuk lanjut: ");
if (confirm.toLowerCase() !== "yes") {
  console.log("❌ Dibatalkan.");
  process.exit();
}

// ====== Cek Saldo Wallet ======
async function checkBalance() {
  const balance = await provider.getBalance(wallet.address);
  const balanceInTEA = parseFloat(ethers.formatEther(balance));
  if (balanceInTEA < estimatedTotal) {
    console.log(`❌ Saldo tidak cukup: hanya ${balanceInTEA} TEA`);
    process.exit();
  } else {
    console.log(`✅ Saldo cukup: ${balanceInTEA} TEA\n`);
  }
}

// ====== Helper Delay ======
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ====== Proses Kirim Native Token ======
async function sendNativeTokens() {
  await checkBalance();
  const logFile = path.join(__dirname, "batch-log.csv");
  fs.writeFileSync(logFile, "Recipient,Status,TxHash/Error\n");

  for (const recipient of recipients) {
    const amount = getRandomAmount();
    const value = ethers.parseEther(amount.toFixed(6));

    try {
      const tx = await wallet.sendTransaction({
        to: recipient,
        value: value,
      });
      await tx.wait();
      console.log(`✅ Sukses: ${recipient} ← ${amount.toFixed(6)} TEA (${tx.hash})`);
      fs.appendFileSync(logFile, `${recipient},SUCCESS,${tx.hash}\n`);
    } catch (err) {
      console.log(`❌ Gagal: ${recipient} (${err.message})`);
      fs.appendFileSync(logFile, `${recipient},FAILED,${err.message}\n`);
    }

    const delayTime = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
    console.log(`⏳ Delay ${delayTime} detik...\n`);
    await delay(delayTime * 1000);
  }

  console.log("\n📄 Selesai. Log disimpan di: batch-log.csv");
}

sendNativeTokens();
