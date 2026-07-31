// One-time backfill: apply properName() to every existing row so names
// created before this fix (all lowercase, no accents) match what new writes
// will look like from now on.
//
// Dry-run by default — prints every row that WOULD change, changes nothing.
// Pass --apply to actually write.
//
// Usage:
//   DOTENV_CONFIG_PATH=barmgmt.local.secrets npx tsx --require=dotenv/config scripts/normalize-existing-names.ts
//   DOTENV_CONFIG_PATH=barmgmt.local.secrets npx tsx --require=dotenv/config scripts/normalize-existing-names.ts --apply

import { prisma } from "../src/lib/prisma";
import { properName } from "../src/lib/text-normalize";

const APPLY = process.argv.includes("--apply");

async function main() {
  let changed = 0;

  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  for (const p of products) {
    const next = properName(p.name);
    if (next !== p.name) {
      changed++;
      console.log(`Product   "${p.name}" -> "${next}"`);
      if (APPLY) await prisma.product.update({ where: { id: p.id }, data: { name: next } });
    }
  }

  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
  for (const s of suppliers) {
    const next = properName(s.name);
    if (next !== s.name) {
      changed++;
      console.log(`Supplier  "${s.name}" -> "${next}"`);
      if (APPLY) await prisma.supplier.update({ where: { id: s.id }, data: { name: next } });
    }
  }

  const people = await prisma.person.findMany({ select: { id: true, name: true } });
  for (const p of people) {
    const next = properName(p.name);
    if (next !== p.name) {
      changed++;
      console.log(`Person    "${p.name}" -> "${next}"`);
      if (APPLY) await prisma.person.update({ where: { id: p.id }, data: { name: next } });
    }
  }

  const glassware = await prisma.glasswareItem.findMany({ select: { id: true, name: true } });
  for (const g of glassware) {
    const next = properName(g.name);
    if (next !== g.name) {
      changed++;
      console.log(`Glassware "${g.name}" -> "${next}"`);
      if (APPLY) await prisma.glasswareItem.update({ where: { id: g.id }, data: { name: next } });
    }
  }

  const reorderItems = await prisma.reorderItem.findMany({ select: { id: true, name: true } });
  for (const r of reorderItems) {
    const next = properName(r.name);
    if (next !== r.name) {
      changed++;
      console.log(`Reorder   "${r.name}" -> "${next}"`);
      if (APPLY) await prisma.reorderItem.update({ where: { id: r.id }, data: { name: next } });
    }
  }

  const consumptions = await prisma.consumption.findMany({
    where: { freeText: { not: null } },
    select: { id: true, freeText: true },
  });
  for (const c of consumptions) {
    if (!c.freeText) continue;
    const next = properName(c.freeText);
    if (next !== c.freeText) {
      changed++;
      console.log(`FreeText  "${c.freeText}" -> "${next}"`);
      if (APPLY) await prisma.consumption.update({ where: { id: c.id }, data: { freeText: next } });
    }
  }

  console.log(`\n${changed} row(s) ${APPLY ? "updated" : "would change"}.`);
  if (!APPLY && changed > 0) console.log("Re-run with --apply to write these changes.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
