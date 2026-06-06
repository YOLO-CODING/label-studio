/* eslint-disable */
export default {
  displayName: "playground",
  preset: "../../jest.preset.js",
  transform: {
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "@nx/react/plugins/jest",
    "^.+\\.[tj]sx?$": ["@swc/jest", { jsc: { parser: { syntax: "typescript", tsx: true, decorators: true }, transform: { react: { runtime: "automatic" }, legacyDecorator: true, decoratorMetadata: true }, loose: true } }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  moduleNameMapper: {
    "^apps/playground/(.*)$": "<rootDir>/$1",
  },
  coverageDirectory: "../../coverage/apps/playground",
};
