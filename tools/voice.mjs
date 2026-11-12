// Озвучка книги через ElevenLabs: собирает все английские фразы из src/content.js (+ подсказки AiCo),
// генерирует mp3 в public/voice/ и пишет manifest.json { "текст": "файл.mp3" }.
// Уже озвученные фразы не тратят символы повторно (кэш по голосу + модели + тексту).
//   node tools/voice.mjs            — озвучить недостающее
//   node tools/voice.mjs --dry      — только посчитать символы
// Ключ берётся из ELEVENLABS_API_KEY или из ~/Desktop/Максат Бренд/maksat-brand/.env
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allLines, VOICE } from '../src/voicelines.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'voice');
const MANIFEST = join(OUT, 'manifest.json');
const dry = process.argv.includes('--dry');

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const env = join(homedir(), 'Desktop', 'Максат Бренд', 'maksat-brand', '.env');
  if (existsSync(env)) {
    const m = readFileSync(env, 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  throw new Error('Нет ELEVENLABS_API_KEY');
}

export const fileFor = (line) =>
  createHash('sha1').update([line.voice, VOICE.model, JSON.stringify(line.settings), line.text].join('|')).digest('hex').slice(0, 16) + '.mp3';

async function tts(key, line) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${line.voice}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: line.text, model_id: VOICE.model, language_code: line.lang, voice_settings: line.settings }),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const lines = allLines();
  const manifest = {};
  const todo = [];
  for (const l of lines) {
    const f = fileFor(l);
    manifest[l.text] = f;
    if (!existsSync(join(OUT, f))) todo.push({ ...l, f });
  }
  const chars = todo.reduce((n, l) => n + l.text.length, 0);
  console.log(`фраз всего: ${lines.length}, озвучить: ${todo.length}, символов: ${chars}`);
  if (dry) return;
  const key = todo.length ? apiKey() : null;
  let done = 0;
  const writeManifest = () => {
    const have = Object.fromEntries(Object.entries(manifest).filter(([, f]) => existsSync(join(OUT, f))));
    writeFileSync(MANIFEST, JSON.stringify(have));
    return Object.keys(have).length;
  };
  try {
  // по 4 запроса параллельно — в пределах лимита Starter
  for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(todo.slice(i, i + 4).map(async (l) => {
      for (let a = 0; a < 3; a++) {
        try { writeFileSync(join(OUT, l.f), await tts(key, l)); done++; return; } catch (e) {
          if (a === 2) throw new Error(`«${l.text}»: ${e.message}`);
          await new Promise((r) => setTimeout(r, 1500 * (a + 1)));
        }
      }
    }));
    process.stdout.write(`\r${done}/${todo.length}`);
  }
  } finally {
    console.log(`\nmanifest: ${writeManifest()} из ${lines.length} фраз`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
