import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@humansignal/ui";
import { Form, TextArea, Toggle } from "../../components/Form";
import { MenubarContext } from "../../components/Menubar/Menubar";
import { Block, Elem } from "../../utils/bem";

import { ModelVersionSelector } from "./AnnotationSettings/ModelVersionSelector";
import { ProjectContext } from "../../providers/ProjectProvider";
import { Divider } from "../../components/Divider/Divider";

export const AnnotationSettings = () => {
  const { project, fetchProject } = useContext(ProjectContext);
  const pageContext = useContext(MenubarContext);
  const formRef = useRef();
  const [collab, setCollab] = useState(null);

  useEffect(() => {
    pageContext.setProps({ formRef });
  }, [formRef]);

  const updateProject = useCallback(() => {
    fetchProject(project.id, true);
  }, [project]);

  return (
    <Block name="annotation-settings">
      <Elem name={"wrapper"}>
        <h1>标注设置</h1>
        <Block name="settings-wrapper">
          <Form
            ref={formRef}
            action="updateProject"
            formData={{ ...project }}
            params={{ pk: project.id }}
            onSubmit={updateProject}
          >
            <Form.Row columnCount={1}>
              <Elem name={"header"}>标注说明</Elem>
              <div class="settings-description">
                <p style={{ marginBottom: "0" }}>编写说明以帮助用户完成标注任务。</p>
                <p style={{ marginTop: "8px" }}>
                   说明字段支持HTML标记语法，您可以在其中嵌入图片、iframe（pdf文档）等多种媒体元素。
                </p>
              </div>
              <div>
                <Toggle label="标注前显示说明" name="show_instruction" />
              </div>
              {/* <Elem name={"header"}>Labeling Instructions</Elem> */}
              {/* <div class="settings-description"> */}
              {/*   <p style={{ marginBottom: "0" }}>Write instructions to help users complete labeling tasks.</p> */}
              {/*   <p style={{ marginTop: "8px" }}> */}
              {/*     The instruction field supports HTML markup and it allows use of images, iframes (pdf). */}
              {/*   </p> */}
              {/* </div> */}
              {/* <div> */}
              {/*   <Toggle label="Show before labeling" name="show_instruction" /> */}
              {/* </div> */}
              <TextArea name="expert_instruction" style={{ minHeight: 128, maxWidth: "520px" }} />
            </Form.Row>

            <Divider height={32} />

            <Form.Row columnCount={1}>
              <br />
              <Elem name={"header"}>预标注</Elem>
              <div>
                <Toggle
                  label="使用预测结果进行预标注"
                  description={<span>启用并选择用于预标注的预测结果集。</span>}
                  name="show_collab_predictions"
                  onChange={(e) => {
                    setCollab(e.target.checked);
                  }}
                />
              </div>

              {(collab !== null ? collab : project.show_collab_predictions) && <ModelVersionSelector />}
            </Form.Row>

            <Form.Actions>
              <Form.Indicator>
                <span case="success">已保存!</span>
              </Form.Indicator>
              <Button type="submit" look="primary" className="w-[150px]" aria-label="Save annotation settings">
                保存
              </Button>
            </Form.Actions>
          </Form>
        </Block>
      </Elem>
    </Block>
  );
};

AnnotationSettings.title = "标注";
AnnotationSettings.path = "/annotation";
