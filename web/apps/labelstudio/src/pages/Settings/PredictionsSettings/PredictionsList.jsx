import { useCallback, useContext } from "react";

import { format, formatDistanceToNow, parseISO } from "date-fns";
import { zhCN } from 'date-fns/locale';
import { Dropdown, Menu } from "../../../components";
import { Button } from "@humansignal/ui";
import { IconInfoOutline, IconPredictions, IconEllipsis } from "@humansignal/icons";
import { Tooltip } from "@humansignal/ui";
import { confirm } from "../../../components/Modal/Modal";
import { ApiContext } from "../../../providers/ApiProvider";
import { Block, cn } from "../../../utils/bem";

import "./PredictionsList.scss";

export const PredictionsList = ({ project, versions, fetchVersions }) => {
  const api = useContext(ApiContext);

  const onDelete = useCallback(
    async (version) => {
      await api.callApi("deletePredictions", {
        params: {
          pk: project.id,
        },
        body: {
          model_version: version.model_version,
        },
      });
      await fetchVersions();
    },
    [fetchVersions, api],
  );

  return (
    <div style={{ maxWidth: 680 }}>
      {versions.map((v) => (
        <VersionCard key={v.model_version} version={v} onDelete={onDelete} />
      ))}
    </div>
  );
};

const VersionCard = ({ version, selected, onSelect, editable, onDelete }) => {
  const rootClass = cn("prediction-card");

  const confirmDelete = useCallback(
    (version) => {
      confirm({
        // title: "Delete Predictions",
        // body: "This action cannot be undone. Are you sure?",
        title: "删除预测结果",
        body: "此操作不可恢复，确定要删除吗？",
        buttonLook: "destructive",
        onOk() {
          onDelete?.(version);
        },
      });
    },
    [version, onDelete],
  );

  return (
    <Block name="prediction-card">
      <div>
        <div className={rootClass.elem("title")}>
          {version.model_version}
          {version.model_version === "undefined" && (
            <Tooltip title="模型版本未定义。通常是因为导入预测结果时缺少model_version字段。">
              <IconInfoOutline className={cn("help-icon")} width="14" height="14" />
            </Tooltip>
          )}
        </div>
        <div className={rootClass.elem("meta")}>
          <div className={rootClass.elem("group")}>
            <IconPredictions />
            &nbsp;{version.count}
          </div>
          <div className={rootClass.elem("group")}>
            预测更新时间&nbsp;
            <Tooltip title={format(parseISO(version.latest), "yyyy-MM-dd HH:mm:ss")}>
              <span>{formatDistanceToNow(parseISO(version.latest), {locale: zhCN, addSuffix: true })}</span>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className={rootClass.elem("menu")}>
        <Dropdown.Trigger
          align="right"
          content={
            <Menu size="medium" contextual>
              <Menu.Item onClick={() => confirmDelete(version)} isDangerous>
                删除
              </Menu.Item>
            </Menu>
          }
        >
          <Button look="string">
            <IconEllipsis />
          </Button>
        </Dropdown.Trigger>
      </div>
    </Block>
  );
};
