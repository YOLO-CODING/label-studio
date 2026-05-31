import { IconExternal, IconFolderAdd, IconHumanSignal, IconUserAdd, IconFolderOpen } from "@humansignal/icons";
import { Button, SimpleCard, Spinner, Typography } from "@humansignal/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAPI } from "../../providers/ApiProvider";
import { CreateProject } from "../CreateProject/CreateProject";
import { InviteLink } from "../Organization/PeoplePage/InviteLink";
import type { Page } from "../types/Page";
import Background from "./Background"
import RectSvg from "./Rect.jsx"
import { TiUserAdd } from "react-icons/ti";
import "./HomePage.scss"
import { Block, Elem } from "../../utils/bem";
import { IoMdArrowDropright } from "react-icons/io";
import { TbBrandDatabricks } from "react-icons/tb";
import { BiShapePolygon } from "react-icons/bi";
import { SiGooglecontaineroptimizedos } from "react-icons/si";

const PROJECTS_TO_SHOW = 10;

type Action = (typeof actions)[number]["type"];

export const HomePage: Page = () => {
  const api = useAPI();
  const [creationDialogOpen, setCreationDialogOpen] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const { data, isFetching, isSuccess, isError } = useQuery({
    queryKey: ["projects", { page_size: 10 }],
    async queryFn() {
      return api.callApi<{ results: APIProject[]; count: number }>("projects", {
        params: { page_size: PROJECTS_TO_SHOW },
      });
    },
  });

  const handleActions = (action: Action) => {
    return () => {
      switch (action) {
        case "createProject":
          setCreationDialogOpen(true);
          break;
        case "invitePeople":
          setInvitationOpen(true);
          break;
      }
    };
  };

  return (
    <main className="p-6">
      <Background/>
      <Block name='main-title'>
        <div>
          构建企业级AI流水线
        </div>
        <div style={{
            fontSize: '24px',
            fontWeight: 100,
          }}>
          从非结构化数据到生产级模型的端到端工程平台
        </div>
      </Block>

      <Block name="main-button-group">
        <Button
          key={'fastStart'}
          look="outlined"
          align="center"
          onClick={handleActions('createProject')}
          leading={ <IoMdArrowDropright fontSize="16"/> }
          style={{
            width: '170px',
            background: 'linear-gradient(-40deg, #E91E63 0%, #5c8fc2 100%)',
            color: '#fff',
            border: 'none',
            fontSize: '14px',
            fontWeight: 300,
            marginRight: '10px'
          }}
        >
          快速开始
        </Button>
        <Button
          key="invite people"
          look="outlined"
          align="center"
          onClick={handleActions('invitePeople')}
          style={{
            padding: '10px'
          }}
        >
          <TiUserAdd fontSize="14"/>
          邀请成员
        </Button>
      </Block>


      <Block name="main-desc-warp">
        <Elem name="info-pannel">
          <Elem name="feature-item">
            <h3><TbBrandDatabricks /><span>数据资产管理</span></h3>
            <p>支持与对象存储无缝对接，实现数据的集中化存储与全链路溯源，可作为标准化数据资产接入企业数据湖，确保数据的一致性与可审计性。</p>
          </Elem>

          <Elem name="feature-item">
            <h3><BiShapePolygon /><span>智能化标注工作流</span></h3>
            <p>支持接入任意阶段的模型作为预标注服务，结合人机协同修正机制，自动聚焦于低置信度样本进行高效优化，实现"模型辅助标注、标注迭代模型"的持续增强闭环。</p>
          </Elem>

          <Elem name="feature-item">
            <h3><SiGooglecontaineroptimizedos /><span>容器化训练与资源隔离</span></h3>
            <p>基于容器化环境结合弹性算力调度，实现训练任务的高效执行与资源隔离，将人力资源精准聚焦于算法最需要优化的数据边界。</p>
          </Elem>
          <RectSvg/>
        </Elem>
      </Block>
      <Block name="main-foot">
        @copyright  <b>CSSC 2025</b>
      </Block>

      <section>
        {creationDialogOpen && <CreateProject onClose={() => setCreationDialogOpen(false)} />}
        <InviteLink opened={invitationOpen} onClosed={() => setInvitationOpen(false)} />
      </section>
    </main>
  );
};

HomePage.title = "首页";
HomePage.path = "/";
HomePage.exact = true;

function ProjectSimpleCard({
  project,
}: {
  project: APIProject;
}) {
  const finished = project.finished_task_number ?? 0;
  const total = project.task_number ?? 0;
  const progress = (total > 0 ? finished / total : 0) * 100;
  const white = "#FFFFFF";
  const color = project.color && project.color !== white ? project.color : "#E1DED5";

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block even:bg-neutral-surface rounded-sm overflow-hidden"
      data-external
    >
      <div
        className="grid  p-2 py-3 items-center "
        style={{padding:  '15px 20px'}}
      >
        <div className="flex flex-col gap-1">
          <span className="text-neutral-content">{project.title}</span>
          <div className="text-neutral-content-subtler text-sm">
            {finished} / {total} 个任务 ({total > 0 ? Math.round((finished / total) * 100) : 0}%)
          </div>
          <div className="bg-neutral-surface rounded-full overflow-hidden w-full h-2 shadow-neutral-border-subtle shadow-border-1">
            <div className="bg-positive-surface-hover h-full" style={{ maxWidth: `${progress}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
