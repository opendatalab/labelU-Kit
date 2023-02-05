export function formatSearch(se: string) {
  let search = decodeURIComponent(se);
  search = search.substr(1); //从起始索引号提取字符串中指定数目的字符
  const arr = search.split('&'); //把字符串分割为字符串数组
  const result: Record<string, string> = {};
  let temp = [];

  arr.forEach((v) => {
    //数组遍历
    temp = v.split('=');
    if (typeof result[temp[0]] === 'undefined') {
      result[temp[0]] = temp[1];
    }
  });
  return result;
}
