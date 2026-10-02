import { defineConfig } from "rolldown";

const dev = process.argv.includes("--watch");

export default defineConfig({
  input: "src/dashboard-collections.ts",
  output: {
    file: "dist/ha-dashboard-collections.js",
    format: "es",
    minify: !dev,
    sourcemap: dev ? "inline" : false,
    codeSplitting: false,
  },
});
