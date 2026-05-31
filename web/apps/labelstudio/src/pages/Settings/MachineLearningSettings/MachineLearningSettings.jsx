import { useCallback, useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Button, Typography, Spinner } from "@humansignal/ui";
import { Form, Label, Toggle } from "../../../components/Form";
import { modal } from "../../../components/Modal/Modal";
import { EmptyState } from "../../../components/EmptyState/EmptyState";
import { IconModels } from "@humansignal/icons";
import { useAPI } from "../../../providers/ApiProvider";
import { ProjectContext } from "../../../providers/ProjectProvider";
import { MachineLearningList } from "./MachineLearningList";
import { CustomBackendForm } from "./Forms";
import { TestRequest } from "./TestRequest";
import { StartModelTraining } from "./StartModelTraining";
import "./MachineLearningSettings.scss";

export const MachineLearningSettings = () => {
  const api = useAPI();
  const { project, fetchProject } = useContext(ProjectContext);
  const [backends, setBackends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchBackends = useCallback(async () => {
    setLoading(true);
    const models = await api.callApi("mlBackends", {
      params: {
        project: project.id,
        include_static: true,
      },
    });

    if (models) setBackends(models);
    setLoading(false);
    setLoaded(true);
  }, [project, setBackends]);

  const startTrainingModal = useCallback(
    (backend) => {
      const modalProps = {
        // title: "Start Model Training",
        title: "启动模型训练",
        style: { width: 760 },
        closeOnClickOutside: true,
        body: <StartModelTraining backend={backend} />,
      };

      modal(modalProps);
    },
    [project],
  );

  const showRequestModal = useCallback(
    (backend) => {
      const modalProps = {
        // title: "Test Request",
        title: "测试请求",
        style: { width: 760 },
        closeOnClickOutside: true,
        body: <TestRequest backend={backend} />,
      };

      modal(modalProps);
    },
    [project],
  );

  const showMLFormModal = useCallback(
    (backend) => {
      const action = backend ? "updateMLBackend" : "addMLBackend";
      const modalProps = {
        // title: `${backend ? "Edit" : "Connect"} Model`,
        title: `${backend ? "编辑" : "连接"}模型`,
        style: { width: 760 },
        closeOnClickOutside: false,
        body: (
          <CustomBackendForm
            action={action}
            backend={backend}
            project={project}
            onSubmit={() => {
              fetchBackends();
              modalRef.close();
            }}
          />
        ),
      };

      const modalRef = modal(modalProps);
    },
    [project, fetchBackends],
  );

  useEffect(() => {
    if (project.id) {
      fetchBackends();
    }
  }, [project.id]);

  return (
    <section>
      <div className="w-[40rem]">
        <Typography variant="headline" size="medium" className="mb-base">
           模型
        </Typography>
        {loading && <Spinner size={32} />}
        {loaded && backends.length === 0 && (
          <EmptyState
          icon={<IconModels />}
          title="连接您的第一个模型" 
          description="连接机器学习模型以生成预测结果。这些预测可用于并行比较、高效预标注，并支持主动学习，引导用户处理最有价值的标注任务。" 
          action={
            <Button primary onClick={() => showMLFormModal()} aria-label="添加机器学习模型"> 
              连接模型 
            </Button>
          }
        />
        )}
        <MachineLearningList
          onEdit={(backend) => showMLFormModal(backend)}
          onTestRequest={(backend) => showRequestModal(backend)}
          onStartTraining={(backend) => startTrainingModal(backend)}
          fetchBackends={fetchBackends}
          backends={backends}
        />


      {backends.length > 0 && (
        <div className="my-wide">
          <Typography size="small" className="text-neutral-content-subtler">
            检测到已连接的模型！如果您想从此模型获取预测，请按以下步骤操作：  
          </Typography>
          <Typography size="small" className="text-neutral-content-subtler mt-base">
            1. 前往<strong>数据管理列表</strong>。
          </Typography>
          <Typography size="small" className="text-neutral-content-subtler mt-tighter">
            2. 选择所需的任务。
          </Typography>
          <Typography size="small" className="text-neutral-content-subtler mt-tighter">
            3. 在<strong>操作</strong>菜单中点击<strong>获取预测结果</strong>。  
          </Typography>
          <Typography size="small" className="text-neutral-content-subtler mt-base">
            如果您希望将模型预测用于预标注，请在
            <NavLink to="annotation" className="hover:underline">
              标注设置
            </NavLink>
            中进行配置。
          </Typography>
        </div>
      )}

        <Form
          action="updateProject"
          formData={{ ...project }}
          params={{ pk: project.id }}
          onSubmit={() => fetchProject()}
        >
          {backends.length > 0 && (
            <div className="p-wide border border-neutral-border rounded-md">
              <Form.Row columnCount={1}>
                <Label text="配置" large />

                <div>
                  <Toggle
                    label="在提交标注时启动模型训练"
                    description="此选项将向 /train 端点发送包含标注信息的请求，可用于启用主动学习循环。您也可以在模型卡片菜单中手动启动训练。"
                    name="start_training_on_annotation_update"
                  />
                </div>
              </Form.Row>
            </div>
          )}

          {backends.length > 0 && (
            <Form.Actions>
              <Form.Indicator>
                <span case="success">保存成功！</span>
              </Form.Indicator>
              <Button type="submit" look="primary" className="w-[120px]" aria-label="Save machine learning settings">
                保存
              </Button>
            </Form.Actions>
          )}
        </Form>
      </div>
    </section>
  );
};

MachineLearningSettings.title = "模型";
MachineLearningSettings.path = "/ml";
