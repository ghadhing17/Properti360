import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ADMIN hanya dibuat via seed/manual — tidak via /register
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@properti360.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const adminName = process.env.SEED_ADMIN_NAME || "Admin Properti360";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    // Pastikan role ADMIN & password ter-update jika env berbeda
    const hash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN", password: hash, name: adminName },
    });
    console.log(`[seed] Admin updated: ${adminEmail} (ADMIN)`);
  } else {
    const hash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hash,
        role: "ADMIN",
      },
    });
    console.log(`[seed] Admin created: ${adminEmail} / ${adminPassword} (ADMIN)`);
  }

  // Optional: contoh customer untuk testing
  const customerEmail = "customer@test.local";
  const hasCustomer = await prisma.user.findUnique({ where: { email: customerEmail } });
  if (!hasCustomer) {
    const hash = await bcrypt.hash("Customer123!", 10);
    await prisma.user.create({
      data: {
        name: "Customer Test",
        email: customerEmail,
        password: hash,
        role: "CUSTOMER",
      },
    });
    console.log(`[seed] Customer created: ${customerEmail} / Customer123! (CUSTOMER)`);
  }

  console.log("[seed] Done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
