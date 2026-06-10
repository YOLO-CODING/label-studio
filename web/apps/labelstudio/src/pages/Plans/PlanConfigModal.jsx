import { Modal } from "../../components/Modal/ModalPopup";
import { useAPI } from "../../providers/ApiProvider";
import { Button } from "@humansignal/ui";
import { Block, Elem } from "../../utils/bem";
import { useRef, useEffect, useState, useContext } from "react";
import { Input, Label, Select } from "../../components/Form";
import { Space } from "../../components/Space/Space";
import { ToastContext } from "@humansignal/ui";

export default function PlanConfigModal({ opened, onOpened, onClosed, onSaved, plan, mode }) {
  const modalRef = useRef(null);
  const [epochs, setEpochs] = useState(plan.epochs || 100);
  const [imageSize, setImageSize] = useState(plan.imgsz || 640);
  const [planId, setPlanId] = useState(plan.id);

  const parseExtraConfig = () => {
    try {
      return JSON.parse(plan.training_config || "{}");
    } catch {
      return {};
    }
  };

  const initialExtraConfig = parseExtraConfig();
  const [model, setModel] = useState(initialExtraConfig.model || "n");
  const [batchSize, setBatchSize] = useState(initialExtraConfig.batch_size || 16);
  const [lr, setLr] = useState(initialExtraConfig.lr || 0.01);
  const [optimizer, setOptimizer] = useState(initialExtraConfig.optimizer || "SGD");
  const [patience, setPatience] = useState(initialExtraConfig.patience || 50);
  const [weightDecay, setWeightDecay] = useState(initialExtraConfig.weight_decay || 0.0005);

  const configMode = mode || "";
  const isReadonly = configMode === "readonly";
  const title = configMode === "confirm" ? "开始训练" : isReadonly ? "查看配置" : "配置";

  const latestState = useRef();
  latestState.current = { epochs, imageSize, planId, model, batchSize, lr, optimizer, patience, weightDecay };

  const api = useAPI();
  const toast = useContext(ToastContext);

  useEffect(() => {
    if (modalRef.current && opened) {
      modalRef.current?.show?.();
    }
  }, [opened]);

  const handleEpochsChange = (e) => {
    const value = e.target.value;
    const numValue = Number.parseInt(value, 10);
    setEpochs(isNaN(numValue) ? "" : numValue);
  };

  const handleImageSizeChange = (e) => {
    const value = e.target.value;
    const numValue = Number.parseInt(value, 10);
    setImageSize(isNaN(numValue) ? "" : numValue);
  };

  const handleModelChange = (value) => {
    setModel(value);
  };

  const handleBatchSizeChange = (e) => {
    const value = e.target.value;
    const numValue = Number.parseInt(value, 10);
    setBatchSize(isNaN(numValue) ? "" : numValue);
  };

  const handleLrChange = (e) => {
    const value = e.target.value;
    const numValue = Number.parseFloat(value);
    setLr(isNaN(numValue) ? "" : numValue);
  };

  const handleOptimizerChange = (value) => {
    setOptimizer(value);
  };

  const handlePatienceChange = (e) => {
    const value = e.target.value;
    const numValue = Number.parseInt(value, 10);
    setPatience(isNaN(numValue) ? "" : numValue);
  };

  const handleWeightDecayChange = (e) => {
    const value = e.target.value;
    const numValue = Number.parseFloat(value);
    setWeightDecay(isNaN(numValue) ? "" : numValue);
  };

  const buildExtraConfig = () => {
    const { model, batchSize, lr, optimizer, patience, weightDecay } = latestState.current;
    return JSON.stringify({
      model: model || "n",
      batch_size: batchSize || 16,
      lr: lr || 0.01,
      optimizer: optimizer || "SGD",
      patience: patience || 50,
      weight_decay: weightDecay || 0.0005,
    });
  };

  const saveConfirm = async () => {
    const configData = {
      epochs: plan.epochs || 100,
      imgsz: plan.imgsz || 640,
      id: plan.id,
      training_config: plan.training_config || "{}",
    };

    const response = await api.callApi("confirmPlan", {
      params: {
        pk: plan.id,
      },
      body: configData,
    });
    if (response) {
      if (response.id) {
        toast.show({ message: "训练已开始", type: "info" });

        modalRef.current?.hide?.();

        if (onSaved) {
          onSaved();
        }
      } else {
        toast.show({ message: `开始训练失败：${response.error || ""}`, type: "error" });
      }
    }
  };

  const saveEdit = async () => {
    const { epochs, imageSize, planId } = latestState.current;

    const configData = {
      epochs: epochs || 10,
      imgsz: imageSize || 224,
      id: planId,
      training_config: buildExtraConfig(),
    };

    const response = await api.callApi("editPlan", {
      params: {
        pk: plan.id,
      },
      body: configData,
    });
    if (response) {
      if (response.id) {
        toast.show({ message: "训练计划已更新", type: "info" });

        modalRef.current?.hide?.();

        if (onSaved) {
          onSaved();
        }
      } else {
        toast.show({ message: `训练计划更新失败：${response.error || ""}`, type: "error" });
      }
    }
  };

  const save = async () => {
    if (configMode === "confirm") {
      saveConfirm();
    } else {
      saveEdit();
    }
  };

  return (
    <Modal
      ref={modalRef}
      opened={opened}
      closeOnClickOutside={false}
      title={title}
      body={
        <Block name="plan-config-modal">
          {configMode === "confirm" && (
            <Elem name="warp">
              <Space style={{ fontSize: 16, marginBottom: 10, lineHeight: 1.5 }}>
                训练任务将立即开始，可以在计划详情页面查看训练进度和日志。
                <br />
                是否开始训练？
              </Space>
            </Elem>
          )}
          {(configMode === "edit" || configMode === "readonly" || !mode) && (
            <>
              <Elem name="warp">
                <Space style={{ fontSize: 20, marginBottom: 10, lineHeight: 1.5 }}>
                  {isReadonly ? "当前训练参数：" : "修改训练参数： "}
                </Space>
              </Elem>

              <Elem name="warp" style={{ padding: 10 }}>
                <Block name="settings-column">
                  <Label text="训练模型" size="medium" />
                  <Select
                    name="model"
                    options={[
                      { value: "n", label: "Nano (最快，精度最低)" },
                      { value: "s", label: "Small" },
                      { value: "m", label: "Medium" },
                      { value: "l", label: "Large" },
                      { value: "x", label: "Xlarge (最慢，精度最高)" },
                    ]}
                    value={model}
                    onChange={handleModelChange}
                    disabled={isReadonly}
                  />
                </Block>
                <Block name="settings-column">
                  <Label text="训练轮数" size="medium" />
                  <Input
                    name="epochs"
                    type="number"
                    defaultValue={epochs || ""}
                    onChange={handleEpochsChange}
                    min="1"
                    placeholder="请输入训练轮数"
                    disabled={isReadonly}
                  />
                </Block>
                <Block name="settings-column">
                  <Label text="训练图像尺寸" />
                  <Input
                    name="imageSize"
                    type="number"
                    defaultValue={imageSize || ""}
                    onChange={handleImageSizeChange}
                    min="32"
                    placeholder="请输入图像尺寸"
                    disabled={isReadonly}
                  />
                  <Space style={{ display: "inline", marginLeft: 10 }}>范围：320 - 1280， 必需是32的倍数</Space>
                </Block>
                <Block name="settings-column">
                  <Label text="批次大小" />
                  <Input
                    name="batchSize"
                    type="number"
                    defaultValue={batchSize || ""}
                    onChange={handleBatchSizeChange}
                    min="1"
                    placeholder="请输入批次大小"
                    disabled={isReadonly}
                  />
                </Block>
                <Block name="settings-column">
                  <Label text="学习率" />
                  <Input
                    name="lr"
                    type="number"
                    step="0.0001"
                    defaultValue={lr || ""}
                    onChange={handleLrChange}
                    min="0"
                    placeholder="请输入学习率"
                    disabled={isReadonly}
                  />
                </Block>
                <Block name="settings-column">
                  <Label text="优化器" size="medium" />
                  <Select
                    name="optimizer"
                    options={[
                      { value: "SGD", label: "SGD" },
                      { value: "Adam", label: "Adam" },
                      { value: "AdamW", label: "AdamW" },
                    ]}
                    value={optimizer}
                    onChange={handleOptimizerChange}
                    disabled={isReadonly}
                  />
                </Block>
                <Block name="settings-column">
                  <Label text="早停轮数" />
                  <Input
                    name="patience"
                    type="number"
                    defaultValue={patience || ""}
                    onChange={handlePatienceChange}
                    min="1"
                    placeholder="请输入早停轮数"
                    disabled={isReadonly}
                  />
                </Block>
                <Block name="settings-column">
                  <Label text="权重衰减" />
                  <Input
                    name="weightDecay"
                    type="number"
                    step="0.0001"
                    defaultValue={weightDecay || ""}
                    onChange={handleWeightDecayChange}
                    min="0"
                    placeholder="请输入权重衰减"
                    disabled={isReadonly}
                  />
                </Block>
              </Elem>
            </>
          )}
        </Block>
      }
      footer={
        <div style={{ position: "relative", fontSize: 16 }}>
          {isReadonly ? (
            <div style={{ display: "inline-block", margin: "0 20px" }}>
              <Button onClick={() => { modalRef.current?.hide(); }}>
                关闭
              </Button>
            </div>
          ) : (
            <>
              <div style={{ display: "inline-block", margin: "0 20px" }}>
                <Button
                  style={{ backgroundColor: "#ffffff", color: "#4c5fa9" }}
                  onClick={() => {
                    modalRef.current?.hide();
                  }}
                >
                  取消
                </Button>
              </div>
              <div style={{ display: "inline-block", margin: "0 20px" }}>
                <Button onClick={save} disabled={configMode === "edit" && (!epochs || !imageSize || !model)}>
                  {configMode === "confirm" ? "开始训练" : "保存"}
                </Button>
              </div>
            </>
          )}
        </div>
      }
      style={{ width: 750 }}
      onHide={onClosed}
      onShow={onOpened}
    />
  );
}
