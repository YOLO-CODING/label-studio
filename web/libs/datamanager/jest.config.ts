/* eslint-disable */
export default {
  displayName: "datamanager",
  preset: "../../jest.preset.js",
  transform: {
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "@nx/react/plugins/jest",
    "^.+\\.[tj]sx?$": ["@swc/jest", { jsc: { parser: { syntax: "typescript", tsx: true, decorators: true }, transform: { react: { runtime: "automatic" }, legacyDecorator: true, decoratorMetadata: true }, loose: true } }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../coverage/libs/datamanager",
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/__mocks__/fileMock.js",
    "!!url-loader!": "<rootDir>/__mocks__/fileMock.js",
  },
};
