module.exports = {
  moduleFileExtensions: ["js", "json", "ts", "tsx"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.(t|j)sx?$",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: ["**/*.(t|j)sx?"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};
