import { formatDistanceToNow, format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useCallback, useContext } from "react";

import truncate from "truncate-middle";
import { Dropdown, Menu } from "../../../components";
import { Button } from "@humansignal/ui";
import { confirm } from "../../../components/Modal/Modal";
import { Oneof } from "../../../components/Oneof/Oneof";
import { IconEllipsis } from "@humansignal/icons";
import { Tooltip } from "@humansignal/ui";
import { ApiContext } from "../../../providers/ApiProvider";
import { Block, cn } from "../../../utils/bem";

import "./MachineLearningList.scss";

export const MachineLearningList = ({ backends, fetchBackends, onEdit, onTestRequest, onStartTraining }) => {
  const api = useContext(ApiContext);

  const onDeleteModel = useCallback(
    async (backend) => {
      await api.callApi("deleteMLBackend", {
        params: {
          pk: backend.id,
        },
      });
      await fetchBackends();
    },
    [fetchBackends, api],
  );

  return (
    <div>
      {backends.map((backend) => (
        <BackendCard
          key={backend.id}
          backend={backend}
          onStartTrain={onStartTraining}
          onDelete={onDeleteModel}
          onEdit={onEdit}
          onTestRequest={onTestRequest}
        />
      ))}
    </div>
  );
};

const BackendCard = ({ backend, onStartTrain, onEdit, onDelete, onTestRequest }) => {
  const confirmDelete = useCallback(
    (backend) => {
      confirm({
        // title: "Delete ML Backend",
        // body: "This action cannot be undone. Are you sure?",
        title: "删除机器学习后端",
        body: "此操作不可恢复，确定要删除吗？",
        buttonLook: "destructive",
        onOk() {
          onDelete?.(backend);
        },
      });
    },
    [backend, onDelete],
  );

  const rootClass = cn("backend-card");

  return (
    <Block name="backend-card">
      <div className={rootClass.elem("title-container")}>
        <div>
          <BackendState backend={backend} />
          <div className={rootClass.elem("title")}>{backend.title}</div>
        </div>

        <div className={rootClass.elem("menu")}>
          <Dropdown.Trigger
            align="right"
            content={
              <Menu size="medium" contextual>
                {/* <Menu.Item onClick={() => onEdit(backend)}>Edit</Menu.Item> */}
                {/* <Menu.Item onClick={() => onTestRequest(backend)}>Send Test Request</Menu.Item> */}
                {/* <Menu.Item onClick={() => onStartTrain(backend)}>Start Training</Menu.Item> */}
                {/* <Menu.Divider /> */}
                {/* <Menu.Item onClick={() => confirmDelete(backend)} isDangerous> */}
                {/*   Delete */}
                {/* </Menu.Item> */}
                <Menu.Item onClick={() => onEdit(backend)}>编辑</Menu.Item>
                <Menu.Item onClick={() => onTestRequest(backend)}>发送测试请求</Menu.Item>
                <Menu.Item onClick={() => onStartTrain(backend)}>开始训练</Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={() => confirmDelete(backend)} isDangerous>
                  删除
                </Menu.Item>
              </Menu>
            }
          >
            <Button look="string" size="small" className="!p-0" aria-label="Machine learning model options">
              <IconEllipsis />
            </Button>
          </Dropdown.Trigger>
        </div>
      </div>

      <div className={rootClass.elem("meta")}>
        <div className={rootClass.elem("group")}>{truncate(backend.url, 20, 10, "...")}</div>
        <div className={rootClass.elem("group")}>
          <Tooltip title={format(parseISO(backend.created_at), "yyyy-MM-dd HH:mm:ss")}>
            <span>创建于&nbsp;{formatDistanceToNow(parseISO(backend.created_at), { addSuffix: true, locale: zhCN })}</span>
          </Tooltip>
        </div>
      </div>
    </Block>
  );
};

const BackendState = ({ backend }) => {
  const { state } = backend;

  return (
    <div className={cn("ml").elem("status")}>
      <span className={cn("ml").elem("indicator").mod({ state })} />
      <Oneof value={state} className={cn("ml").elem("status-label")}>
        {/* <span case="DI">Disconnected</span> */}
        {/* <span case="CO">Connected</span> */}
        {/* <span case="ER">Error</span> */}
        {/* <span case="TR">Training</span> */}
        {/* <span case="PR">Predicting</span> */}
        <span case="DI">未连接</span>
        <span case="CO">已连接</span>
        <span case="ER">错误</span>
        <span case="TR">训练中</span>
        <span case="PR">预测中</span>
      </Oneof>
    </div>
  );
};
