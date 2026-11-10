#!/usr/bin/env node
// Sube a Cloudflare R2 (bucket del proyecto, conectado en Roble) las portadas
// y los documentos ficticios de la demo, y registra sus referencias en Roble:
//   - portadas   → proyectos/imagenes   → projects.imageFileId
//   - documentos → proyectos/documentos → fila en project_attachments
//
// Se ejecuta COMO LA CREADORA de los proyectos (prueba.creador@uninorte.edu.co),
// porque en Roble solo la dueña puede actualizar sus proyectos y solo quien sube
// un archivo puede borrarlo. Usa la misma API que la app: Roble firma una URL
// temporal y el archivo va directo al bucket. Las credenciales de R2 nunca
// salen de Roble.
//
// La contraseña se pide al ejecutar (no se muestra, no se guarda, no va en
// argumentos ni en archivos).
//
// Uso (desde la carpeta del proyecto, Node 18+):
//   node scripts/demo/subir_archivos_demo.mjs            sube lo que falte
//   node scripts/demo/subir_archivos_demo.mjs --forzar   vuelve a subir las portadas
//   node scripts/demo/subir_archivos_demo.mjs --borrar   borra de R2 y de Roble los archivos demo
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, "..", "..");
const SEED = "demo-2026-11";
const EMAIL = process.env.DEMO_EMAIL ?? "prueba.creador@uninorte.edu.co";
const args = new Set(process.argv.slice(2));

// ── Configuración: la misma que usa la app (.env o dart_defines.json) ──
function loadConfig() {
  const cfg = {};
  const defines = path.join(ROOT, "dart_defines.json");
  if (fs.existsSync(defines)) Object.assign(cfg, JSON.parse(fs.readFileSync(defines, "utf8")));
  const env = path.join(ROOT, ".env");
  if (fs.existsSync(env)) {
    for (const line of fs.readFileSync(env, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && m[2] !== "") cfg[m[1]] = m[2];
    }
  }
  if (!cfg.ROBLE_BASE_URL || !cfg.ROBLE_CONTRACT_ID) throw new Error("Falta ROBLE_BASE_URL o ROBLE_CONTRACT_ID (.env o dart_defines.json).");
  const base = cfg.ROBLE_BASE_URL.replace(/\/$/, "");
  return { auth: `${base}/auth/${cfg.ROBLE_CONTRACT_ID}`, data: `${base}/database/${cfg.ROBLE_CONTRACT_ID}` };
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = false;
    rl._writeToOutput = (s) => rl.output.write(rl.stdoutMuted ? (s.includes("\n") ? "\n" : "") : s);
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    rl.stdoutMuted = true;
  });
}

const { auth: AUTH, data: DATA } = loadConfig();
let token = null;

async function api(base, method, endpoint, { body, query } = {}) {
  const url = new URL(`${base}/${endpoint}`);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) throw new Error(`${method} ${endpoint} → HTTP ${res.status}: ${json?.message ?? text}`);
  return json;
}
const db = {
  read: (tableName, filters = {}) => api(DATA, "GET", "read", { query: { tableName, ...filters } }),
  insert: (tableName, record) => api(DATA, "POST", "insert-one", { body: { tableName, record } }),
  update: (tableName, id, updates) => api(DATA, "PUT", "update", { body: { tableName, idColumn: "_id", idValue: id, updates } }),
  remove: (tableName, id) => api(DATA, "DELETE", "delete", { body: { tableName, idColumn: "_id", idValue: id } }),
};

