import { Modal } from "../../components/Modal/ModalPopup";
import { useAPI } from "../../providers/ApiProvider";
import { Button } from "@humansignal/ui";
import { Block, Elem } from "../../utils/bem";
import { useRef,useCallback, useEffect, useState, useContext } from "react";
import { Input, Label } from "../../components/Form";
import { Space } from "../../components/Space/Space";
import { ToastContext } from "@humansignal/ui";

export default function PlanConfigModal({
  opened,
  onOpened,
  onClosed,
  onSaved,
  plan,
  mode
}) {
  const modalRef = useRef(null);
  const [epochs, setEpochs] = useState(plan.epochs || 100);
  const [imageSize, setImageSize] = useState(plan.imgsz || 640);
  const [planId, setPlanId] = useState(plan.id);
  const configMode = mode || '';
  const title = (configMode == 'confirm') ? "确认" : "配置";

  const latestState = useRef();
  latestState.current = { epochs, imageSize, planId };

  const api = useAPI();
  const toast = useContext(ToastContext);

  useEffect(() => {
    if (modalRef.current && opened) {
      modalRef.current?.show?.();
    } else if (modalRef.current && modalRef.current.visible) {
      modalRef.current?.hide?.();
    }
  }, [opened]);

  const handleEpochsChange = (e) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    setEpochs(isNaN(numValue) ? '' : numValue);
  };

  const handleImageSizeChange = (e) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    setImageSize(isNaN(numValue) ? '' : numValue);
  };

  const saveConfirm = async () => {
    const { epochs, imageSize, planId } = latestState.current;

    const configData = {
      epochs: epochs || 10,
      imgsz: imageSize || 224,
      id: planId
    };

    const response = await api.callApi("confirmPlan", {
        params: {
          pk: plan.id
        },
        body: configData
    });
    if (response) {
      if (response.id) {
        // success
        toast.show({ message: "训练计划已确认", type: "info" });

        modalRef.current?.hide?.();
    
        if (onSaved) {
          onSaved();
        }
      }
      else {
          toast.show({ message: "训练计划确认失败：" + (response.error||''), type: "error" });
      }
    }
  }

  const saveEdit = async () => {
    const { epochs, imageSize, planId } = latestState.current;

    const configData = {
      epochs: epochs || 10,
      imgsz: imageSize || 224,
      id: planId
    };

    const response = await api.callApi("editPlan", {
        params: {
          pk: plan.id
        },
        body: configData
    });
    if (response) {
      if (response.id) {
        // success
        toast.show({ message: "训练计划已更新", type: "info" });

        modalRef.current?.hide?.();
    
        if (onSaved) {
          onSaved();
        }
      }
      else {
          toast.show({ message: "训练计划更新失败：" + (response.error||''), type: "error" });
      }
    }
  }

  const save = async () => {
    if (configMode == 'confirm') {
      saveConfirm();
    }
    else {
      saveEdit();
    }
  }

  return (
    <Modal
      ref={modalRef}
      opened={opened}
      closeOnClickOutside={false}
      title={title}
      body={
        <Block name="plan-config-modal">

          { configMode == 'confirm' && (
            <Elem name="warp">
              <Space style={{fontSize: 20, marginBottom: 20, lineHeight: 1.5}}>确认后训练任务将立即开始，可以在计划详情页面查看训练进度和日志。<br/>请确认是否提交训练计划? </Space>
              <Space style={{fontSize: 18, marginBottom: 10}}>请检查下面的训练参数：</Space>
            </Elem>
          )}
          { (configMode == 'edit' || !mode) && (
            <Elem name="warp">
              <Space style={{fontSize: 20, marginBottom: 10, lineHeight: 1.5}}>修改训练参数： </Space>
            </Elem>
          )}

          <Elem name="warp" style={{padding: 10}}>
            <Block name="settings-column">
              <Label text="训练轮数" size="medium" />
              <Input
                name="epochs"
                type="number"
                defaultValue={epochs || ''}
                onChange={handleEpochsChange}
                min="1"
                placeholder="请输入训练轮数"
              />
            </Block>
            <Block name="settings-column">
              <Label text="训练图像尺寸" />
              <Input
                name="imageSize"
                type="number"
                defaultValue={imageSize || ''}
                onChange={handleImageSizeChange}
                min="32"
                placeholder="请输入图像尺寸"
              />
              <Space style={{display: 'inline', marginLeft: 10}}>范围：320 - 1280， 必需是32的倍数</Space>
            </Block>
          </Elem>
        </Block>
      }
      footer={
        <div style={{position: 'relative', fontSize: 16}}>
          <div style={{display: 'inline-block', margin: '0 20px'}}>
            <Button
              style={{backgroundColor: '#ffffff', color: '#4c5fa9'}}
              onClick={() => { modalRef.current?.hide();}}
            >
              取消
            </Button>
          </div>
          <div style={{display: 'inline-block', margin: '0 20px'}}>
            <Button
              onClick={save}
              disabled={!epochs || !imageSize}
            >
              确定
            </Button>
          </div>
          
        </div>
      }
      style={{ width: 750, height: 400 }}
      onHide={onClosed}
      onShow={onOpened}
    />
  );
}
