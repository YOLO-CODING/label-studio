import { useMemo, useEffect, useState, useContext } from "react";
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  createColumnHelper 
} from "@tanstack/react-table";
import { Link, useHistory } from "react-router-dom";
import { Pagination, Spinner } from "../../components";
import { usePage, usePageSize } from "../../components/Pagination/Pagination";
import { useAPI } from "../../providers/ApiProvider";
import { Button, buttonVariant, ToastContext, ToastType } from "@humansignal/ui";
import { HiClipboardCopy } from "react-icons/hi";
import { RiDeleteBin6Line, RiShareForwardFill } from "react-icons/ri";
import styles from "./Models.scss"
import Empty  from './Empty'
import { confirm } from "../../components/Modal/Modal";

const columnHelper = createColumnHelper();

export const TrainedModelsPage = () => {
  const api = useAPI();
  const toast = useContext(ToastContext);
  const history = useHistory();

  const [modelsList, setModelsList] = useState([]);
  const [currentPage, setCurrentPage] = usePage("page", 1);
  const [currentPageSize, setCurrentPageSize] = usePageSize("page_size", 20);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copiedPath, setCopiedPath] = useState(null); // 用于跟踪正在复制的路径
  const [showDeployModal, setShowDeployModal] = useState(false); // 控制部署Modal显示
  const [selectedModel, setSelectedModel] = useState(null); // 当前选中的模型
  const [targetProjectId, setTargetProjectId] = useState(''); // 目标项目ID
  const [projectsList, setProjectsList] = useState([]); // 项目列表
  const [showCancelDeployModal, setShowCancelDeployModal] = useState(false); // 控制取消部署Modal显示
  const [cancelProjectId, setCancelProjectId] = useState(''); // 要取消部署的项目ID
  const [deployError, setDeployError] = useState(null); // 部署错误信息（显示在部署Modal内）
  const [scoreThreshold, setScoreThreshold] = useState('0.5'); // 置信度阈值

  // 复制文本到剪贴板
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // 显示成功提示
      toast.show({
        message: '文件路径已复制到剪贴板',
        type: ToastType.success,
        duration: 3000,
      });
      
      return true;
    } catch (err) {
      console.error('复制失败:', err);
      toast.show({
        message: '复制失败，请手动复制',
        type: ToastType.error,
        duration: 10000,
      });
      
      return false;
    }
  };

  // 复制文件路径
  const handleCopyPath = async (path, name, batchNo, id) => {
    setCopiedPath(id); // 设置当前正在复制的路径ID
    
    const success = await copyToClipboard(path);
    
    if (success) {
      // 成功后重置状态
      setTimeout(() => {
        setCopiedPath(null);
      }, 2000);
    } else {
      setCopiedPath(null);
    }
  };

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const response = await api.callApi('projects', {
        params: {
          page: 1,
          page_size: 100,
        },
      });
      
      if (response.results) {
        setProjectsList(response.results);
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  };

  // 获取训练计划列表
  const fetchModels = async (page, pageSize) => {
    try {
      setLoading(true);
      const response = await api.callApi('trainedModels', {
        params: {
          page,
          page_size: pageSize,
        },
      });

      if (response.results) {
        // mockdata
        // setModelsList(mockTrainedModels.results);
        // setTotalItems(mockTrainedModels.count);
        // return;
        
        setModelsList(response.results);
        setTotalItems(response.count);
      }
    } catch (error) {
      console.error('获取模型输出失败:', error);
      toast.show({
        message: '获取模型输出失败',
        type: ToastType.error,
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteModel = async(m) => {
    confirm({
      title: "删除模型记录",
      body: "您即将删除该训练模型的记录。删除后，数据库记录将被移除，但训练输出的模型文件不会被删除。",
      okText: "确认删除",
      buttonLook: "negative",
      onOk: async () => {
        try {
          const response = await api.callApi('deleteTrainingModel', {
            params: {
              pk: m.id
            }
          });
          if (response) {
            toast.show({ message: "模型记录已删除", type: "info" });
            history.go(0);
            return
          }

        }
        catch (error) {
          console.error("Error to delete model", error);
          toast.show({ message: "模型记录删除失败", type: "error" });
        }
      }
    });
  }

  const deployModel = async (m) => {
    const defaultProjectId = m.plan?.project_id;
    setSelectedModel(m);
    setTargetProjectId(defaultProjectId?.toString() || '');
    setScoreThreshold('0.5');
    setDeployError(null);
    setShowDeployModal(true);
  }
  
  // 确认部署
  const handleConfirmDeploy = async () => {
    if (!selectedModel) return;
    
    const projectId = parseInt(targetProjectId.trim());
    
    if (!projectId || isNaN(projectId)) {
      toast.show({ 
        message: '请选择有效的项目', 
        type: "error"
      });
      return;
    }
    
    // Validate score threshold
    const threshold = parseFloat(scoreThreshold);
    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      setDeployError({
        message: '置信度必须是 0 到 1 之间的数字（例如：0.25 表示 25%）',
        validation: null
      });
      return;
    }
    
    // Clear previous error
    setDeployError(null);
    
    try {
      const response = await api.callApi('deployTrainingModel', {
        params: {
          pk: selectedModel.id
        },
        body: {
          project_id: projectId,
          score_threshold: threshold
        },
        suppressError: true
      });
      
      // Check if response contains error (suppressed errors return error object)
      if (response && response.error) {
        const errorData = response.response?.data || response.response || {};
        const errorMsg = errorData.error || response.error || "部署失败";
        
        setDeployError({
          message: errorMsg,
          validation: errorData.label_validation || null
        });
        return;  // Keep modal open to show error
      }
      
      if (response) {
        // Success
        setShowDeployModal(false);
        setDeployError(null);
        const successMsg = response.score_threshold !== undefined
          ? `模型已成功部署到 ${response.project_title}（置信度：${response.score_threshold}）`
          : `模型已成功部署到 ${response.project_title}`;
        toast.show({ 
          message: successMsg, 
          type: "success",
          duration: 5000
        });
        fetchModels(currentPage, currentPageSize);
        setSelectedModel(null);
        return;
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.message || "模型部署失败，请检查后端日志";
      
      setDeployError({
        message: errorMsg,
        validation: error?.response?.data?.label_validation || null
      });
    }
  }
  
  const cancelDeploy = async (m) => {
    // 显示取消部署Modal
    setSelectedModel(m);
    setCancelProjectId('');
    setShowCancelDeployModal(true);
  }
  
  // 确认取消部署
  const handleConfirmCancelDeploy = async () => {
    if (!selectedModel || !cancelProjectId) {
      toast.show({ 
        message: '请选择要取消部署的项目', 
        type: "error"
      });
      return;
    }
    
    setShowCancelDeployModal(false);
    
    try {
      const response = await api.callApi('cancelTrainingModelDeploy', {
        params: {
          pk: selectedModel.id
        },
        body: {
          project_id: parseInt(cancelProjectId)
        }
      });
      
      if (response) {
        toast.show({ 
          message: `已取消部署到 Project ${cancelProjectId}`, 
          type: "info"
        });
        fetchModels(currentPage, currentPageSize);
        setSelectedModel(null);
        return;
      }
    } catch (error) {
      console.error("取消部署失败:", error);
      const errorMsg = error?.response?.data?.error || error?.message || "取消部署失败";
      toast.show({ 
        message: errorMsg, 
        type: "error",
        duration: 10000
      });
    }
  }

  useEffect(() => {
    fetchModels(currentPage, currentPageSize);
    fetchProjects(); // 获取项目列表
  }, [currentPage, currentPageSize]); // 添加依赖项

  // 格式化时间
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    } catch (error) {
      return dateString;
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: '编号',
        cell: info => info.getValue(),
        size: 80,
      }),
      columnHelper.accessor('name', {
        header: '项目名称',
        cell: info => info.getValue(),
        size: 150,
      }),
      columnHelper.accessor('batch_no', {
        header: '批次号',
        cell: (info) => {
          const batchNo = info.getValue();
          const planId = info.row.original.plan?.id ?? info.row.original.plan_id;
          if (planId == null) return batchNo ?? '-';
          return `Plan ${planId} - ${batchNo}`;
        },
        size: 140,
      }),
      columnHelper.accessor('label_type', {
        header: '标注类型',
        cell: info => info.getValue(),
        size: 120,
      }),
      columnHelper.accessor('model_kind', {
        header: '模型类型',
        cell: info => info.getValue(),
        size: 120,
      }),
      columnHelper.accessor('path', {
        header: '模型名称',
        cell: (info) => {
          const { id, path, name, batch_no } = info.row.original;
          const isCopied = copiedPath === id;
          const fileName = path ? path.split('/').pop() : '-';
          
          return (
            <div className={styles.modelPathCell}>
              <span className={styles.pathText} title={path}>
                {fileName}
              </span>
              <span
                className={styles.modelCopyIcon}
                onClick={() => handleCopyPath(path, name, batch_no, id)}
              >
                <HiClipboardCopy />
              </span>
            </div>
          );
        },
        size: 400,
      }),
      columnHelper.accessor('updated_at', {
        header: '更新时间',
        cell: info => info.getValue() ? formatDateTime(info.getValue()) : '-',
        size: 180,
      }),
      columnHelper.accessor('deployed', {
        header: '部署状态',
        cell: (info) => {
          const deployed = info.getValue();
          
          if (deployed) {
            return <span style={{ color: '#52c41a' }}>已部署</span>;
          }
          return <span style={{ color: '#8c8c8c' }}>未部署</span>;
        },
        size: 100,
      }),
      columnHelper.accessor('deployed_to_project', {
        header: '部署项目',
        cell: (info) => {
          const deploymentHistory = info.row.original.deployment_history || [];
          
          if (deploymentHistory.length === 0) {
            return <span style={{ color: '#8c8c8c' }}>-</span>;
          }
          
          return (
            <div>
              {deploymentHistory.map((deployment, index) => (
                <div key={deployment.id || index} style={{ marginBottom: '8px' }}>
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>
                    {deployment.project_title || '未知项目'}
                  </div>
                  {deployment.deployed_at && (
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                      {formatDateTime(deployment.deployed_at)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        },
        size: 200,
      }),
      columnHelper.display({
        header: '操作',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
            {/* 部署操作 - 始终显示 */}
            <button 
              className={styles.deployButton}
              onClick={() => deployModel(info.row.original)}
              title={info.row.original.deployed ? '重新部署' : '部署'}
            >
              <RiShareForwardFill />
              {info.row.original.deployed ? '重新部署' : '部署'}
            </button>
            
            {/* 取消部署操作 - 仅已部署时显示 */}
            {info.row.original.deployed && (
              <button 
                className={styles.cancelDeployButton}
                onClick={() => cancelDeploy(info.row.original)}
              >
                取消部署
              </button>
            )}
            
            {/* 删除操作 */}
            <button 
              className={styles.deleteButton}
              onClick={() => deleteModel(info.row.original)}
              title="删除"
            >
              <RiDeleteBin6Line />删除
            </button>
          </div>
        ),
        size: 280,
      })
    ],
    [copiedPath] // 添加依赖项
  );

  const table = useReactTable({
    data: modelsList,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={styles.modelsContainer}>
      <div className={styles.header}>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className={styles.loadingContainer}>
          <Spinner size={36} />
          <p>加载中...</p>
        </div>
      )}

      {!loading && modelsList && modelsList.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.modelsTable}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        style={{ width: header.getSize() }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Pagination
            page={currentPage}
            urlParamName="page"
            totalItems={totalItems}
            pageSize={currentPageSize}
            // pageSizeOptions={[20, 30, 50, 100, 2]}
            onPageLoad={fetchModels}
            onChange={(newPage, newPageSize) => {
              setCurrentPage(newPage);
              setCurrentPageSize(newPageSize);
            }}
            style={{ paddingTop: 16 }}
          />
        </>
      )}

      {/* 空状态 */}
      {!loading && (!modelsList || modelsList.length === 0) && (
        <div className={styles.emptyState}>
          <Empty info={'暂无数据'}/>
        </div>
      )}
      
      {/* 部署Modal */}
      {showDeployModal && selectedModel && (
        <div className={styles.deployModalOverlay}>
          <div className={styles.deployModal}>
            <h3>{selectedModel.deployed ? '重新部署模型' : '模型部署'}</h3>
            
            {selectedModel.deployed && (
              <p style={{ color: '#8c8c8c', marginBottom: '10px' }}>
                此模型已部署过（上次: {projectsList.find(p => p.id === selectedModel.deployed_to_project)?.title || '未知项目'}）
              </p>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                选择目标项目:
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">请选择项目</option>
                {projectsList.map(project => (
                  <option key={project.id} value={project.id.toString()}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 置信度设置 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                模型置信度:
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
                  （0 ~ 1，默认 0.5）
                </span>
              </label>
              <input
                type="number"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(e.target.value)}
                min="0"
                max="1"
                step="0.05"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="0.5"
              />
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
                💡 提示：置信度越高，预标注越严格（结果更少但更准确）；置信度越低，预标注越宽松（结果更多但可能不准）。建议初始使用 0.25-0.5 之间。
              </div>
            </div>
            
            {/* 部署错误提示 */}
            {deployError && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                background: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: '4px',
                color: '#856404'
              }}>
                <div style={{ marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>
                  ⚠️ 无法部署
                </div>
                
                <div style={{ fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {deployError.message}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeployModal(false);
                  setDeployError(null);
                  setScoreThreshold('0.5');
                  setSelectedModel(null);
                }}
                className={styles.cancelDeployModalButton}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDeploy}
                className={styles.confirmDeployModalButton}
              >
                确认部署
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 取消部署Modal */}
      {showCancelDeployModal && selectedModel && (
        <div className={styles.deployModalOverlay}>
          <div className={styles.deployModal}>
            <h3>取消部署</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                选择要取消部署的项目:
              </label>
              <select
                value={cancelProjectId}
                onChange={(e) => setCancelProjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">请选择项目</option>
                {(selectedModel.deployment_history || []).map(deployment => (
                  <option key={deployment.project_id} value={deployment.project_id.toString()}>
                    {deployment.project_title}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCancelDeployModal(false);
                  setSelectedModel(null);
                }}
                className={styles.cancelDeployModalButton}
              >
                取消
              </button>
              <button
                onClick={handleConfirmCancelDeploy}
                className={styles.confirmDeployModalButton}
              >
                确认取消部署
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 如果你使用的是路由配置
TrainedModelsPage.title = "训练输出";
TrainedModelsPage.path = "/trained-models";
TrainedModelsPage.exact = true;
