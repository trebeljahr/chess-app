import { createHash, randomUUID } from "node:crypto";
import { linkSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Publish before readiness; never replace bytes behind an immutable Vite URL.
// Retention is deliberate: remove releases only after their browser lifetime.
export function retainAssets(distDir, storeDir) {
  if (!storeDir) return;
  mkdirSync(storeDir, { recursive: true });
  function copy(directory, prefix = "") {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = join(prefix, entry.name);
      if (entry.isDirectory()) {
        copy(join(directory, entry.name), relative);
        continue;
      }
      if (!entry.isFile()) throw new Error("Asset source must contain only regular files");
      const bytes = readFileSync(join(directory, entry.name));
      const target = join(storeDir, relative);
      mkdirSync(resolve(target, ".."), { recursive: true });
      const temporary = `${target}.${randomUUID()}.pending`;
      writeFileSync(temporary, bytes, { flag: "wx", mode: 0o644 });
      try {
        try {
          linkSync(temporary, target);
        } catch (error) {
          if (error.code !== "EEXIST" || digest(readFileSync(target)) !== digest(bytes))
            throw new Error("Immutable asset collision or publication failure");
        }
      } finally {
        unlinkSync(temporary);
      }
    }
  }
  copy(join(distDir, "assets"));
}

export function retainedAssetPath(storeDir, pathname) {
  if (!storeDir || !pathname.startsWith("/assets/")) return null;
  const relative = decodeURIComponent(pathname.slice("/assets/".length));
  const root = resolve(storeDir);
  const path = resolve(root, relative);
  return path.startsWith(root + sep) ? path : null;
}
