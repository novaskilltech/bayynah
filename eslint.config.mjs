import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextCoreWebVitals,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
    ],
  }
);
