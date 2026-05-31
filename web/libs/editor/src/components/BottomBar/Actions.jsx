import { IconInfoOutline} from "@humansignal/icons";
import { VscSettings } from "react-icons/vsc";
import { Button, Space } from "@humansignal/ui";
import { Elem } from "../../utils/bem";
import { isSelfServe } from "../../utils/billing";
import { FF_BULK_ANNOTATION } from "../../utils/feature-flags";
import { AutoAcceptToggle } from "../AnnotationTab/AutoAcceptToggle";
import { DynamicPreannotationsToggle } from "../AnnotationTab/DynamicPreannotationsToggle";
import { GroundTruth } from "../CurrentEntity/GroundTruth";
import { EditingHistory } from "./HistoryActions";

export const Actions = ({ store }) => {
  const annotationStore = store.annotationStore;
  const entity = annotationStore.selected;
  const isPrediction = entity?.type === "prediction";
  const isViewAll = annotationStore.viewingAll === true;
  const isBulkMode = isFF(FF_BULK_ANNOTATION) && !isSelfServe() && store.hasInterface("annotation:bulk");

  return (
    <Space size="small">
      {!isPrediction && !isViewAll && store.hasInterface("edit-history") && <EditingHistory entity={entity} />}

      {store.description && store.hasInterface("instruction") && (
        <Button
          type="text"
          aria-label="Instructions"
          size="small"
          variant="neutral"
          look="string"
          tooltip="Show instructions"
          onClick={() => store.toggleDescription()}
        >
          <IconInfoOutline />
        </Button>
      )}
      <Button
        type="text"
        aria-label="标注界面设置"
        size="small"
        look="string"
        variant="neutral"
        onClick={() => store.toggleSettings()}
        tooltip="标注界面设置"
        className="!p-0"
      >
        <VscSettings fontSize="18"/>
      </Button>

      {store.hasInterface("ground-truth") && !isBulkMode && <GroundTruth entity={entity} />}

      {!isViewAll && (
        <Elem name="section">
          <DynamicPreannotationsToggle />
          <AutoAcceptToggle />
        </Elem>
      )}
    </Space>
  );
};
