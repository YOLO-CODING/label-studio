import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import styles from './PlanDetailPage.scss';
import { Pagination, Spinner } from "../../components";
import { usePage, usePageSize } from "../../components/Pagination/Pagination";
import TrainCharts from "./TrainCharts"
import { useAPI } from "../../providers/ApiProvider";
import { RiRefreshLine } from "react-icons/ri";
import { Tooltip } from "@humansignal/ui";
import Ansi from "ansi-to-react";
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  createColumnHelper 
} from "@tanstack/react-table";
import { addCrumb } from '../../services/breadrumbs';
// import {MOCK_LOG} from './mock'
import axios from 'axios';

const columnHelper = createColumnHelper();

export const PlanDetailPage = () => {
  const { id } = useParams(); // 从路由获取计划ID
  useEffect(() => {
    setTimeout(()=> {
      addCrumb({
        title: '任务详情',
        key: `/plans/${id}/detail`,
        path: `/plans/${id}/detail`,
      })
    },0)
  }, [])

  const api = useAPI()
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    api.callApi('getPlan', {
      params: {
        pk: id
      }
    })
      .then((response) => {
        if (response) {
          setPlan(response);
        } else {
          setError(`未找到ID为 ${id} 的训练计划`);
        }
      })
      .catch((err) => {
        setError('获取数据失败，请稍后重试');
      });
  }, [])

  return (
    <div className={styles.planDetailPage} >
      {
        plan && <Tabs 
          tabs = {['训练详情', '训练日志']}
          contents={[
            <DetailsView plan={plan}/>,
            <LogView planId={id} status={plan.status} />
          ]}
        />
      }
    </div>
  );
};


const Tabs = (props) => {
  const { tabs=[], contents=[], defaultActive = 0 } = props;

  const [active, setActive] = useState(defaultActive);

  return (
    <div>
      <div className={styles.planTabs}>
        {tabs.map((tab, i) => (
          <span
            className={styles.planTab}
            key={i}
            onClick={() => setActive(i)}
            className={`${styles.planTab} ${i===active ? styles.planActive : ''}`}
          >
            {tab}
          </span>
        ))}
      </div>
      <div>
        {contents[active]}
      </div>
    </div>
  );
};

const DetailsView = ({plan}) => {
  const { id } = useParams();

  const statusMap = {
    0: { text: '待确认', color: '#ffc107' },
    1: { text: '已下达', color: '#00bb00' },
    2: { text: '已确认', color: '#00bb00' },
    3: { text: '文件就绪', color: '#17a2b8' },
    4: { text: '进行中', color: '#17a2b8' },
    6: { text: '已失败', color: '#dc3545' },
    9: { text: '已完成', color: '#28a745' },
  };

  const formatTime = (date) => date ? new Date(date).toLocaleString('zh-CN') : '-';

  const getStatus = (plan) => {
    if (plan.cancelled || plan.status === -1) return { text: '已撤销', color: '#6c757d' };
    if (plan.failed) return { text: '已失败', color: '#dc3545' };
    return statusMap[plan.status] || { text: '异常', color: '#6c757d' };
  };

  const getStatusText = (plan) => {
    const status = getStatus(plan);
    return status.text;
  };

  const getStatusColor = (plan) => {
    const status = getStatus(plan);
    return status.color;
  };


  // if (loading) return <div className="loading">加载中...</div>;
  if (!plan) return <div>计划未找到</div>;

  const status = getStatus(plan);
  const basicInfo = [
    ['项目名称', plan.project_title],
    ['计划ID', plan.id],
    ['标注类型', plan.parsed_label_config?.label?.type],
    ['训练轮数', plan.epochs],
    ['创建者', plan.created_by?.email],
  ];

  const timeInfo = [
    ['提交时间', plan.created_at ? formatTime(plan.created_at) : '--'],
    ['开始时间', plan.started_at ? formatTime(plan.started_at) : '--'],
    ['完成时间', plan.completed_at ? formatTime(plan.completed_at) : '--'],
  ];

  const statusInfo = [
    ['状   态', getStatusText(plan), getStatusColor(plan)],
  ];

  return (
    <>
      <div className={styles.planTabHeader}>
        <InfoTable title="基本信息" items={basicInfo} />
        <InfoTable title="时间" items={timeInfo} />
        <InfoTable title="训练" items={statusInfo} />
      </div>
      <div className={styles.detailContent}>
        <div className={styles.dashboard}>
          <TrainCharts id={id} epochsCount={plan.epochs} batchNo={plan.batch_last}/>
        </div>
      </div>
    </>
  );
};

const InfoTable = ({ title, items }) => (
  <div className={styles.planCard}>
    <div className={styles.planCardHeader}><h4>{title}</h4></div>
    <div>
      <div>
        {items.map(([label, value, color], i) => (
          <div key={i} className={styles.planInfoItem}>
            <div className="label" style={{width: '100px'}}>{label}：</div>
            <div className="value" style={{color: color}}>{value || '-'}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LogView = ({planId, status}) => {

  const api = useAPI()
  const [records, setRecrods] = useState([]);

  useEffect(() => {
    // mock
    // const logs = MOCK_LOG.split('\n')
    // setRecrods(logs)
    // return
    
    // request Log
    if (status && planId) {
      fetchRecords();
    }
  }, [planId, status]);

  const fetchRecords = async () => {
    try {
      const response = await axios.get("/api/plans/" + planId + "/training-log", {
        params: { pk: planId },
        responseType: 'text'
      });

      if (response?.data) {
        setRecrods(response?.data.split('\n'));
      }
    } catch (error) {
      console.error('获取训练日志失败:', error);
    }
  };

  const refreshLog = async() => {
    if (status && planId) {
      fetchRecords();
    }
  };

  return (
    <>
      <div className={styles.planTabHeader}>
        <Tooltip title="刷新日志">
          <div className={styles.logRefreshButton} onClick={() => refreshLog() }>
            <RiRefreshLine />
          </div>
        </Tooltip>
      </div>
      <div className={styles.logPannel}>
        <div>
          {records?.length > 0 ? (
            records.map((line, index) => (
              <p key={index} className={styles.logRecordItem}>
                <i className={styles.logRecordMarker}>{index}</i>
                <span className={styles.logRecordInfo}> <Ansi>{line}</Ansi></span>
              </p>
            ))
          ) : (
            <div className={styles.emptyState}>
              {/* <p>暂无训练日志</p> */}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

PlanDetailPage.title = "训练计划";
PlanDetailPage.path = "/plans/:id/detail";
PlanDetailPage.exact = true;
