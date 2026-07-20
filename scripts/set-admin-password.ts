import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const newPassword = process.argv[2];
  if (!newPassword) {
    console.error("Usage: tsx scripts/set-admin-password.ts <new-password>");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { email: "pablo@lapulpe.local" },
    data: { passwordHash },
  });
  console.log(`Password updated for ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
