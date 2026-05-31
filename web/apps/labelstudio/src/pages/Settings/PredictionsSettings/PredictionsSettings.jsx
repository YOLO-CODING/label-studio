import { useCallback, useContext, useEffect, useState } from "react";
import { Divider } from "../../../components/Divider/Divider";
import { EmptyState } from "../../../components/EmptyState/EmptyState";
import { IconPredictions, Typography } from "@humansignal/ui";
import { useAPI } from "../../../providers/ApiProvider";
import { ProjectContext } from "../../../providers/ProjectProvider";
import { Spinner } from "../../../components/Spinner/Spinner";
import { PredictionsList } from "./PredictionsList";

export const PredictionsSettings = () => {
  const api = useAPI();
  const { project } = useContext(ProjectContext);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    const versions = await api.callApi("projectModelVersions", {
      params: {
        pk: project.id,
        extended: true,
      },
    });

    if (versions) setVersions(versions.static);
    setLoading(false);
    setLoaded(true);
  }, [project, setVersions]);

  useEffect(() => {
    if (project.id) {
      fetchVersions();
    }
  }, [project]);

  return (
    <section className="max-w-[42rem]">
      <Typography variant="headline" size="medium" className="mb-tight">
        预测结果
      </Typography>
      <div>
        {loading && <Spinner size={32} />}

        {loaded && versions.length > 0 && (
          <>
            <Typography variant="title" size="medium">
              预测结果列表
            </Typography>
            <Typography size="small" className="text-neutral-content-subtler mt-base mb-wider">
              项目中可用的预测结果列表。每个卡片对应一个独立的模型版本。
              {/* List of predictions available in the project. Each card is associated with a separate model version. To */}
              {/* learn about how to import predictions,{" "} */}
              {/* <a href="https://labelstud.io/guide/predictions.html" target="_blank" rel="noreferrer"> */}
              {/*   see&nbsp;the&nbsp;documentation */}
              {/* </a> */}
              {/* . */}
            </Typography>
          </>
        )}

        {loaded && versions.length === 0 && (
          <EmptyState
            icon={<IconPredictions />}
            // title="No predictions yet uploaded"
            // description="Predictions could be used to prelabel the data, or validate the model. You can upload and select predictions from multiple model versions. You can also connect live models in the Model tab."
            title="暂无预测结果"
            description="预测结果可用于预标注数据或验证模型效果。您可以上传和选择来自多个模型版本的预测结果，也可以在模型标签页中连接实时模型。"
          />
        )}

        <PredictionsList project={project} versions={versions} fetchVersions={fetchVersions} />

        <Divider height={32} />
      </div>
    </section>
  );
};

PredictionsSettings.title = "预测结果";
PredictionsSettings.path = "/predictions";
