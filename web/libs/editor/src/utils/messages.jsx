import { htmlEscape } from "./html";

const URL_CORS_DOCS = "";
const URL_TAGS_DOCS = "";


export default {
  DONE: "完成！",
  NO_COMP_LEFT: "已无更多待标注任务",
  NO_NEXT_TASK: "队列中已无更多任务",
  NO_ACCESS: "您没有访问此任务的权限",

  CONFIRM_TO_DELETE_ALL_REGIONS: "请确认您要删除所有已标注区域",

  // 树结构验证消息
  ERR_REQUIRED: ({ modelName, field }) => {
    return `<b>${modelName}</b> 的 <b>${field}</b> 属性为必填项`;
  },

  ERR_UNKNOWN_TAG: ({ modelName, field, value }) => {
    return `名为 <b>${value}</b> 的标签未注册。<b>${modelName}#${field}</b> 引用了此标签。`;
  },

  ERR_TAG_NOT_FOUND: ({ modelName, field, value }) => {
    return `配置中不存在名为 <b>${value}</b> 的标签。<b>${modelName}#${field}</b> 引用了此标签。`;
  },

  ERR_TAG_UNSUPPORTED: ({ modelName, field, value, validType }) => {
    return `<b>${modelName}</b> 的属性 <b>${field}</b> 无效：引用了标签 <b>${value}</b>，但 <b>${modelName}</b> 仅能控制 <b>${[]
      .concat(validType)
      .join(", ")}</b>`;
  },

  ERR_PARENT_TAG_UNEXPECTED: ({ validType, value }) => {
    return `标签 <b>${value}</b> 必须是 <b>${[].concat(validType).join(", ")}</b> 其中之一标签的子元素。`;
  },

  ERR_BAD_TYPE: ({ modelName, field, validType }) => {
    return `标签 <b>${modelName}</b> 的属性 <b>${field}</b> 类型无效。有效类型包括：<b>${validType}</b>。`;
  },

  ERR_INTERNAL: ({ value }) => {
    return `系统内部错误。请查看浏览器控制台获取更多信息。请重试或联系开发人员。<br/>${value}`;
  },

  ERR_GENERAL: ({ value }) => {
    return value;
  },

  // 对象加载错误
  URL_CORS_DOCS,
  URL_TAGS_DOCS,

  ERR_LOADING_AUDIO({ attr, url, error }) {
    return (
      <div data-testid="error:audio">
        <p>
          加载音频时发生错误。请检查任务中的 <code>{attr}</code> 字段。
        </p>
        <p>技术描述：{error}</p>
        <p>URL：{htmlEscape(url)}</p>
      </div>
    );
  },

  ERR_LOADING_S3({ attr, url }) {
    return `
    <div>
      <p>
        从 <code>${attr}</code> 值加载URL时出现问题。请求参数无效。
        如果您正在使用S3，请确保指定了正确的存储桶区域名称。
      </p>
      <p>URL：<code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
    </div>`;
  },

  ERR_LOADING_CORS({ attr, url }) {
    return `
    <div>
      <p>
        从 <code>${attr}</code> 值加载URL时出现问题。
        很可能是因为静态服务器未正确配置CORS。
      </p>
      <p>
        请同时检查：
        <ul>
          <li>URL是否有效</li>
          <li>网络是否可达</li>
        </ul>
      </p>
      <p>URL：<code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
    </div>`;
  },

  ERR_LOADING_HTTP({ attr, url, error }) {
    return `
    <div data-testid="error:http">
      <p>
        从 <code>${attr}</code> 值加载URL时出现问题
      </p>
      <p>
        请检查以下事项：
        <ul>
          <li>URL是否有效</li>
          <li>URL协议是否与服务协议匹配，如https和https</li>
          <li>
            静态服务器是否已正确配置CORS
          </li>
        </ul>
      </p>
      <p>
        技术描述：<code>${error}</code>
        <br />
        URL：<code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code>
      </p>
    </div>`;
  },
};
// export default {
//   DONE: "Done!",
//   NO_COMP_LEFT: "No more annotations",
//   NO_NEXT_TASK: "No More Tasks Left in Queue",
//   NO_ACCESS: "You don't have access to this task",

