// @ts-check
const base = require("./base");
const nextPlugin = require("@next/eslint-plugin-next");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...base,
  {
    ...nextPlugin.flatConfig.recommended,
    ...nextPlugin.flatConfig.coreWebVitals,
    rules: {
      ...nextPlugin.flatConfig.recommended.rules,
      ...nextPlugin.flatConfig.coreWebVitals.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
