import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, readdirSync, writeFileSync } from "fs";

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

  // Build client bundle (run vite build inside app directory)
  const webDir = join(__dirname, "..");
  console.log(`Running build inside directory: ${webDir}`);
  try {
    execSync("npx vite build", { cwd: webDir, stdio: "inherit" });
  } catch (e) {
    console.error("Vite build failed.");
    process.exit(1);
  }

  // Generate static index.html and 200.html in .output/public for static site hosts (Render/Vercel/Netlify)
  const publicDir = join(webDir, ".output/public");
  const assetsDir = join(publicDir, "assets");

  if (existsSync(assetsDir)) {
    const files = readdirSync(assetsDir);
    const mainCss = files.find(f => f.startsWith("styles-") && f.endsWith(".css"));

    const jsFiles = files.filter(f => f.endsWith(".js"));
    const scriptTags = jsFiles
      .filter(f => f.startsWith("_app") || f.startsWith("routes") || f.startsWith("setup") || f.startsWith("index"))
      .map(f => `<script type="module" src="/assets/${f}"></script>`)
      .join("\n    ");

    const htmlContent = `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bizora OS — AI Business Operating System</title>
    ${mainCss ? `<link rel="stylesheet" href="/assets/${mainCss}">` : ''}
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
  </head>
  <body>
    <div id="root"></div>
    ${scriptTags}
  </body>
</html>`;

    writeFileSync(join(publicDir, "index.html"), htmlContent);
    writeFileSync(join(publicDir, "200.html"), htmlContent);
    console.log("Successfully generated static index.html and 200.html in .output/public");
  }
};

main();
