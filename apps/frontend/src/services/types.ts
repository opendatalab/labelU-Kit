export interface AttachmentDeleteCommand {
  /** Attachment Ids description: attachment file id */
  attachment_ids: number[];
}

export interface AttachmentResponse {
  /** Id description: upload file id */
  id?: number;
  /** Url description: upload file url */
  url?: string;
}

export interface BasicConfigCommand {
  /** Name description: task name */
  name: string;
  /** Description description: task description */
  description?: string;
  /** Tips description: task tips */
  tips?: string;
}

export interface BodyCreateApiV1TasksTaskIdAttachmentsPost {
  /** File */
  file: string;
}

export interface CommonDataResp {
  /** Ok */
  ok: boolean;
}

export interface CreateApiV1TasksTaskIdAttachmentsPostParams {
  task_id: number;
}

export interface CreateApiV1TasksTaskIdSamplesPostParams {
  task_id: number;
}

export interface SampleData {
  id?: number;
  state?: SampleState;
  result: string;
  fileNames: Record<number, string>;
  urls: Record<number, string>;
}

export interface CreateSampleCommand {
  /** Attachement Ids description: attachment file id */
  attachement_ids: number[];
  /** Data description: sample data, include filename, file url, or result */
  data?: SampleData;
}

export interface CreateSampleResponse {
  /** Ids description: attachment ids */
  ids?: number[];
}

export interface DeleteApiV1TasksTaskIdAttachmentsDeleteParams {
  task_id: number;
}

export interface DeleteApiV1TasksTaskIdDeleteParams {
  task_id: number;
}

export interface DeleteSampleCommand {
  /** Sample Ids description: attachment file id */
  sample_ids: number[];
}

export interface DownloadAttachmentApiV1TasksAttachmentFilePathGetParams {
  file_path: string;
}

export interface ExportApiV1TasksTaskIdSamplesExportPostParams {
  task_id: number;
  export_type: ExportType;
}

export interface ExportSampleCommand {
  /** Sample Ids description: sample id */
  sample_ids?: number[];
}

export enum ExportType {
  JSON = 'JSON',
  MASK = 'MASK',
  COCO = 'COCO',
}

export interface GetApiV1TasksTaskIdGetParams {
  task_id: number;
}

export interface GetApiV1TasksTaskIdSamplesSampleIdGetParams {
  task_id: number;
  sample_id: number;
}

export interface GetPreApiV1TasksTaskIdSamplesSampleIdPreGetParams {
  task_id: number;
  sample_id: number;
}

export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

export interface ListByApiV1TasksGetParams {
  page?: number;
  size?: number;
}

export interface ListByApiV1TasksTaskIdSamplesGetParams {
  task_id: number;
  after?: number;
  before?: number;
  pageNo?: number;
  pageSize?: number;
  sort?: string;
}

export interface LoginCommand {
  /** Username */
  username: string;
  /** Password */
  password: string;
}

export interface LoginResponse {
  /** Token description: user credential */
  token: string;
}

