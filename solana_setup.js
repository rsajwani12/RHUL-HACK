import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from "fs";

const RPC = "https://api.devnet.solana.com";
const connection = new Connection(RPC, "confirmed");

async function main() {
  console.log("Generating new Solana devnet keypair...");
  const kp = Keypair.generate();

  const secretArr = Array.from(kp.secretKey); // Convert secret key to array
  fs.writeFileSync("keypair.json", JSON.stringify(secretArr)); // Save to file

  console.log("✅ Saved keypair.json");
  console.log("Public address:", kp.publicKey.toBase58());

  console.log("Requesting 1 SOL airdrop...");
  const sig = await connection.requestAirdrop(kp.publicKey, 1 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, "confirmed");
  console.log("✅ Airdrop confirmed:", sig);

  console.log("\nCOPY THIS into your .env exactly:");
  console.log(`SOLANA_SECRET_KEY_JSON=${JSON.stringify(secretArr)}`);
  console.log(`SOLANA_RPC=${RPC}`);
}

main().catch((e) => {
  console.error("❌ Error:", e?.message || e);
  process.exit(1);
});
