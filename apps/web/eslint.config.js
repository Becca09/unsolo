const nextConfig = require("@unsolo/config/eslint/nextjs");

module.exports = [
  ...nextConfig,
  {
    ignores: ["public/sw.js", "next-env.d.ts"],
  },
];
