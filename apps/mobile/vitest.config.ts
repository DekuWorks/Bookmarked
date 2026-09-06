import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "../../packages/utils/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "\\.(png|jpg|jpeg|gif|webp)$": path.resolve(__dirname, "src/__mocks__/fileMock.ts"),
    },
  },
});
