import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const eslintConfig = [
  {
    // El flat config de ESLint 9 sólo ignora node_modules por defecto. Sin esto
    // se linteaba el output de build (.next), que generaba cientos de errores
    // falsos sobre código minificado y ocultaba los reales del código fuente.
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "private-uploads/**",
      "public/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
