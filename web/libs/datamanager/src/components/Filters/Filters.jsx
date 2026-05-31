import { inject } from "mobx-react";
import React from "react";
import { Block, cn, Elem } from "../../utils/bem";
import { Button } from "@humansignal/ui";
import { FilterLine } from "./FilterLine/FilterLine";
import { IconChevronRight } from "@humansignal/icons";
import { IoIosInformationCircle } from "react-icons/io";
import { MdFilterListAlt } from "react-icons/md";
import { TbPinnedFilled } from "react-icons/tb";
import "./Filters.scss";

const injector = inject(({ store }) => ({
  store,
  views: store.viewsStore,
  currentView: store.currentView,
  filters: store.currentView?.currentFilters ?? [],
}));

export const Filters = injector(({ views, currentView, filters }) => {
  const { sidebarEnabled } = views;

  const fields = React.useMemo(
    () =>
      currentView.availableFilters.reduce((res, filter) => {
        const target = filter.field.target;
        const groupTitle = target
          .split("_")
          .map((s) =>
            s
              .split("")
              .map((c, i) => (i === 0 ? c.toUpperCase() : c))
              .join(""),
          )
          .join(" ");

        const group = res[target] ?? {
          id: target,
          title: groupTitle,
          options: [],
        };

        group.options.push({
          value: filter.id,
          title: filter.field.title,
          original: filter,
        });

        return { ...res, [target]: group };
      }, {}),
    [currentView.availableFilters],
  );

  return (
    <Block name="filters" mod={{ sidebar: sidebarEnabled }}>
      <Elem name="list" mod={{ withFilters: !!filters.length }}>
        {filters.length ? (
          filters.map((filter, i) => (
            <FilterLine
              index={i}
              filter={filter}
              view={currentView}
              sidebar={sidebarEnabled}
              value={filter.currentValue}
              key={`${filter.filter.id}-${i}`}
              availableFilters={Object.values(fields)}
              dropdownClassName={cn("filters").elem("selector")}
            />
          ))
        ) : (
          <Elem name="empty" style={{display: 'flex', alignItems:'center', color: "#999"}}> <IoIosInformationCircle style={{marginRight: 5}} /> 未设置筛选条件，点击下方添加过滤器</Elem>
        )}
      </Elem>
      <Elem name="actions">
        <Button
          size="small"
          look="outlined"
          onClick={() => currentView.createFilter()}
          leading={<MdFilterListAlt className="!h-3 !w-3" />}
          style={{weight: 400, fontSize: 12, marginLeft: '10px', padding: '0 8px'}}
        >
          添加过滤器
        </Button>

        {!sidebarEnabled ? (
          <Button
            look="string"
            type="link"
            size="small"
            tooltip="将过滤器固定到右侧"
            onClick={() => views.expandFilters()}
            aria-label="Pin filters to sidebar"
          >
            <TbPinnedFilled/>
          </Button>
        ) : null}
      </Elem>
    </Block>
  );
});