//   CONFIRM_TO_DELETE_ALL_REGIONS: "Please confirm you want to delete all labeled regions",

//   // Tree validation messages
//   ERR_REQUIRED: ({ modelName, field }) => {
//     return `Attribute <b>${field}</b> is required for <b>${modelName}</b>`;
//   },

//   ERR_UNKNOWN_TAG: ({ modelName, field, value }) => {
//     return `Tag with name <b>${value}</b> is not registered. Referenced by <b>${modelName}#${field}</b>.`;
//   },

//   ERR_TAG_NOT_FOUND: ({ modelName, field, value }) => {
//     return `Tag with name <b>${value}</b> does not exist in the config. Referenced by <b>${modelName}#${field}</b>.`;
//   },

//   ERR_TAG_UNSUPPORTED: ({ modelName, field, value, validType }) => {
//     return `Invalid attribute <b>${field}</b> for <b>${modelName}</b>: referenced tag is <b>${value}</b>, but <b>${modelName}</b> can only control <b>${[]
//       .concat(validType)
//       .join(", ")}</b>`;
//   },

//   ERR_PARENT_TAG_UNEXPECTED: ({ validType, value }) => {
//     return `Tag <b>${value}</b> must be a child of one of the tags <b>${[].concat(validType).join(", ")}</b>.`;
//   },

//   ERR_BAD_TYPE: ({ modelName, field, validType }) => {
//     return `Attribute <b>${field}</b> of tag <b>${modelName}</b> has invalid type. Valid types are: <b>${validType}</b>.`;
//   },

//   ERR_INTERNAL: ({ value }) => {
//     return `Internal error. See browser console for more info. Try again or contact developers.<br/>${value}`;
//   },

//   ERR_GENERAL: ({ value }) => {
//     return value;
//   },

//   // Object loading errors
//   URL_CORS_DOCS,
//   URL_TAGS_DOCS,

//   ERR_LOADING_AUDIO({ attr, url, error }) {
//     return (
//       <div data-testid="error:audio">
//         <p>
//           Error while loading audio. Check <code>{attr}</code> field in task.
//         </p>
//         <p>Technical description: {error}</p>
//         <p>URL: {htmlEscape(url)}</p>
//       </div>
//     );
//   },

//   ERR_LOADING_S3({ attr, url }) {
//     return `
//     <div>
//       <p>
//         There was an issue loading URL from <code>${attr}</code> value.
//         The request parameters are invalid.
//         If you are using S3, make sure you’ve specified the right bucket region name.
//       </p>
//       <p>URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
//     </div>`;
//   },

//   ERR_LOADING_CORS({ attr, url }) {
//     return `
//     <div>
//       <p>
//         There was an issue loading URL from <code>${attr}</code> value.
//         Most likely that's because static server has wide-open CORS.
//         <a href="${this.URL_CORS_DOCS}" target="_blank">Read more on that here.</a>
//       </p>
//       <p>
//         Also check that:
//         <ul>
//           <li>URL is valid</li>
//           <li>Network is reachable</li>
//         </ul>
//       </p>
//       <p>URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
//     </div>`;
//   },

//   ERR_LOADING_HTTP({ attr, url, error }) {
//     return `
//     <div data-testid="error:http">
//       <p>
//         There was an issue loading URL from <code>${attr}</code> value
//       </p>
//       <p>
//         Things to look out for:
//         <ul>
//           <li>URL is valid</li>
//           <li>URL scheme matches the service scheme, i.e. https and https</li>
//           <li>
//             The static server has wide-open CORS,
//             <a href=${this.URL_CORS_DOCS} target="_blank">more on that here</a>
//           </li>
//         </ul>
//       </p>
//       <p>
//         Technical description: <code>${error}</code>
//         <br />
//         URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code>
//       </p>
//     </div>`;
//   },
// };
