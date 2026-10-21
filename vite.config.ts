import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

const config = defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    singleQuote: false,
    semi: true,
    ignorePatterns: [
      "**/*.md",
      "**/*.json",
      "!**/.vscode/**/*.json",
      "**/*.css",
      "src/routeTree.gen.ts",
    ],
    sortImports: true,
  },
  lint: {
    ignorePatterns: ["src/routeTree.gen.ts"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    maxWorkers: "50%",
    isolate: false,
  },
  resolve: { tsconfigPaths: true },
  plugins: lazyPlugins(() => [
    devtools(),
    tailwindcss(),
    tanstackStart({ spa: { enabled: true } }),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ]),
});

export default config;
