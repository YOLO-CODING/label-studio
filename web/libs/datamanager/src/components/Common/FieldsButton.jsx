import { Button, Checkbox } from "@humansignal/ui";
import { inject, observer } from "mobx-react";
import React from "react";
import { Elem } from "../../utils/bem";
import { Dropdown } from "./Dropdown/Dropdown";
import { Menu } from "./Menu/Menu";
import { columnTranslations } from "../DataManager/Toolbar/OrderButton" 

const injector = inject(({ store }) => {
  return {
    columns: Array.from(store.currentView?.targetColumns ?? []),
  };
});

const FieldsMenu = observer(({ columns, WrapperComponent, onClick, onReset, selected, resetTitle }) => {
  const MenuItem = (col, onClick) => {
    return (
      <Menu.Item key={col.key} name={col.key} onClick={onClick} disabled={col.disabled}>
        {WrapperComponent && col.wra !== false ? (
          <WrapperComponent column={col} disabled={col.disabled}>
            {columnTranslations[col.title] ?? col.title }
          </WrapperComponent>
        ) : (
          col.title
        )}
      </Menu.Item>
    );
  };

  return (
    <Menu size="small" selectedKeys={selected ? [selected] : ["none"]} closeDropdownOnItemClick={false}>
      {onReset &&
        MenuItem(
          {
            key: "none",
            title: resetTitle ?? "Default",
            wrap: false,
          },
          onReset,
        )}

      {columns.map((col) => {
        if (col.children) {
          return (
            <Menu.Group key={col.key} title={col.title}>
              {col.children.map((col) => MenuItem(col, () => onClick?.(col)))}
            </Menu.Group>
          );
        }
        if (!col.parent) {
          return MenuItem(col, () => onClick?.(col));
        }

        return null;
      })}
    </Menu>
  );
});

export const FieldsButton = injector(
  ({
    columns,
    size,
    style,
    wrapper,
    title,
    icon,
    className,
    trailingIcon,
    onClick,
    onReset,
    resetTitle,
    filter,
    selected,
    tooltip,
    tooltipTheme = "dark",
    openUpwardForShortViewport = true,
  }) => {
    const content = [];

    if (title) content.push(<React.Fragment key="f-button-title">{title}</React.Fragment>);

    const renderButton = () => {
      return (
        <Button style={style} variant="neutral" size="small" look="outlined" leading={icon} trailing={trailingIcon}>
          {content.length ? content : null}
        </Button>
      );
    };

    return (
      <Dropdown.Trigger
        content={
          <FieldsMenu
            columns={filter ? columns.filter(filter) : columns}
            WrapperComponent={wrapper}
            onClick={onClick}
            size={size}
            onReset={onReset}
            selected={selected}
            resetTitle={resetTitle}
          />
        }
        style={{  maxHeight: 280, overflow: "auto" }}
        openUpwardForShortViewport={openUpwardForShortViewport}
      >
        {tooltip ? (
          <Elem name={"field-button"} style={{ zIndex: 1000, fontSize: 20}} rawClassName="h-[40px] flex items-center">
            <Button
              style={style}
              tooltip={tooltip}
              variant="neutral"
              size={size}
              leading={icon}
              trailing={trailingIcon}
            >
              {content.length ? content : null}
            </Button>
          </Elem>
        ) : (
          renderButton()
        )}
      </Dropdown.Trigger>
    );
  },
);

FieldsButton.Checkbox = observer(({ column, children, disabled }) => {
  return (
    <Checkbox
      size="small"
      checked={!column.hidden}
      onChange={column.toggleVisibility}
      style={{ width: "100%", height: "100%" }}
      disabled={disabled}
    >
      <div style={{fontSize: '14px', color: "#6b6860", fontWeight: 400}}>
      {children}
      </div>
    </Checkbox>
  );
});
