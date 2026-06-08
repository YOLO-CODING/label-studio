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
// import {mockTrainedModels}  from './mock.js'
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
      title: "操作确认",
      body: "您即将执行删除操作。记录会直接删除，请谨慎操作。",
      okText: "继续",
      buttonLook: "negative",
      onOk: async () => {
        try {
          const response = await api.callApi('deleteTrainingModel', {
            params: {
              pk: m.id
            }
          });
          if (response) {
            toast.show({ message: "训练输出记录已删除", type: "info" });
            history.go(0);
            return
          }

        }
        catch (error) {
          console.error("Error to delete model", error);
          toast.show({ message: "训练输出记录删除失败", type: "error" });
        }
      }
    });
  }

  const deployModel = async (m) => {
    const projectId = m.plan?.project_id;
    const projectName = m.plan?.project_title || '源项目';
    
    confirm({
      title: "模型部署",
      body: `即将部署模型到 ML Backend，并配置到项目 "${projectName}" (Project ${projectId || '未知'})。\n\n部署后可以在项目的 Data Manager 中触发预标注。`,
      okText: "确认部署",
      buttonLook: "positive",
      onOk: async () => {
        try {
          const response = await api.callApi('deployTrainingModel', {
            params: {
              pk: m.id
            },
            body: {
              project_id: projectId
            }
          });
          
          if (response) {
            toast.show({ 
              message: `模型已成功部署到 ${response.project_title}`, 
              type: "success"
            });
            fetchModels(currentPage, currentPageSize);
            return;
          }
        } catch (error) {
          console.error("部署失败:", error);
          const errorMsg = error?.response?.data?.error || error?.message || "模型部署失败，请检查后端日志";
          toast.show({ 
            message: errorMsg, 
            type: "error",
            duration: 10000
          });
        }
      }
    });
  }

  useEffect(() => {
    fetchModels(currentPage, currentPageSize);
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
        header: '名称',
        cell: info => info.getValue(),
        size: 150,
      }),
      columnHelper.accessor('batch_no', {
        header: '批次号',
        cell: info => info.getValue(),
        size: 100,
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
        header: '文件路径',
        cell: (info) => {
          const { id, path, name, batch_no } = info.row.original;
          const isCopied = copiedPath === id;
          
          return (
            <div className={styles.modelPathCell}>
              <span className={styles.pathText} title={path}>
                {path}
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
          const deployedAt = info.row.original.deployed_at;
          const deployedToProject = info.row.original.deployed_to_project;
          
          if (deployed) {
            return (
              <div style={{ color: '#52c41a' }}>
                <span>已部署</span>
                {deployedToProject && (
                  <span style={{ fontSize: '12px', marginLeft: '4px', color: '#8c8c8c' }}>
                    (Project {deployedToProject})
                  </span>
                )}
              </div>
            );
          }
          return <span style={{ color: '#8c8c8c' }}>未部署</span>;
        },
        size: 150,
      }),
      columnHelper.display({
        header: '操作',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* 部署操作 */}
            {!info.row.original.deployed && (
              <button 
                className={styles.deployButton}
                onClick={() => deployModel(info.row.original)}
              >
                <RiShareForwardFill />部署
              </button>
            )}
            
            {/* 删除操作 */}
            {true && (
              <button 
                className={styles.deleteButton}
                onClick={() => deleteModel(info.row.original)}
              >
                <RiDeleteBin6Line />删除
              </button>
            )}
          </div>
        ),
        size: 150,
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
    </div>
  )
}

// 如果你使用的是路由配置
TrainedModelsPage.title = "训练输出";
TrainedModelsPage.path = "/trained-models";
TrainedModelsPage.exact = true;
