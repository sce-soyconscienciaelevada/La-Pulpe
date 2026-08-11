// CLI entry for the demo seed — logic lives in src/lib/demo/seedDemo.ts so
// POST /api/demo/reseed can call the exact same function (no drift between
// the nightly reseed and the one-time setup).
import { seedDemo } from "../src/lib/demo/seedDemo";
import { prisma } from "../src/lib/prisma";

seedDemo()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
