// import { Tag } from "../Common/Tag/Tag";
import { AiFillFileExclamation } from "react-icons/ai";

const parseBoolean = (value) => {
  if ([true, 1, "true", "1", "yes"].includes(value) || !!value === true) {
    return true;
  }
  return false;
};

export const BooleanCell = (column) => {
  const boolValue = parseBoolean(column.value);

  if (boolValue === true) {
    {/* return <Tag color="#80c70d">true</Tag>; */}
    return <span style={{fontSize: 20, color: '#efc307'}}><AiFillFileExclamation/></span>
  }
  if (boolValue === false) {
    return null 
    {/* return <Tag color="#de3301">false</Tag>; */}
  }

  return null;
};

BooleanCell.userSelectable = false;
