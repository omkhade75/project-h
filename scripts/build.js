import { execSync } from "child_process";

const run = (cmd) => {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (e) {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
};

const main = () => {
  // Generate Prisma client
  run("npx prisma generate");

  // Only run database migrations if DATABASE_URL is provided and not a placeholder
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes("placeholder") && !dbUrl.includes("your_")) {
    console.log("DATABASE_URL found. Provisioning database schema...");
    run("npx prisma db push --accept-data-loss");
  } else {
    console.log("No DATABASE_URL found or DATABASE_URL is placeholder. Skipping database schema sync. Running in offline/mock fallback mode.");
  }

  // Build client bundle
  run("npx vite build");
};

main();
