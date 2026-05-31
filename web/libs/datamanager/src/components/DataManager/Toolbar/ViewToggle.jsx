import { inject, observer } from "mobx-react";
import { RadioGroup } from "../../Common/RadioGroup/RadioGroup";
import { TfiLayoutGrid3Alt } from "react-icons/tfi";
import { IoIosListBox } from "react-icons/io";
import { Tooltip } from "@humansignal/ui";

const viewInjector = inject(({ store }) => ({
  view: store.currentView,
}));

export const ViewToggle = viewInjector(
  observer(({ view, size, ...rest }) => {
    return (
      <RadioGroup
        size={size}
        value={view.type}
        onChange={(e) => view.setType(e.target.value)}
        {...rest}
        style={{padding: "3px 6px"}}
      >
        <Tooltip title="表格视图">
          <RadioGroup.Button value="list" aria-label="切换到列表视图" 
            style={{
              padding: 0,
              width: '27px',
              boxShadow: '0px 1px 3px #c4c4c4',
              borderRadius: '4px'
            }}>
              <IoIosListBox />
            </RadioGroup.Button>
        </Tooltip>
        <Tooltip title="网格视图">
            <RadioGroup.Button value="grid" aria-label="切换到网格视图"
            style={{
              padding: 0,
              width: '27px',
              boxShadow: '0px 1px 3px #c4c4c4',
              borderRadius: '4px',
              marginLeft: '3px'
            }}>
              <TfiLayoutGrid3Alt />
            </RadioGroup.Button>
        </Tooltip>
      </RadioGroup>
    );
  }),
);

export const DataStoreToggle = viewInjector(({ view, size, ...rest }) => {
  return (
    <RadioGroup value={view.target} size={size} onChange={(e) => view.setTarget(e.target.value)} {...rest}>
      <RadioGroup.Button value="tasks">Tasks</RadioGroup.Button>
      <RadioGroup.Button value="annotations" disabled>
        Annotations
      </RadioGroup.Button>
    </RadioGroup>
  );
});
