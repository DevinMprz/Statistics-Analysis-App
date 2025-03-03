import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import prettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      prettier: prettier,
    },
    rules: {
      "prettier/prettier": "error", // Treat Prettier issues as ESLint errors
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "script" },
    plugins: {
      prettier: prettier,
    },
    rules: {
      "prettier/prettier": "error", // Treat Prettier issues as ESLint errors
    },
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
];
