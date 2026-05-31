import { format, isValid } from "date-fns";
export const dateTimeFormat = "yyyy/MM/dd HH:mm:ss";

export const DateTimeCell = (column) => {
  const date = new Date(column.value);

  return column.value ? (
    <div style={{ whiteSpace: "nowrap", fontSize:"13px" }}>{isValid(date) ? format(date, dateTimeFormat) : ""}</div>
  ) : (
    ""
  );
};

DateTimeCell.displayType = false;
