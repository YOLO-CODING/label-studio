import { useMemo, useState } from "react";
import { useHistory } from "react-router";
import { Button } from "@humansignal/ui";
import { Label } from "../../components/Form";
import { confirm } from "../../components/Modal/Modal";
import { Spinner } from "../../components/Spinner/Spinner";
import { useAPI } from "../../providers/ApiProvider";
import { useProject } from "../../providers/ProjectProvider";
import { cn } from "../../utils/bem";

export const DangerZone = () => {
  const { project } = useProject();
  const api = useAPI();
  const history = useHistory();
  const [processing, setProcessing] = useState(null);

  const handleOnClick = (type) => () => {
    confirm({
      title: "操作确认",
      body: "您即将执行删除操作。此操作不可撤销，请谨慎操作。",
      okText: "继续",
      buttonLook: "negative",
      onOk: async () => {
        setProcessing(type);
        if (type === "annotations") {
          // console.log('delete annotations');
        } else if (type === "tasks") {
          // console.log('delete tasks');
        } else if (type === "predictions") {
          // console.log('delete predictions');
        } else if (type === "reset_cache") {
          await api.callApi("projectResetCache", {
            params: {
              pk: project.id,
            },
          });
        } else if (type === "tabs") {
          await api.callApi("deleteTabs", {
            body: {
              project: project.id,
            },
          });
        } else if (type === "project") {
          await api.callApi("deleteProject", {
            params: {
              pk: project.id,
            },
          });
          history.replace("/projects");
        }
        setProcessing(null);
      },
    });
  };
    const buttons = useMemo(
    () => [
      {
        type: "annotations",
        disabled: true, //&& !project.total_annotations_number,
        label: `删除全部标注（${project.total_annotations_number}个）`,
      },
      {
        type: "tasks",
        disabled: true, //&& !project.task_number,
        label: `删除全部任务（${project.task_number}个）`,
      },
      {
        type: "predictions",
        disabled: true, //&& !project.total_predictions_number,
        label: `删除全部预测结果（${project.total_predictions_number}个）`,
      },
      {
        type: "reset_cache",
        help: "在某些情况下，例如由于现有标签验证错误而无法修改标注配置，但您确信这些标签不存在时，重置缓存可能会有所帮助。您可以使用此操作重置缓存后重试。",
        label: "重置缓存",
      },
      {
        type: "tabs",
        help: "如果数据管理器无法加载，清除所有数据管理器标签页可能有助于解决问题。",
        label: "清除所有标签页",
      },
      {
        type: "project",
        help: "删除项目将从数据库中移除所有任务、标注和项目数据，此操作不可恢复。",
        label: "删除项目",
      },
    ],
    [project],
  );

  // const buttons = useMemo(
  //   () => [
  //     {
  //       type: "annotations",
  //       disabled: true, //&& !project.total_annotations_number,
  //       label: `Delete ${project.total_annotations_number} Annotations`,
  //     },
  //     {
  //       type: "tasks",
  //       disabled: true, //&& !project.task_number,
  //       label: `Delete ${project.task_number} Tasks`,
  //     },
  //     {
  //       type: "predictions",
  //       disabled: true, //&& !project.total_predictions_number,
  //       label: `Delete ${project.total_predictions_number} Predictions`,
  //     },
  //     {
  //       type: "reset_cache",
  //       help:
  //         "Reset Cache may help in cases like if you are unable to modify the labeling configuration due " +
  //         "to validation errors concerning existing labels, but you are confident that the labels don't exist. You can " +
  //         "use this action to reset the cache and try again.",
  //       label: "Reset Cache",
  //     },
  //     {
  //       type: "tabs",
  //       help: "If the Data Manager is not loading, dropping all Data Manager tabs can help.",
  //       label: "Drop All Tabs",
  //     },
  //     {
  //       type: "project",
  //       help: "Deleting a project removes all tasks, annotations, and project data from the database.",
  //       label: "Delete Project",
  //     },
  //   ],
  //   [project],
  // );

  return (
    <div className={cn("simple-settings")}>
      <h1>危险操作</h1>
      <Label description="请谨慎执行以下操作，这些操作具有不可逆性。在执行前请确保您的数据已备份。" />
      {/* <h1>Danger Zone</h1> */}
      {/* <Label description="Perform these actions at your own risk. Actions you take on this page can't be reverted. Make sure your data is backed up." /> */}

      {project.id ? (
        <div style={{ marginTop: 16 }}>
          {buttons.map((btn) => {
            const waiting = processing === btn.type;
            const disabled = btn.disabled || (processing && !waiting);

            return (
              btn.disabled !== true && (
                <div className={cn("settings-wrapper")} key={btn.type}>
                  <h3>{btn.label}</h3>
                  {btn.help && <Label description={btn.help} style={{ width: 600, display: "block" }} />}
                  <Button
                    key={btn.type}
                    variant="negative"
                    look="outlined"
                    disabled={disabled}
                    waiting={waiting}
                    onClick={handleOnClick(btn.type)}
                    style={{ marginTop: 16 }}
                  >
                    {btn.label}
                  </Button>
                </div>
              )
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <Spinner size={32} />
        </div>
      )}
    </div>
  );
};

DangerZone.title = "危险操作";
DangerZone.path = "/danger-zone";
