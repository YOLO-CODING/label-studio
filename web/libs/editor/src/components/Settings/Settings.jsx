import React, { useMemo } from "react";
import Modal from "antd/es/modal";
import "antd/es/modal/style/css";
import Table from "antd/es/table";
import "antd/es/table/style/css";
import Tabs from "antd/es/tabs";
import "antd/es/tabs/style/css";
import { observer } from "mobx-react";

import { Hotkey } from "../../core/Hotkey";

import "./Settings.scss";
import { Block, Elem } from "../../utils/bem";
import { triggerResizeEvent } from "../../utils/utilities";

import EditorSettings from "../../core/settings/editorsettings";
import * as TagSettings from "./TagSettings";
import { IconClose } from "@humansignal/icons";
import { Checkbox, Toggle } from "@humansignal/ui";
import { FF_DEV_3873, isFF } from "../../utils/feature-flags";
import { ff } from "@humansignal/core";

const HotkeysDescription = () => {
  const columns = [
    { title: "快捷键", dataIndex: "combo", key: "combo" },
    { title: "功能描述", dataIndex: "descr", key: "descr" },
  ];

  const keyNamespaces = Hotkey.namespaces();

  const getData = (descr) =>
    Object.keys(descr)
      .filter((k) => descr[k])
      .map((k) => ({
        key: k,
        combo: k.split(",").map((keyGroup) => {
          return (
            <Elem name="key-group" key={keyGroup}>
              {keyGroup
                .trim()
                .split("+")
                .map((k) => (
                  <Elem tag="kbd" name="key" key={k}>
                    {k}
                  </Elem>
                ))}
            </Elem>
          );
        }),
        descr: descr[k],
      }));

  return (
    <Block name="keys">
      <Tabs >
        {Object.entries(keyNamespaces).map(([ns, data]) => {
          if (Object.keys(data.descriptions).length === 0) {
            return null;
          }
          const descriptionTrans = {'Segmentation Tools': '画板快捷键','Global Hotkeys': '全局快捷键'}
          return (
            <Tabs.TabPane size="small" key={ns} tab={descriptionTrans[data.description]??data.description ?? ns}>
              <Table columns={columns} dataSource={getData(data.descriptions)} size="small" />
            </Tabs.TabPane>
          );
        })}
      </Tabs>
    </Block>
  );
};

const newUI = isFF(FF_DEV_3873) ? { newUI: true } : {};

const editorSettingsKeys = Object.keys(EditorSettings).filter((key) => {
  const flag = EditorSettings[key].flag;
  return flag ? ff.isActive(flag) : true;
});

if (isFF(FF_DEV_3873)) {
  const enableTooltipsIndex = editorSettingsKeys.findIndex((key) => key === "enableTooltips");
  const enableLabelTooltipsIndex = editorSettingsKeys.findIndex((key) => key === "enableLabelTooltips");

  // swap these in the array
  const tmp = editorSettingsKeys[enableTooltipsIndex];

  editorSettingsKeys[enableTooltipsIndex] = editorSettingsKeys[enableLabelTooltipsIndex];
  editorSettingsKeys[enableLabelTooltipsIndex] = tmp;
}

const SettingsTag = ({ children }) => {
  return <Block name="settings-tag">{children}</Block>;
};

const GeneralSettings = observer(({ store }) => {
  return (
    <Block name="settings" mod={newUI}>
      {editorSettingsKeys.map((obj, index) => {
        return (
          <Elem name="field" tag="label" key={index}>
            {isFF(FF_DEV_3873) ? (
              <>
                <Block name="settings__label">
                  <Elem name="title">
                    {EditorSettings[obj].newUI.title}
                    {EditorSettings[obj].newUI.tags?.split(",").map((tag) => (
                      <SettingsTag key={tag}>{tag}</SettingsTag>
                    ))}
                  </Elem>
                  <Elem name="description">{EditorSettings[obj].newUI.description}</Elem>
                </Block>
                <Toggle
                  key={index}
                  checked={store.settings[obj]}
                  onChange={store.settings[EditorSettings[obj].onChangeEvent]}
                  description={EditorSettings[obj].description}
                />
              </>
            ) : (
              <>
                <Checkbox
                  key={index}
                  checked={store.settings[obj]}
                  onChange={store.settings[EditorSettings[obj].onChangeEvent]}
                >
                  {EditorSettings[obj].description}
                </Checkbox>
                <br />
              </>
            )}
          </Elem>
        );
      })}
    </Block>
  );
});

