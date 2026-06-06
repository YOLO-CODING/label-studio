import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { Button } from "@humansignal/ui";
import { Form, Input } from "../../components/Form";
import { Modal } from "../../components/Modal/Modal";
import { Space } from "../../components/Space/Space";
import { useAPI } from "../../providers/ApiProvider";
import { useFixedLocation, useParams } from "../../providers/RoutesProvider";
import { BemWithSpecifiContext } from "../../utils/bem";
import { isDefined } from "../../utils/helpers";
import "./ExportPage.scss";
const { Block, Elem } = BemWithSpecifiContext();
import { useProject } from "../../providers/ProjectProvider";

export const TrainingPage = () => {
  const history = useHistory();
  const location = useFixedLocation();
  const pageParams = useParams();
  const api = useAPI();
  const { project } = useProject();

  const [previousExports, setPreviousExports] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadingMessage, setDownloadingMessage] = useState(false);

  const proceedExport = async () => {
    setDownloading(true);

    const message = setTimeout(() => {
      setDownloadingMessage(true);
    }, 1000);


    const response = await api.callApi("trainingPlans", {
      body: {
        "project_id": pageParams.id,// 项目id
        "quantity": project.queue_total,       // 文件数量
        "epochs": 100,         // 训练轮数，默认100
        "imgsz": 640           // 训练图像大小，默认
      },
    });


    if (response.id) {
       window.location = "/plans"
    }

    setDownloading(false);
    setDownloadingMessage(false);
    clearTimeout(message);
  };

  return (
    <Modal
      onHide={() => {
        const path = location.pathname.replace(TrainingPage.path, "");
        const search = location.search;

        history.replace(`${path}${search !== "?" ? search : ""}`);
      }}
      title="生成训练任务"
      style={{ width: 720 }}
      closeOnClickOutside={false}
      allowClose={!downloading}
      visible
    >
      <Block  name="formats">
        <Elem>
          <Space>
            请确认，您即将为“{project?.title}”项目启动训练任务生成
          </Space>
        </Elem>
      </Block>

      <Block name="export-page">

        <Elem name="footer">
          <Space style={{ width: "100%" }} spread>
            <Elem name="recent">{/* {exportHistory} */}</Elem>
            <Elem name="actions">
              <Space>
                <Button className="w-[135px]" onClick={proceedExport} waiting={downloading} aria-label="Export data">
                  确定
                </Button>
              </Space>
            </Elem>
          </Space>
        </Elem>
      </Block>
    </Modal>
  );
};


TrainingPage.path = "/training";
TrainingPage.modal = true;
