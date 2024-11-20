const COMMON_INIT_CODE = 30000;
const USER_INIT_CODE = 40000;
const TASK_INIT_CODE = 50000;

export const ErrorMessages = {
  400: '参数有问题',
  [COMMON_INIT_CODE]: 'sql错误',
  [COMMON_INIT_CODE + 1]: '静止,没有权限',
  [COMMON_INIT_CODE + 2]: '请求的验证错误',
  [COMMON_INIT_CODE + 3]: '错误的请求',
  [USER_INIT_CODE]: '无效的用户名或密码',
  [USER_INIT_CODE + 1]: '用户已经存在',
  [USER_INIT_CODE + 2]: '用户没发现',
  [USER_INIT_CODE + 3]: '不能验证证书',
  [USER_INIT_CODE + 4]: '没有授权',
  [TASK_INIT_CODE]: '服务器内部错误',
  [TASK_INIT_CODE + 1]: '任务已完成',
  [TASK_INIT_CODE + 2]: '任务没发现',
  [TASK_INIT_CODE + 1000]: '上传文件错误,保存失败',
  [TASK_INIT_CODE + 1001]: '附件未找到',
  [TASK_INIT_CODE + 1002]: '同名附件已存在',
  [TASK_INIT_CODE + 5000]: '参数错误：after,before,pageNo,只能选一个，pageNo 可以说是0',
  [TASK_INIT_CODE + 5001]: '没有此sample',
  [TASK_INIT_CODE + 5003]: '预标注中的sample_name在数据库中已存在',
} as const;