const LayoutSettings = observer(({ store }) => {
  return (
    <Block name="settings" mod={newUI}>
      <Elem name="field">
        <Checkbox
          checked={store.settings.bottomSidePanel}
          onChange={() => {
            store.settings.toggleBottomSP();
            setTimeout(triggerResizeEvent);
          }}
        >
           将侧边栏移至底部
        </Checkbox>
      </Elem>

      <Elem name="field">
        <Checkbox checked={store.settings.displayLabelsByDefault} onChange={store.settings.toggleSidepanelModel}>
          在结果面板中默认显示标签
        </Checkbox>
      </Elem>

      <Elem name="field">
        <Checkbox
          value="Show Annotations panel"
          defaultChecked={store.settings.showAnnotationsPanel}
          onChange={() => {
            store.settings.toggleAnnotationsPanel();
          }}
        >
          显示标注面板
        </Checkbox>
      </Elem>

      <Elem name="field">
        <Checkbox
          value="Show Predictions panel"
          defaultChecked={store.settings.showPredictionsPanel}
          onChange={() => {
            store.settings.togglePredictionsPanel();
          }}
        >
          显示预标注面板
        </Checkbox>
      </Elem>

      {/* Saved for future use */}
      {/* <Elem name="field">
        <Checkbox
          value="Show image in fullsize"
          defaultChecked={store.settings.imageFullSize}
          onChange={() => {
            store.settings.toggleImageFS();
          }}
        >
          Show image in fullsize
        </Checkbox>
      </Elem> */}
    </Block>
  );
});

const Settings = {
  General: { name: "基础设置", component: GeneralSettings },
  Hotkeys: { name: "快捷键", component: HotkeysDescription },
};

if (!isFF(FF_DEV_3873)) {
  Settings.Layout = { name: "Layout", component: LayoutSettings };
}

const DEFAULT_ACTIVE = Object.keys(Settings)[0];

const DEFAULT_MODAL_SETTINGS = isFF(FF_DEV_3873)
  ? {
      name: "settings-modal",
      title: "标注界面设置",
      closeIcon: <IconClose />,
    }
  : {
      name: "settings-modal-old",
      title: "设置",
      bodyStyle: { paddingTop: "0" },
    };

export default observer(({ store }) => {
  const availableSettings = useMemo(() => {
    const availableTags = Object.values(store.annotationStore.names.toJSON());
    const settingsScreens = Object.values(TagSettings);

    return availableTags.reduce((res, tagName) => {
      const tagType = store.annotationStore.names.get(tagName).type;
      const settings = settingsScreens.find(({ tagName }) => tagName.toLowerCase() === tagType.toLowerCase());

      if (settings) res.push(settings);

      return res;
    }, []);
  }, []);

  return (
    <Block
      tag={Modal}
      open={store.showingSettings}
      onCancel={store.toggleSettings}
      footer=""
      {...DEFAULT_MODAL_SETTINGS}
    >
      <Tabs defaultActiveKey={DEFAULT_ACTIVE}>
        {Object.entries(Settings).map(([key, { name, component }]) => (
          <Tabs.TabPane tab={name} key={key}>
            {React.createElement(component, { store })}
          </Tabs.TabPane>
        ))}
        {availableSettings.map((Page) => (
          <Tabs.TabPane tab={Page.title} key={Page.tagName}>
            <Page store={store} />
          </Tabs.TabPane>
        ))}
      </Tabs>
    </Block>
  );
});
