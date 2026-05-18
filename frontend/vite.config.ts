import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./client", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  server: {
    port: 8080,
    strictPort: true,
    proxy: {
      // proxy API calls during development to avoid CORS
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
    css: false,
    // Increase timeout for slower tests
    testTimeout: 15000,
    // Use threads for parallel execution but limit workers
    pool: "threads",
    poolOptions: {
      threads: {
        // Limit to 3 threads to balance speed and memory
        minThreads: 1,
        maxThreads: 3,
      },
    },
    // Allow some isolation for test correctness
    isolate: true,
    // Limit concurrent tests per worker
    maxConcurrency: 3,
    // Run test files sequentially but tests within files can be concurrent
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      all: false,
      // Clean coverage between test runs
      clean: true,
      reportsDirectory: './coverage',
      exclude: [
        "client/components/ui/**",
        "client/components/skeletons/**",
        "client/server/**",
        "client/shared/**",
        "client/cypress/**",
        "cypress/**",
        "server/**",
        "shared/**",
        "**/vite.config.*",
        "**/tailwind.config.ts",
        "**/postcss.config.js",
        "cypress.config.ts",
        "client/vite-env.d.ts",
        "**/__tests__/**",
        "**/*.test.*",
        "**/*.spec.*",
        // Exclude complex components with integration dependencies
        "client/components/ImageViewer.tsx",
        "client/components/Layout.tsx",
        "client/components/UserManagement.tsx",
      ],
    },
  },
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
