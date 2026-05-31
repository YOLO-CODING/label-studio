import { Button, Typography } from "@humansignal/ui";
import { Space } from "@humansignal/ui/lib/space/space";
import { Block } from "apps/labelstudio/src/components/Menu/MenuContext";
import { Modal } from "apps/labelstudio/src/components/Modal/ModalPopup";
import { API } from "apps/labelstudio/src/providers/ApiProvider";
import { useAtomValue } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "../../../components/Form";

const linkAtom = atomWithQuery(() => ({
  queryKey: ["invite-link"],
  async queryFn() {
    // called only once when the component is rendered on page reload
    // will also be reset when called `refetch()` on the Reset button
    const result = await API.invoke("resetInviteLink");
    return location.origin + result.invite_url;
  },
}));

export function InviteLink({
  opened,
  onOpened,
  onClosed,
}: {
  opened: boolean;
  onOpened?: () => void;
  onClosed?: () => void;
}) {
  const modalRef = useRef<Modal>();
  useEffect(() => {
    if (modalRef.current && opened) {
      modalRef.current?.show?.();
    } else if (modalRef.current && modalRef.current.visible) {
      modalRef.current?.hide?.();
    }
  }, [opened]);

  return (
    <Modal
      ref={modalRef}
      title="邀请成员"
      opened={opened}
      bareFooter={true}
      body={<InvitationModal />}
      footer={<InvitationFooter />}
      style={{ width: 640, height: 472 }}
      onHide={onClosed}
      onShow={onOpened}
    />
  );
}

const InvitationModal = () => {
  const { data: link } = useAtomValue(linkAtom);
  return (
    <Block name="invite">
      <Input value={link} style={{ width: "100%" }} readOnly />
      <Typography size="small" className="text-neutral-content-subtler mt-base mb-wider">
        ✨ 邀请伙伴，一起创造更大价值！<br/>
        您邀请的伙伴将获得平台所有项目的完全访问权，携手加速标注进程！{" "}
        {/* Invite people to join your Label Studio instance. People that you invite have full access to all of your */}
        {/* projects.{" "} */}
        {/* <a */}
        {/*   href="https://labelstud.io/guide/signup.html" */}
        {/*   target="_blank" */}
        {/*   rel="noreferrer" */}
        {/*   className="hover:underline" */}
        {/*   onClick={() => */}
        {/*     __lsa("docs.organization.add_people.learn_more", { */}
        {/*       href: "https://labelstud.io/guide/signup.html", */}
        {/*     }) */}
        {/*   } */}
        {/* > */}
        {/*   Learn more */}
        {/* </a> */}
      </Typography>
    </Block>
  );
};

const InvitationFooter = () => {
  const { copyText, copied } = useTextCopy();
  const { refetch, data: link } = useAtomValue(linkAtom);

  return (
    <Space spread>
      <Space>
        <Button
          variant="negative"
          look="outlined"
          style={{ width: 170 }}
          onClick={() => refetch()}
          aria-label="Refresh invite link"
        >
          重置链接
        </Button>
      </Space>
      <Space>
        <Button
          variant={copied ? "positive" : "primary"}
          className="w-[170px]"
          onClick={() => copyText(link!)}
          aria-label="Copy invite link"
        >
          {copied ? "已复制！" : "复制链接"}
        </Button>
      </Space>
    </Space>
  );
};

function useTextCopy() {
  const [copied, setCopied] = useState(false);

  const copyText = useCallback((value: string) => {
    setCopied(true);

    try {
      navigator.clipboard.writeText(value ?? "");
    } catch(err) {
      // 使用最兼容的传统方法
      const textArea = document.createElement("textarea");
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setTimeout(() => setCopied(false), 1500);
  }, []);

  return { copied, copyText };
}
