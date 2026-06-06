import { inject } from "mobx-react";
import { useCallback, useState } from "react";
import { Button, ButtonGroup } from "@humansignal/ui";
import { Dropdown } from "../../Common/Dropdown/DropdownComponent";
import { Toggle } from "../../Common/Form";
import { RiListSettingsFill } from "react-icons/ri";
import { FaCirclePlus, FaCircleMinus } from "react-icons/fa6";
import debounce from "lodash/debounce";

const injector = inject(({ store }) => {
  const view = store?.currentView;

  const cols = view?.fieldsAsColumns ?? [];
  const hasImage = cols.some(({ type }) => type === "Image") ?? false;

  return {
    view,
    isGrid: view?.type === "grid",
    gridWidth: view?.gridWidth,
    fitImagesToWidth: view?.gridFitImagesToWidth,
    hasImage,
  };
});

export const GridWidthButton = injector(({ view, isGrid, gridWidth, fitImagesToWidth, hasImage, size }) => {
  const [width, setWidth] = useState(gridWidth);

  const setGridWidthStore = debounce((value) => {
    view.setGridWidth(value);
  }, 200);

  const setGridWidth = useCallback(
    (width) => {
      const newWidth = Math.max(1, Math.min(width, 10));

      setWidth(newWidth);
      setGridWidthStore(newWidth);
    },
    [view],
  );

  const handleFitImagesToWidthToggle = useCallback(
    (e) => {
      view.setFitImagesToWidth(e.target.checked);
    },
    [view],
  );

  return isGrid ? (
    <Dropdown.Trigger
      content={
        <div className="p-tight min-w-wide space-y-base text-sm" style={{padding: '10px 20px', color: "#6b6860"}}>
          <div className="grid grid-cols-[1fr_min-content] gap-base items-center">
            <div>列数: 
            </div>
            <ButtonGroup collapsed={false}>
              <Button
                onClick={() => setGridWidth(width - 1)}
                disabled={width === 1}
                variant="neutral"
                look="string"
                leading={<FaCircleMinus />}
                size="small"
                aria-label="Decrease columns number"
              />
              <span style={{fontWeight: 800, verticalAlign:'middle', display: 'inline-flex', alignItems: 'center'}}>{width}</span>
              <Button
                onClick={() => setGridWidth(width + 1)}
                disabled={width === 10}
                variant="neutral"
                look="string"
                leading={<FaCirclePlus/>}
                size="small"
                aria-label="Increase columns number"
              />
            </ButtonGroup>
          </div>
          {hasImage && (
            <div className="grid grid-cols-[1fr_min-content] gap-base items-center">
              <span>图像宽度自适应</span>
              <Toggle checked={fitImagesToWidth} onChange={handleFitImagesToWidthToggle} />
            </div>
          )}
        </div>
      }
    >
       <Button size={size} variant="neutral" look="outlined" aria-label="Grid settings">
      <RiListSettingsFill style={{cursor: "pointer"}}/>
      </Button>
    </Dropdown.Trigger>
  ) : null;
});
