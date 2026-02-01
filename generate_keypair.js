import { Keypair } from "@solana/web3.js";
import fs from "fs";

// Generate a new Solana keypair
const kp = Keypair.generate();

// Convert the secret key into an array of integers
const secretArr = Array.from(kp.secretKey);

// Save the keypair in a JSON file (optional)
fs.writeFileSync("keypair.json", JSON.stringify(secretArr));

// Log the generated secret key array
console.log("Generated secret key array: ", secretArr);
