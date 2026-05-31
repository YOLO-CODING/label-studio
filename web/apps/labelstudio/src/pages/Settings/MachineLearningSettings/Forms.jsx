import { useState } from "react";
import { Button } from "@humansignal/ui";
import { ErrorWrapper } from "../../../components/Error/Error";
import { InlineError } from "../../../components/Error/InlineError";
import { Form, Input, Select, TextArea, Toggle } from "../../../components/Form";
import "./MachineLearningSettings.scss";

const CustomBackendForm = ({ action, backend, project, onSubmit }) => {
  const [selectedAuthMethod, setAuthMethod] = useState("NONE");
  const [, setMLError] = useState();

  return (
    <Form
      action={action}
      formData={{ ...(backend ?? {}) }}
      params={{ pk: backend?.id }}
      onSubmit={async (response) => {
        if (!response.error_message) {
          onSubmit(response);
        }
      }}
    >
      <Input type="hidden" name="project" value={project.id} />

      <Form.Row columnCount={1}>
        <Input name="title" label="模型名称" placeholder="" />
      </Form.Row>

      <Form.Row columnCount={1}>
        <Input name="url" label="模型接口URL" />
      </Form.Row>

      <Form.Row columnCount={2}>
        <Select
          name="auth_method"
          label="选择认证方式"
          options={[
            // { label: "No Authentication", value: "NONE" },
            // { label: "Basic Authentication", value: "BASIC_AUTH" },
            { label: "无认证", value: "NONE" },
            { label: "基础认证", value: "BASIC_AUTH" },
          ]}
          value={selectedAuthMethod}
          onChange={setAuthMethod}
        />
      </Form.Row>

      {(backend?.auth_method === "BASIC_AUTH" || selectedAuthMethod === "BASIC_AUTH") && (
        <Form.Row columnCount={2}>
          <Input name="basic_auth_user" label="用户名" />
          {backend?.basic_auth_pass_is_set ? (
            <Input name="basic_auth_pass" label="密码" type="password" placeholder="********" />
          ) : (
            <Input name="basic_auth_pass" label="密码" type="password" />
          )}
        </Form.Row>
      )}

      <Form.Row columnCount={1}>
        <TextArea
          // name="extra_params"
          // label="Any extra params to pass during model connection"
          label="额外连接参数"
          description="建立模型连接时传递的额外参数"
          style={{ minHeight: 120 }}
        />
      </Form.Row>

      <Form.Row columnCount={1}>
        <Toggle
          name="is_interactive"
          // label="Interactive preannotations"
          // description="If enabled some labeling tools will send requests to the ML Backend interactively during the annotation process."
          label="启用交互式预标注"
          description="启用后，部分标注工具会在标注过程中实时向机器学习后端发送请求，提供智能标注建议。"
        />
      </Form.Row>

      <Form.Actions>
        <Button type="submit" look="primary" onClick={() => setMLError(null)} aria-label="Save machine learning form">
           验证并保存
        </Button>
      </Form.Actions>

      <Form.ResponseParser>
        {(response) => (
          <>
            {response.error_message && (
              <ErrorWrapper
                error={{
                  response: {
                    // detail: `Failed to ${backend ? "save" : "add new"} ML backend.`,
                    detail: `${backend ? "保存" : "添加"}机器学习后端失败`,
                    exc_info: response.error_message,
                  },
                }}
              />
            )}
          </>
        )}
      </Form.ResponseParser>

      <InlineError />
    </Form>
  );
};

export { CustomBackendForm };
