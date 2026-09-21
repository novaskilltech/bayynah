import { spawn } from "node:child_process";

// Sur Linux / CI (GitHub Actions avec ext4), Next.js 16 compile nativement avec Turbopack (par défaut).
// Sur Windows (sur les volumes FAT32/exFAT ne supportant pas les points de jonction NTFS, code d'erreur os 1),
// bascule automatique et transparente vers --webpack pour garantir un build local 100% fonctionnel.
const isWindows = process.platform === "win32";
const args = isWindows ? ["build", "--webpack"] : ["build"];

console.log(`[build] Exécution de Next.js 16 (${isWindows ? "Webpack - Compatibilité Windows FAT32" : "Turbopack - Linux/CI"})...`);

const child = spawn("npx", ["next", ...args], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
