import { useMemo, useEffect, useState, useContext } from "react";
import { flexRender, getCoreRowModel, useReactTable, createColumnHelper } from "@tanstack/react-table";
import { RiShareForwardFill, RiDeleteBin6Line } from "react-icons/ri";
import { IoCheckmarkCircle } from "react-icons/io5";
import { Link, useHistory } from "react-router-dom"; // 添加这行
import { Pagination } from "../../components";
import { usePage, usePageSize } from "../../components/Pagination/Pagination";
import { useAPI } from "../../providers/ApiProvider";
import { IoIosSettings } from "react-icons/io";
import { ToastContext } from "@humansignal/ui";
import PlanConfigModal from "./PlanConfigModal";
import { TbListDetails } from "react-icons/tb";
import styles from "./Plans.scss";
import { confirm } from "../../components/Modal/Modal";
import Empty from "../TrainingOutputs/Empty";

const columnHelper = createColumnHelper();

export const PlansPage = () => {
  const api = useAPI();
  const toast = useContext(ToastContext);
  const history = useHistory();

  const [plansList, setPlansList] = useState([]);
  const [currentPage, setCurrentPage] = usePage("page", 1);
  const [currentPageSize, setCurrentPageSize] = usePageSize("page_size", 20);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // 配置弹出框
  const [currentPlan, setCurrentPlan] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // 状态映射
  const statusMap = {
    0: { text: "待确认", color: "#ffc107" },
    1: { text: "已下达", color: "#57b7ab" },
    2: { text: "已确认", color: "#57b7ab" },
    3: { text: "文件就绪", color: "#17a2b8" },
    4: { text: "进行中", color: "#7acec1" },
    6: { text: "已失败", color: "#CF1322" },
    9: { text: "已完成", color: "#57b7ab" },
  };

  // 处理状态显示
  const getStatusDisplay = (plan) => {
    if (plan.cancelled) {
      return { text: "已撤销", color: "#6c757d" };
    }

    if (plan.failed) {
      return { text: "已失败", color: "#dc3545" };
    }
    if (plan.status === -1) {
      return { text: "已撤销", color: "#6c757d" };
    }

    return statusMap[plan.status] || { text: "异常", color: "#6c757d" };
  };

  // 获取训练列表
  const fetchPlans = async (page, pageSize) => {
    try {
      setLoading(true);
      const response = await api.callApi("plans", {
        params: {
          page,
          page_size: pageSize,
        },
      });

      if (response.results) {
        setPlansList(response.results);
        setTotalItems(response.count);
      }
    } catch (error) {
      console.error("获取训练计划失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPlan = async (plan) => {
    try {
      const response = await api.callApi("confirmPlan", {
        params: {
          pk: plan.id,
        },
      });
      if (response) {
        toast.show({ message: "训练计划已确认", type: "info" });
        history.go(0);
        return;
      }
    } catch (error) {
      console.error("Error to confirm plan", error);
      toast.show({ message: "训练计划确认失败", type: "error" });
    }
  };

  const onConfirmModelSaved = () => {
    history.go(0);
  };

  const cancelPlan = async (plan) => {
    confirm({
      title: "删除训练计划",
      body: "删除后，该训练计划将被取消且无法恢复。已生成的训练数据和模型文件不会被删除。",
      okText: "确认删除",
      cancelText: "取消",
      buttonLook: "negative",
      onOk: async () => {
        try {
          await api.callApi("deletePlan", {
            params: {
              pk: plan.id,
            },
          });
          toast.show({ message: "训练计划已删除", type: "info" });
          history.go(0);
        } catch (error) {
          console.error("Error to delete plan", error);
          toast.show({ message: "训练计划删除失败", type: "error" });
        }
      },
    });
  };

  useEffect(() => {
    fetchPlans(currentPage, currentPageSize);
  }, []);

  // 格式化时间
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("zh-CN");
    } catch (error) {
      return dateString;
    }
  };

  // 修复 2: 使用正确的 v8 API 定义列
  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("project_title", {
        header: "项目名称",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("data_types", {
        header: "标注对象",
        cell: (info) => {
          const config = info.getValue();
          if (config && config.image) {
            return config.image;
          }
          return "--";
        },
      }),
      columnHelper.accessor("parsed_label_config", {
        header: "标注类型",
        cell: (info) => {
          const config = info.getValue();
          if (config && config.label) {
            return config.label.type;
          }
          return "";
        },
      }),
      columnHelper.accessor("quantity", {
        header: "文件数量",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("created_at", {
        header: "提交时间",
        cell: (info) => formatDateTime(info.getValue()),
      }),
      columnHelper.accessor("epochs", {
        header: "训练轮数",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("imgsz", {
        header: "图像精度",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("status", {
        header: "状态",
        cell: (info) => {
          const plan = info.row.original;
          const statusInfo = getStatusDisplay(plan);

          return (
            <span className={styles.planColumnStatus} style={{ background: statusInfo.color }}>
              {statusInfo.text}
            </span>
          );
        },
      }),
      columnHelper.accessor("completed_at", {
        header: "完成时间",
        cell: (info) => (info.getValue() ? formatDateTime(info.getValue()) : "--"),
      }),
      columnHelper.display({
        header: "操作",
        cell: (info) => (
          <div style={{ display: "flex", gap: "8px" }}>
            <button className={styles.planViewButton}>
              <Link
                to={`/plans/${info.row.original.id}/detail`}
                className="btn-view"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                }}
              >
                <TbListDetails />
                详情
              </Link>
            </button>

            {!info.row.original.cancelled && (
              <>
                <button
                  className={styles.planViewButton}
                  onClick={() => {
                    setCurrentPlan(info.row.original);
                    setIsModalOpen(false);
                    setIsEditOpen(true);
                  }}
                >
                  <IoIosSettings />
                  配置
                </button>
              </>
            )}

            {info.row.original.status < 2 && !info.row.original.cancelled && (
              <>
                <button
                  className={styles.confirmButton}
                  onClick={() => {
                    setCurrentPlan(info.row.original);
                    setIsModalOpen(true);
                    setIsEditOpen(false);
                  }}
                >
                  <IoCheckmarkCircle />
                  开始训练
                </button>
              </>
            )}

            {!info.row.original.cancelled && info.row.original.status !== 4 && (
              <>
                <button className={styles.deleteButton} onClick={() => cancelPlan(info.row.original)}>
                  <RiDeleteBin6Line />
                  删除
                </button>
              </>
            )}
          </div>
        ),
      }),
    ],
    [],
  );

  // 修复 3: 正确使用 useReactTable 并添加表格渲染
  const table = useReactTable({
    data: plansList,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={styles.plansContainer}>
      {/* <h1>训练计划</h1> */}

      {/* 加载状态 */}
      {/*loading && ( <Spinner size={36} /> ) */}

      {!loading && plansList && plansList.length > 0 && (
        <>
          {/* 修复 4: 添加表格 HTML 结构 */}
          <table className={styles.plansTable}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={currentPage}
            urlParamName="page"
            totalItems={totalItems}
            pageSize={currentPageSize}
            // pageSizeOptions={[20, 30, 50, 100, 2]}
            onPageLoad={fetchPlans}
            onChange={(newPage, newPageSize) => {
              // console.log('Pagination onChange:', { newPage, newPageSize });
              // 更新状态，触发 useEffect 重新获取数据
              setCurrentPage(newPage);
              setCurrentPageSize(newPageSize);
            }}
            style={{ paddingTop: 16 }}
          />
        </>
      )}

      {/* 空状态 */}
      {!loading && (!plansList || plansList.length === 0) && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Empty info={"暂无训练任务"} />
        </div>
      )}

      {/* Plan 配置弹出框 */}
      {currentPlan.id && (
        <PlanConfigModal
          key={`confirm-${currentPlan.id}`}
          opened={isModalOpen}
          mode="confirm"
          plan={currentPlan}
          onClosed={() => {
            setIsModalOpen(false);
          }}
          onSaved={() => {
            onConfirmModelSaved();
          }}
        />
      )}
      {currentPlan.id && (
        <PlanConfigModal
          key={`edit-${currentPlan.id}`}
          opened={isEditOpen}
          mode={currentPlan.status >= 2 ? "readonly" : "edit"}
          plan={currentPlan}
          onClosed={() => {
            setIsEditOpen(false);
          }}
          onSaved={() => {
            onConfirmModelSaved();
          }}
        />
      )}
    </div>
  );
};

// 如果你使用的是路由配置
PlansPage.title = "训练任务";
PlansPage.path = "/plans";
PlansPage.exact = true;
