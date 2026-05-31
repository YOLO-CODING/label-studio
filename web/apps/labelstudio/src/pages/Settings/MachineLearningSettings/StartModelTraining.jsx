import { useCallback, useState } from "react";
import { Button } from "@humansignal/ui";
import { useAPI } from "../../../providers/ApiProvider";
import { Typography } from "@humansignal/ui";

export const StartModelTraining = ({ backend }) => {
  const api = useAPI();
  const [response, setResponse] = useState(null);

  const onStartTraining = useCallback(
    async (backend) => {
      const res = await api.callApi("trainMLBackend", {
        params: {
          pk: backend.id,
        },
      });

      setResponse(res.response || {});
    },
    [api],
  );

  return (
    <div className="max-w-[680px]">
      {/* <Typography size="small" className="text-neutral-content-subtler"> */}
      {/*   You're about to manually trigger your model's training process. This action will start the learning phase based */}
      {/*   on how train method is implemented in the ML Backend. Proceed to begin this process. */}
      {/* </Typography> */}
      {/* <Typography size="small" className="text-neutral-content-subtler mt-base mb-wide"> */}
      {/*   *Note: Currently, there is no built-in feedback loop within this interface for tracking the training progress. */}
      {/*   You'll need to monitor the model's training steps directly through the model's own tools and environment. */}
      {/* </Typography> */}
      <Typography size="small" className="text-neutral-content-subtler">
        即将手动触发模型训练过程。此操作将根据机器学习后端中训练方法的实现，启动模型的学习阶段。点击继续以开始此过程。
      </Typography>
      <Typography size="small" className="text-neutral-content-subtler mt-base mb-wide">
        *注意：当前界面内没有内置的训练进度跟踪反馈循环。您需要通过模型自身的工具和环境直接监控训练步骤。
      </Typography>

      {!response && (
        <Button
          onClick={() => {
            onStartTraining(backend);
          }}
        >
          开始训练
        </Button>
      )}

      {!!response && (
        <>
          <pre>请求已发送！</pre>
          <pre>返回: {JSON.stringify(response, null, 2)}</pre>
        </>
      )}
    </div>
  );
};
