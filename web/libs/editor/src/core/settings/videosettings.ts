import type { SettingsProperties } from "./types";

export default {
  videoDrawOutside: {
    // description: "Allow drawing outside of video boundaries",
    description: "允许在视频边界外绘制",
    defaultValue: false,
    type: "boolean",
  },
  videoHopSize: {
    // description: "Video hop size",
    description: "视频跳转步长",
    defaultValue: 10,
    type: "number",
  },
} as SettingsProperties;
