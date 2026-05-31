import { Button, ButtonGroup } from "@humansignal/ui";
import { inject } from "mobx-react";
import { FieldsButton } from "../../Common/FieldsButton";
import { Space } from "../../Common/Space/Space";
import { HiSortAscending, HiSortDescending } from "react-icons/hi";

const injector = inject(({ store }) => {
  const view = store?.currentView;

  return {
    view,
    ordering: view?.currentOrder,
  };
});

export const columnTranslations = {
  "ID": "ID",
  "Inner ID": "内部ID",
  "Completed": "已完成",
  "Annotations": "标注数量",
  "Cancelled": "跳过数量",
  "Predictions": "预标注数量",
  "Annotated by": "标注人",
  "Annotation results": "标注结果",
  "Annotation IDs": "标注ID",
  "Prediction score": "预测分数",
  "Prediction model versions": "预测模型版本",
  "Prediction results": "预测结果",
  "Upload filename": "上传文件名",
  "Storage filename": "存储文件名",
  "Created at": "创建时间",
  "Updated at": "更新时间",
  "Updated by": "更新人",
  "Lead Time": "处理时间",
  "Drafts": "草稿",
  // "data": "数据",
  // "image": "图片"
}; 

export const OrderButton = injector(({ size, ordering, view, ...rest }) => {
  return (
    <Space style={{ fontSize: 12 }}>
      <ButtonGroup collapsed {...rest}>
        <Button
          size={size}
          look="outlined"
          variant="neutral"
          disabled={!!ordering === false}
          onClick={() => view.setOrdering(ordering?.field)}
          aria-label={ordering?.desc ? "Sort ascending" : "Sort descending"}
        >
          {ordering?.desc ? <HiSortAscending  color="#aaa"/> : <HiSortDescending color="#aaa"/>}
        </Button>
        <FieldsButton
          size={size}
          style={{ minWidth: 80}}
          title={ordering ? (columnTranslations[ordering.column?.title]??ordering.column?.title) : "排序方式"}
          onClick={(col) => view.setOrdering(col.id)}
          onReset={() => view.setOrdering(null)}
          resetTitle="默认排序"
          selected={ordering?.field}
          filter={(col) => {
            return col.orderable ?? col.original?.orderable;
          }}
          wrapper={({ column, children }) => (
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              {children || columnTranslations[children]}
              <div
                style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {column?.icon}
              </div>
            </Space>
          )}
          openUpwardForShortViewport={false}
        />

      </ButtonGroup>
    </Space>
  );
});
