/* eslint-disable */
export default {
  displayName: "ui",
  preset: "../../jest.preset.js",
  transform: {
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "@nx/react/plugins/jest",
    "^.+\\.[tj]sx?$": ["@swc/jest", { jsc: { parser: { syntax: "typescript", tsx: true, decorators: true }, transform: { react: { runtime: "automatic" }, legacyDecorator: true, decoratorMetadata: true }, loose: true } }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../coverage/libs/ui",
};
