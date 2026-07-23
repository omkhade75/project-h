import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  const schemaPath = join(__dirname, "../../../packages/database/prisma/schema.prisma");
  console.log(`Using database schema path: ${schemaPath}`);

  // Generate Prisma client
  run(`npx prisma generate --schema="${schemaPath}"`);

  // Only run database migrations if DATABASE_URL is provided and not a placeholder
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes("placeholder") && !dbUrl.includes("your_")) {
    console.log("DATABASE_URL found. Provisioning database schema...");
    run(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`);
  } else {
    console.log("No DATABASE_URL found or DATABASE_URL is placeholder. Skipping database schema sync. Running in offline/mock fallback mode.");
  }

  // Build client bundle (run vite build inside apps/web directory)
  const webDir = join(__dirname, "..");
  console.log(`Running build inside directory: ${webDir}`);
  try {
    execSync("npx vite build", { cwd: webDir, stdio: "inherit" });
  } catch (e) {
    console.error("Vite build failed.");
    process.exit(1);
  }
};

main();
