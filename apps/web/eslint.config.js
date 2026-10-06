const { globalIgnores } = require("eslint/config");
const nextConfig = require("@unsolo/config/eslint/nextjs");

module.exports = [
  ...nextConfig,

  globalIgnores([
    "**/public/sw*.js",
    "**/next-env.d.ts",
  ]),
];