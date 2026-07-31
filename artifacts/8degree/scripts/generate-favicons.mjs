#!/usr/bin/env node
/**
 * Regenerate PNG/ICO favicon assets from public/favicon.svg.
 * Run: node ./scripts/generate-favicons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const svgPath = path.join(publicDir, "favicon.svg");
const svg = fs.readFileSync(svgPath, "utf8");

function renderPng(size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "#01514E",
  });
  return resvg.render().asPng();
}

function writePng(filename, size) {
  const out = path.join(publicDir, filename);
  fs.writeFileSync(out, renderPng(size));
  console.log(`[favicons] wrote ${filename} (${size}px)`);
}

function writeIco(filename, sizes) {
  // Minimal ICO: single PNG embedded (browsers accept PNG-in-ICO for modern favicons).
  const png = renderPng(sizes[0]);
  fs.writeFileSync(path.join(publicDir, filename), png);
  console.log(`[favicons] wrote ${filename} (${sizes[0]}px png-as-ico)`);
}

writePng("favicon-32.png", 32);
writePng("favicon-48.png", 48);
writePng("apple-touch-icon.png", 180);
writePng("icon-512.png", 512);
writeIco("favicon.ico", [32]);

const balinestDir = path.join(publicDir, "balinest");
for (const name of ["favicon-32.png", "favicon.ico", "apple-touch-icon.png"]) {
  fs.copyFileSync(path.join(publicDir, name), path.join(balinestDir, name));
  console.log(`[favicons] copied ${name} → balinest/`);
}
