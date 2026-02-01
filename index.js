// index.js (FINAL)
// RelayAI — Gemini Planner + Executor + Verifier + Proof Hash + Solana Devnet Proof
// Browser UI served from /public
// Optional ElevenLabs TTS
//
// REQUIREMENTS:
// - package.json: { "type": "module" }
// - Node.js v18+
// - .env with GEMINI_API_KEY
// - Optional: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
// - Solana: SOLANA_SECRET_KEY_JSON, SOLANA_RPC

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";

dotenv.config();

// ---------------------------
// App setup
// ---------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------
// Gemini setup
// ---------------------------
if (!process.env.GEMINI_API_KEY) {
  console.log("❌ Gemini key loaded: NO");
  process.exit(1);
}
console.log("✅ Gemini key loaded: YES");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ---------------------------
// Solana setup (Node-only, Devnet)
// ---------------------------
const SOLANA_RPC =
  process.env.SOLANA_RPC || "https://api.devnet.solana.com";

if (!process.env.SOLANA_SECRET_KEY_JSON) {
  console.log("❌ SOLANA_SECRET_KEY_JSON missing in .env");
  process.exit(1);
}

const solanaKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.SOLANA_SECRET_KEY_JSON))
);

const solanaConnection = new Connection(SOLANA_RPC, "confirmed");

async function submitProofToSolana(proofHash) {
  const MEMO_PROGRAM_ID = new PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
  );

  const memoIx = {
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(`RelayAI proof: ${proofHash}`, "utf8"),
  };

  const tx = new Transaction().add(
    memoIx,
    SystemProgram.transfer({
      fromPubkey: solanaKeypair.publicKey,
      toPubkey: solanaKeypair.publicKey,
      lamports: 0,
    })
  );

  const sig = await sendAndConfirmTransaction(
    solanaConnection,
    tx,
    [solanaKeypair],
    { commitment: "confirmed" }
  );

  return sig;
}

// ---------------------------
// Helpers
// ---------------------------
function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Fix Gemini ```json fenced responses
function extractJson(text) {
  if (!text) return "";
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a !== -1 && b !== -1) t = t.slice(a, b + 1);
  return t;
}

// In-memory sessions
const sessions = new Map();

// ---------------------------
// Routes
// ---------------------------
app.get("/", (req, res) => {
  res.send("RelayAI is running. Open /test or the UI.");
});

app.get("/test", async (req, res) => {
  const r = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Break 'Find cheapest flight to Dubai next month' into steps. Return JSON only.",
  });
  res.send(`<pre>${r.text}</pre>`);
});

// Interactive agent
app.post("/chat", async (req, res) => {
  try {
    const { sessionId, text } = req.body;
    if (!sessionId || !text)
      return res.status(400).json({ error: "sessionId and text required" });

    const session =
      sessions.get(sessionId) ?? { history: [], collected: {} };

    if (session.lastField) {
      session.collected[session.lastField] = text;
      delete session.lastField;
    } else {
      session.history.push({ role: "user", text });
    }

    const prompt = `
You are RelayAI.

Rules:
- Ask only necessary info.
- If more info needed:
  {"need_user_input": true, "question": "...", "field": "..."}
- If done:
  {"need_user_input": false, "final": {...}}
- JSON only, no markdown.

Collected: ${JSON.stringify(session.collected)}
History: ${JSON.stringify(session.history.slice(-6))}
`;

    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let parsed;
    try {
      parsed = JSON.parse(extractJson(resp.text));
    } catch {
      return res.json({ error: "Invalid JSON", raw: resp.text });
    }

    if (parsed.need_user_input) {
      session.lastField = parsed.field;
      sessions.set(sessionId, session);
      return res.json(parsed);
    }

    const proofHash = sha256Hex(
      JSON.stringify({ sessionId, final: parsed.final })
    );

    const solanaSig = await submitProofToSolana(proofHash);

    sessions.set(sessionId, session);

    res.json({
      ...parsed,
      proofHash,
      solana: {
        network: "devnet",
        wallet: solanaKeypair.publicKey.toBase58(),
        signature: solanaSig,
      },
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ElevenLabs TTS
app.post("/tts", async (req, res) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID)
      return res.status(400).json({ error: "ElevenLabs env missing" });

    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text required" });

    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
      }
    );

    const audio = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audio);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ---------------------------
app.listen(3000, () =>
  console.log("🚀 RelayAI running at http://localhost:3000")
);
