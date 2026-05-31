import { FF_BITMASK } from "@humansignal/core/lib/utils/feature-flags";

// export default {
//   enableHotkeys: {
//     newUI: {
//       title: "Labeling hotkeys",
//       description: "Enables quick selection of labels using hotkeys",
//     },
//     description: "Enable labeling hotkeys",
//     onChangeEvent: "toggleHotkeys",
//     defaultValue: true,
//   },
//   enableTooltips: {
//     newUI: {
//       title: "Show hotkeys on tooltips",
//       description: "Displays keybindings on tools and actions tooltips",
//     },
//     description: "Show hotkey tooltips",
//     onChangeEvent: "toggleTooltips",
//     checked: "",
//     defaultValue: false,
//   },
//   enableLabelTooltips: {
//     newUI: {
//       title: "Show hotkeys on labels",
//       description: "Displays keybindings on labels",
//     },
//     description: "Show labels hotkey tooltips",
//     onChangeEvent: "toggleLabelTooltips",
//     defaultValue: true,
//   },
//   showLabels: {
//     newUI: {
//       title: "Show region labels",
//       description: "Display region label names",
//     },
//     description: "Show labels inside the regions",
//     onChangeEvent: "toggleShowLabels",
//     defaultValue: false,
//   },
//   continuousLabeling: {
//     newUI: {
//       title: "Keep label selected after creating a region",
//       description: "Allows continuous region creation using the selected label",
//     },
//     description: "Keep label selected after creating a region",
//     onChangeEvent: "toggleContinuousLabeling",
//     defaultValue: false,
//   },
//   selectAfterCreate: {
//     newUI: {
//       title: "Select region after creating it",
//       description: "Automatically selects newly created regions",
//     },
//     description: "Select regions after creating",
//     onChangeEvent: "toggleSelectAfterCreate",
//     defaultValue: false,
//   },
//   showLineNumbers: {
//     newUI: {
//       tags: "Text Tag",
//       title: "Show line numbers",
//       description: "Identify and reference specific lines of text in your document",
//     },
//     description: "Show line numbers for Text",
//     onChangeEvent: "toggleShowLineNumbers",
//     defaultValue: false,
//   },
//   preserveSelectedTool: {
//     newUI: {
//       tags: "Image Tag",
//       title: "Keep selected tool",
//       description: "Persists the selected tool across tasks",
//     },
//     description: "Remember Selected Tool",
//     onChangeEvent: "togglepreserveSelectedTool",
//     defaultValue: true,
//   },
//   enableSmoothing: {
//     newUI: {
//       tags: "Image Tag",
//       title: "Pixel smoothing on zoom",
//       description: "Smooth image pixels when zoomed in",
//     },
//     description: "Enable image smoothing when zoom",
//     onChangeEvent: "toggleSmoothing",
//     defaultValue: true,
//   },
//   invertedZoom: {
//     newUI: {
//       tags: "Image Tag",
//       title: "Invert zoom direction",
//       description: "Invert the direction of scroll-to-zoom",
//     },
//     description: "Enable inverted zoom direction",
//     onChangeEvent: "toggleInvertedZoom",
//     defaultValue: false,
//     flag: FF_BITMASK,
//   },
// };
//
export default {
  enableHotkeys: {
    newUI: {
      title: "标注快捷键",
      description: "启用快捷键快速选择标签",
    },
    description: "启用标注快捷键",
    onChangeEvent: "toggleHotkeys",
    defaultValue: true,
  },
  enableTooltips: {
    newUI: {
      title: "显示工具快捷键提示",
      description: "在工具和操作提示中显示快捷键",
    },
    description: "显示快捷键工具提示",
    onChangeEvent: "toggleTooltips",
    checked: "",
    defaultValue: false,
  },
  enableLabelTooltips: {
    newUI: {
      title: "显示标签快捷键提示",
      description: "在标签上显示快捷键",
    },
    description: "显示标签快捷键提示",
    onChangeEvent: "toggleLabelTooltips",
    defaultValue: true,
  },
  showLabels: {
    newUI: {
      title: "显示区域标签名称",
      description: "在区域内显示标签名称",
    },
    description: "在区域内显示标签",
    onChangeEvent: "toggleShowLabels",
    defaultValue: false,
  },
  continuousLabeling: {
    newUI: {
      title: "创建区域后保持标签选中",
      description: "使用选中的标签连续创建区域",
    },
    description: "创建区域后保持标签选中",
    onChangeEvent: "toggleContinuousLabeling",
    defaultValue: false,
  },
  selectAfterCreate: {
    newUI: {
      title: "创建后自动选中区域",
      description: "自动选中新创建的区域",
    },
    description: "创建后选中区域",
    onChangeEvent: "toggleSelectAfterCreate",
    defaultValue: false,
  },
  showLineNumbers: {
    newUI: {
      tags: "文本标注",
      title: "显示行号",
      description: "在文档中标识和引用特定行",
    },
    description: "为文本显示行号",
    onChangeEvent: "toggleShowLineNumbers",
    defaultValue: false,
  },
  preserveSelectedTool: {
    newUI: {
      tags: "图像标注",
      title: "保持工具选中",
      description: "跨任务保持所选工具不变",
    },
    description: "记住选中的工具",
    onChangeEvent: "togglepreserveSelectedTool",
    defaultValue: true,
  },
  enableSmoothing: {
    newUI: {
      tags: "图像标注",
      title: "缩放时像素平滑",
      description: "放大时平滑图像像素",
    },
    description: "缩放时启用图像平滑",
    onChangeEvent: "toggleSmoothing",
    defaultValue: true,
  },
  invertedZoom: {
    newUI: {
      tags: "图像标注",
      title: "反转缩放方向",
      description: "反转滚轮缩放方向",
    },
    description: "启用反转缩放方向",
    onChangeEvent: "toggleInvertedZoom",
    defaultValue: false,
    flag: FF_BITMASK,
  },
};
