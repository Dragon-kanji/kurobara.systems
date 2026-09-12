import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  build: {
    cssCodeSplit: true,
    rolldownOptions: {
      input: {
        studio: fileURLToPath(new URL("./index.html", import.meta.url)),
        ...(mode === "standalone"
          ? {}
          : {
              product: fileURLToPath(
                new URL("./kurobara/index.html", import.meta.url)
              ),
            }),
      },
    },
    sourcemap: false,
    target: "es2022",
  },
}));
