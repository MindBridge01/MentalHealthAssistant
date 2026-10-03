import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

const unusedVariablesRule = [
  "error",
  {
    argsIgnorePattern: "^_",
    caughtErrors: "none",
    varsIgnorePattern: "^[A-Z_]",
  },
];

export default [
  {
    ignores: [
      "**/node_modules/**",
      "dist/**",
      "server/coverage/**",
      ".scannerwork/**",
      "MentalHealthAssistant/**",
      "mentalhealth/**",
      "backups/**",
    ],
  },
  {
    files: ["client/src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "no-unused-vars": unusedVariablesRule,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ["server/**/*.js"],
    ignores: ["server/**/*.test.js", "server/tests/**/*.test.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
      parserOptions: { sourceType: "commonjs" },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": unusedVariablesRule,
    },
  },
  {
    files: ["server/**/*.test.js", "server/tests/**/*.test.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.node, ...globals.jest },
      parserOptions: { sourceType: "commonjs" },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "off",
    },
  },
  {
    files: ["vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
      parserOptions: { sourceType: "module" },
    },
    rules: js.configs.recommended.rules,
  },
];
