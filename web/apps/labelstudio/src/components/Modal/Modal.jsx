import { createRef } from "react";
import { createRoot } from "react-dom/client";
import { ApiProvider } from "../../providers/ApiProvider";
import { ConfigProvider } from "../../providers/ConfigProvider";
import { CurrentUserProvider } from "../../providers/CurrentUser";
import { MultiProvider } from "../../providers/MultiProvider";
import { cn } from "../../utils/bem";
import { Button } from "@humansignal/ui";
import { Space } from "../Space/Space";
import { Modal } from "./ModalPopup";
import { ToastProvider, ToastViewport } from "@humansignal/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../utils/query-client";

const standaloneModal = (props) => {
  const modalRef = createRef();
  const rootDiv = document.createElement("div");
  let renderCount = 0;
  let root = null;
  rootDiv.className = cn("modal-holder").toClassName();

  document.body.appendChild(rootDiv);

  const renderModal = (props, animate) => {
    renderCount++;

    if (!root) {
      root = createRoot(rootDiv);
    }

    // simple modals don't require any parts of the app and can't cause the loop of death
    root.render(
      <MultiProvider
        key={`modal-${renderCount}`}
        providers={
          props.simple
            ? []
            : [
                <ConfigProvider key="config" />,
                <ToastProvider key="toast" />,
                <ApiProvider key="api" />,
                <CurrentUserProvider key="current-user" />,
                <QueryClientProvider client={queryClient} />,
              ]
        }
      >
        <Modal
          ref={modalRef}
          {...props}
          onHide={() => {
            props.onHidden?.();
            if (root) {
              root.unmount();
            }
            rootDiv.remove();
            root = null;
          }}
          animateAppearance={animate}
        />
        {!props.simple && <ToastViewport />}
      </MultiProvider>,
    );
  };

  renderModal(props, true);

  return {
    update(newProps) {
      renderModal({ ...props, ...(newProps ?? {}), visible: true }, false);
    },
    close() {
      const result = modalRef.current.hide();
      if (root) {
        root.unmount();
      }
      rootDiv.remove();
      root = null;
      return result;
    },
  };
};

export const confirm = ({ okText, onOk, cancelText, onCancel, buttonLook, ...props }) => {
  const modal = standaloneModal({
    ...props,
    allowClose: false,
    footer: (
      <Space align="end">
        <Button
          onClick={() => {
            onCancel?.();
            modal.close();
          }}
          look="outlined"
          autoFocus
          className="min-w-[120px]"
        >
          {cancelText ?? "取消"}
        </Button>

        <Button
          onClick={() => {
            onOk?.();
            modal.close();
          }}
          variant={buttonLook ?? "primary"}
          className="min-w-[120px]"
        >
          {okText ?? "确定"}
        </Button>
      </Space>
    ),
  });

  return modal;
};

export const info = ({ okText, onOkPress, ...props }) => {
  const modal = standaloneModal({
    ...props,
    footer: (
      <Space align="end">
        <Button
          onClick={() => {
            onOkPress?.();
            modal.close();
          }}
          size="small"
          className="min-w-[120px]"
        >
          {okText ?? "确定"}
        </Button>
      </Space>
    ),
  });

  return modal;
};

export { standaloneModal as modal };
export { Modal };

Object.assign(Modal, {
  info,
  confirm,
  modal: standaloneModal,
});