export interface LogoutResponse {
  /** Msg */
  msg: string;
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export interface MetaData {
  /** Total */
  total: number;
  /** Page */
  page?: number;
  /** Size */
  size: number;
}

export interface OkRespAttachmentResponse {
  data: AttachmentResponse;
}

export interface OkRespCommonDataResp {
  data: CommonDataResp;
}

export interface OkRespCreateSampleResponse {
  data: CreateSampleResponse;
}

export interface OkRespLoginResponse {
  data: LoginResponse;
}

export interface OkRespLogoutResponse {
  data: LogoutResponse;
}

export interface OkRespSampleResponse {
  data: SampleResponse;
}

export interface OkRespSignupResponse {
  data: SignupResponse;
}

export interface OkRespTaskResponse {
  data: TaskResponse;
}

export interface OkRespTaskResponseWithStatics {
  data: TaskResponseWithStatics;
}

export interface PatchSampleCommand {
  /** Data description: sample data, include filename, file url, or result */
  data?: SampleData;
  /** Annotated Count description: annotate result count */
  annotated_count?: number;
  /** description: sample file state, must be 'SKIPPED', 'NEW', or None */
  state?: SampleState;
}

export interface SampleResponse {
  /** Id description: annotation id */
  id?: number;
  /** State description: sample file state, NEW is has not start yet, DONE is completed, SKIPPED is skipped */
  state?: SampleState;
  /** Data description: sample data, include filename, file url, or result */
  data?: SampleData;
  /** Annotated Count description: annotate result count */
  annotated_count?: number;
  /** Created At description: task created at time */
  created_at?: string;
  /** Created By description: task created by */
  created_by?: UserResp;
  /** Updated At description: task updated at time */
  updated_at?: string;
  /** Updated By description: task updated by */
  updated_by?: UserResp;
}

export interface SampleListResponse {
  meta_data?: MetaData;
  /** Data */
  data: SampleResponse[];
}

export enum SampleState {
  NEW = 'NEW',
  SKIPPED = 'SKIPPED',
  DONE = 'DONE',
}

export interface SignupCommand {
  /** Username */
  username: string;
  /** Password */
  password: string;
}

export interface SignupResponse {
  /** Id */
  id: number;
  /** Username */
  username: string;
}

export interface TaskResponse {
  /** Id description: task id */
  id?: number;
  /** Name description: task name */
  name?: string;
  /** Description description: task description */
  description?: string;
  /** Tips description: task tips */
  tips?: string;
  /** Config description: task config content */
  config?: string;
  /** Media Type description: task media type: IMAGE, VIDEO */
  media_type?: MediaType;
  /** Status description: task status: DRAFT, IMPORTED, CONFIGURED, INPROGRESS, FINISHED */
  status?: TaskStatus;
  /** Created At description: task created at time */
  created_at?: string;
  /** Created By description: task created at time */
  created_by?: UserResp;
}

export interface TaskResponseWithStatics {
  /** Id description: task id */
  id?: number;
  /** Name description: task name */
  name?: string;
  /** Description description: task description */
  description?: string;
  /** Tips description: task tips */
  tips?: string;
  /** Config description: task config content */
  config?: string;
  /** Media Type description: task media type: IMAGE, VIDEO */
  media_type?: MediaType;
  /** Status description: task status: DRAFT, IMPORTED, CONFIGURED, INPROGRESS, FINISHED */
  status?: TaskStatus;
  /** Created At description: task created at time */
  created_at?: string;
  /** Created By description: task created at time */
  created_by?: UserResp;
  stats?: TaskStatics;
}

export enum TaskStatus {
  DRAFT = 'DRAFT',
  IMPORTED = 'IMPORTED',
  CONFIGURED = 'CONFIGURED',
  INPROGRESS = 'INPROGRESS',
  FINISHED = 'FINISHED',
}

export interface TaskListResponseWithStatics {
  meta_data?: MetaData;
  /** Data */
  data: TaskResponseWithStatics[];
}

export interface TaskStatics {
  /** New description: count for task data have not labeled yet */
  new?: number;
  /** Done description: count for task data already labeled */
  done?: number;
  /** Skipped description: count for task data skipped */
  skipped?: number;
}

export interface UpdateApiV1TasksTaskIdPatchParams {
  task_id: number;
}

export interface UpdateApiV1TasksTaskIdSamplesSampleIdPatchParams {
  task_id: number;
  sample_id: number;
}

export interface UpdateCommand {
  /** Name description: task name */
  name?: string;
  /** Description description: task description */
  description?: string;
  /** Tips description: task tips */
  tips?: string;
  /** description: task config content */
  media_type?: MediaType;
  /** Config description: task config content */
  config?: string;
}

export interface UserResp {
  /** Id */
  id?: number;
  /** Username */
  username?: string;
}

export interface ValidationError {
  /** Location */
  loc: any[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}
