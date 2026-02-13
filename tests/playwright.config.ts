import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    // SESUAIKAN DENGAN HASIL TERMINAL JURAGAN
    baseURL: "http://localhost:3001",
    trace: "on",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: true,
  },
});