const MIME = { ".png": "image/png", ".pdf": "application/pdf", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

async function upload(filePath, folder) {
  const data = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const mimeType = MIME[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";
  const { fileId, uploadUrl } = await api(DATA, "POST", "storage/objects", {
    body: { fileName, mimeType, sizeBytes: data.length, folder },
  });
  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": mimeType }, body: data });
  if (!put.ok) throw new Error(`PUT al bucket → HTTP ${put.status}`);
  await api(DATA, "POST", `storage/objects/${encodeURIComponent(fileId)}/complete`);
  return { fileId: String(fileId), fileName, mimeType, sizeBytes: data.length };
}

const COVERS = {
  INSTAGRAM: "instagram.png",
  CHISPA: "chispa.png",
  "POLAR CRAVING": "polar.png",
  ARTFEST: "artfest.png",
  DUO: "duo.png",
};
const DOCUMENTS = {
  INSTAGRAM: ["Plan del piloto INSTAGRAM.docx"],
  CHISPA: ["Investigación agrupaciones CHISPA.pdf"],
  "POLAR CRAVING": ["Propuesta comercial POLAR CRAVING.pdf"],
  ARTFEST: ["Bases convocatoria ARTFEST.pdf"],
};

async function main() {
  const { projects: ids } = JSON.parse(fs.readFileSync(path.join(DIR, "demo_ids.json"), "utf8"));
  console.log(`Roble: ${AUTH}`);
  const password = await askHidden(`Contraseña de ${EMAIL} (no se muestra): `);
  const login = await api(AUTH, "POST", "login", { body: { email: EMAIL, password } });
  token = login.accessToken;
  const me = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).sub;
  console.log(`Sesión iniciada como ${EMAIL}`);

  for (const [name, id] of Object.entries(ids)) {
    const [project] = await db.read("projects", { _id: id });
    if (!project) {
      console.log(`· ${name}: no existe (¿ejecutaste el seed SQL?) — se omite`);
      continue;
    }
    if (project._owner && project._owner !== me) {
      console.log(`· ${name}: no es de ${EMAIL} — se omite`);
      continue;
    }

    if (args.has("--borrar")) {
      if (project.imageFileId) {
        await api(DATA, "DELETE", `storage/objects/${encodeURIComponent(project.imageFileId)}`).catch((e) => console.log(`  aviso: ${e.message}`));
        await db.update("projects", id, { imageFileId: null });
        console.log(`· ${name}: portada borrada`);
      }
      const docs = await db.read("project_attachments", { projectId: id });
      for (const d of docs.filter((x) => x.demoSeed === SEED)) {
        await api(DATA, "DELETE", `storage/objects/${encodeURIComponent(d.fileId)}`).catch((e) => console.log(`  aviso: ${e.message}`));
        await db.remove("project_attachments", d._id);
        console.log(`· ${name}: documento borrado (${d.fileName})`);
      }
      continue;
    }

    if (!project.imageFileId || args.has("--forzar")) {
      const f = await upload(path.join(DIR, "portadas", COVERS[name]), "proyectos/imagenes");
      await db.update("projects", id, { imageFileId: f.fileId });
      console.log(`· ${name}: portada subida (${f.fileName}, ${(f.sizeBytes / 1024).toFixed(0)} KB) → fileId ${f.fileId}`);
    } else {
      console.log(`· ${name}: ya tiene portada (${project.imageFileId})`);
    }

    const existing = new Set((await db.read("project_attachments", { projectId: id })).map((d) => d.fileName));
    for (const docName of DOCUMENTS[name] ?? []) {
      if (existing.has(docName)) {
        console.log(`  ${docName}: ya estaba`);
        continue;
      }
      const f = await upload(path.join(DIR, "documentos", docName), "proyectos/documentos");
      await db.insert("project_attachments", {
        projectId: id,
        fileId: f.fileId,
        fileName: f.fileName,
        extension: path.extname(f.fileName).slice(1).toLowerCase(),
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        folder: "proyectos/documentos",
        kind: "document",
        uploadedBy: me,
        createdAt: new Date().toISOString(),
        demoSeed: SEED,
      });
      console.log(`  ${docName}: subido y registrado`);
    }
  }

  const files = await api(DATA, "GET", "storage/objects");
  console.log(`\nArchivos en el bucket visibles para esta sesión: ${Array.isArray(files) ? files.length : 0}`);
  for (const f of Array.isArray(files) ? files : []) console.log(`  ${f.folder ?? "(raíz)"}/${f.file_name} · ${f.size_bytes ?? "?"} B`);
}

main().catch((e) => {
  console.error(`\nError: ${e.message}`);
  process.exit(1);
});
