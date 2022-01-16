import apiData from "./initial-data";
const convertArrayToObject = (array, key) => {
  const initialValue = {};
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: item.text,
    };
  }, initialValue);
};

export const modifyData = (data) => {
  let i = 0;
  for (const [key, value] of Object.entries(apiData.tasks)) {
    value.content = data?.tweets[i]?.text;
    i++;
  }
};
