// Starts the dev server with local sign-in and the local JSON store, ignoring the Supabase values in .env.
// No email is sent and nothing leaves this computer. Use it to look at the app: npm run dev:local
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  AUTH_MODE: "local",
  ALLOW_LOCAL_AUTH: "true",
  DATABASE_URL: "",
  SUPABASE_URL: "",
  SUPABASE_PUBLISHABLE_KEY: "",
  SUPABASE_SECRET_KEY: "",
  DATA_DIR: ".data-dev-local",
  LOCAL_FREE_CREDITS: process.env.LOCAL_FREE_CREDITS || "100",
  // Sign in with this address locally to see the admin panel. Production has no default: ADMIN_EMAILS must be set on purpose.
  ADMIN_EMAILS: process.env.ADMIN_EMAILS || "owner@orbitshelf.local",
};

const child = spawn("npx", ["next", "dev", "-p", process.env.PORT || "3000"], { stdio: "inherit", env, shell: true });
child.on("exit", (code) => process.exit(code ?? 0));
