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

// 导出格式中文翻译
const EXPORT_FORMAT_DESCRIPTIONS = {
  JSON: "单个 JSON 文件中存储的原始 JSON 格式项目列表，用于同时导出数据和标注。",
  "JSON-MIN": "仅导出数据中标注信息的简化 JSON 格式。",
  CSV: "逗号分隔值格式，列名由标注字段名称指定。",
  TSV: "制表符分隔的表格格式，列名由标注字段名称指定。",
  CONLL2003: "CoNLL-2003 命名实体识别挑战赛的流行格式，适用于序列标注和文本标记任务。",
  COCO: "COCO 数据集使用的机器学习格式，适用于目标检测和图像分割任务。",
  "COCO with Images": "包含下载图像的 COCO 格式。",
  "Pascal VOC XML": "用于目标检测和图像分割的 XML 格式。",
  YOLO: "YOLO 格式，每个图像对应一个 TXT 文件，包含物体类别和坐标信息。",
  "YOLO with Images": "包含下载图像的 YOLO 格式。",
  "YOLOv8 OBB": "YOLOv8 旋转框格式，支持导出旋转对象。",
  "YOLOv8 OBB with Images": "包含下载图像的 YOLOv8 OBB 格式。",
  "Brush labels to NumPy": "将画笔标注导出为 NumPy 二维数组格式，每个标注保存为一张图像。",
  "Brush labels to PNG": "将画笔标注导出为 PNG 图像格式，每个标注保存为一张图像。",
  "Brush labels to COCO": "将画笔标注转换为 COCO 分割格式，将 RLE 编码的掩码转换为 COCO 多边形。",
  "ASR Manifest": "导出用于自动语音识别的音频转录标注，采用 NVIDIA NeMo 模型所需的 JSON manifest 格式。",
};

// 导出格式 Tag 标签翻译
const FORMAT_TAG_TRANSLATIONS = {
  "image segmentation": "图像分割",
  "object detection": "目标检测",
  keypoints: "关键点",
  "sequence labeling": "序列标注",
  "text tagging": "文本标记",
  "named entity recognition": "命名实体识别",
  "speech recognition": "语音识别",
  "brush annotations": "画笔标注",
};

// const formats = {
//   json: 'JSON',
//   csv: 'CSV',
// };

const downloadFile = (blob, filename) => {
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const { Block, Elem } = BemWithSpecifiContext();

const wait = () => new Promise((resolve) => setTimeout(resolve, 5000));

export const ExportPage = () => {
  const history = useHistory();
  const location = useFixedLocation();
  const pageParams = useParams();
  const api = useAPI();

  const [previousExports, setPreviousExports] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadingMessage, setDownloadingMessage] = useState(false);
  const [availableFormats, setAvailableFormats] = useState([]);
  const [currentFormat, setCurrentFormat] = useState("JSON");

  /** @type {import('react').RefObject<Form>} */
  const form = useRef();

  const proceedExport = async () => {
    setDownloading(true);

    const message = setTimeout(() => {
      setDownloadingMessage(true);
    }, 1000);

    const params = form.current.assembleFormData({
      asJSON: true,
      full: true,
      booleansAsNumbers: true,
    });

    const response = await api.callApi("exportRaw", {
      params: {
        pk: pageParams.id,
        ...params,
      },
    });

    if (response.ok) {
      const blob = await response.blob();

      downloadFile(blob, response.headers.get("filename"));
    } else {
      api.handleError(response);
    }

    setDownloading(false);
    setDownloadingMessage(false);
    clearTimeout(message);
  };

  useEffect(() => {
    if (isDefined(pageParams.id)) {
      api
        .callApi("previousExports", {
          params: {
            pk: pageParams.id,
          },
        })
        .then(({ export_files }) => {
          setPreviousExports(export_files.slice(0, 1));
        });

      api
        .callApi("exportFormats", {
          params: {
            pk: pageParams.id,
          },
        })
        .then((formats) => {
          const localizedFormats = formats.map((format) => {
            const cnDesc = EXPORT_FORMAT_DESCRIPTIONS[format.title];
            return cnDesc ? { ...format, description: cnDesc } : format;
          });

          setAvailableFormats(localizedFormats);
          setCurrentFormat(localizedFormats[0]?.name);
        });
    }
  }, [pageParams]);

  return (
    <Modal
      onHide={() => {
        const path = location.pathname.replace(ExportPage.path, "");
        const search = location.search;

        history.replace(`${path}${search !== "?" ? search : ""}`);
      }}
      title="导出数据"
      style={{ width: 720 }}
      closeOnClickOutside={false}
      allowClose={!downloading}
      visible
    >
      <Block name="export-page">
        <FormatInfo
          availableFormats={availableFormats}
          selected={currentFormat}
          onClick={(format) => setCurrentFormat(format.name)}
        />

        <Form ref={form}>
          <Input type="hidden" name="exportType" value={currentFormat} />
        </Form>

        <Elem name="footer">
          <Space style={{ width: "100%" }} spread>
            <Elem name="recent">{/* {exportHistory} */}</Elem>
            <Elem name="actions">
              <Space>
                {downloadingMessage && "正在导出文件..."}
                <Button className="w-[135px]" onClick={proceedExport} waiting={downloading} aria-label="Export data">
                  导出
                </Button>
              </Space>
            </Elem>
          </Space>
        </Elem>
      </Block>
    </Modal>
  );
};

const FormatInfo = ({ availableFormats, selected, onClick }) => {
  return (
    <Block name="formats">
      <Elem name="info">您可以用下面任意一种格式来打包数据</Elem>
      <Elem name="list">
        {availableFormats.map((format) => (
          <Elem
            key={format.name}
            name="item"
            mod={{
              active: !format.disabled,
              selected: format.name === selected,
            }}
            onClick={!format.disabled ? () => onClick(format) : null}
          >
            <Elem name="name">
              {format.title}

              <Space size="small">
                {format.tags?.map?.((tag, index) => {
                  const cnTag = FORMAT_TAG_TRANSLATIONS[tag] || tag;
                  return (
                    <Elem key={index} name="tag">
                      {cnTag}
                    </Elem>
                  );
                })}
              </Space>
            </Elem>

            {format.description && <Elem name="description">{format.description}</Elem>}
          </Elem>
        ))}
      </Elem>
    </Block>
  );
};

ExportPage.path = "/export";
ExportPage.modal = true;
