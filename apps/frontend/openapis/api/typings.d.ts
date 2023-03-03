declare namespace Api {
  type AttachmentDeleteCommand = {
    /** Attachment Ids description: attachment file id */
    attachment_ids: number[];
  };

  type AttachmentResponse = {
    /** Id description: upload file id */
    id?: number;
    /** Url description: upload file url */
    url?: string;
  };

  type BasicConfigCommand = {
    /** Name description: task name */
    name: string;
    /** Description description: task description */
    description?: string;
    /** Tips description: task tips */
    tips?: string;
  };

  type BodyCreateApiV1Tasks_taskId_attachmentsPost = {
    /** File */
    file: string;
  };

  type CommonDataResp = {
    /** Ok */
    ok: boolean;
  };

  type createApiV1TasksTaskIdAttachmentsPostParams = {
    task_id: number;
  };

  type createApiV1TasksTaskIdSamplesPostParams = {
    task_id: number;
  };

  type CreateSampleCommand = {
    /** Attachement Ids description: attachment file id */
    attachement_ids: number[];
    /** Data description: sample data, include filename, file url, or result */
    data?: Record<string, any>;
  };

  type CreateSampleResponse = {
    /** Ids description: attachment ids */
    ids?: number[];
  };

  type deleteApiV1TasksTaskIdAttachmentsDeleteParams = {
    task_id: number;
  };

  type deleteApiV1TasksTaskIdDeleteParams = {
    task_id: number;
  };

  type DeleteSampleCommand = {
    /** Sample Ids description: attachment file id */
    sample_ids: number[];
  };

  type downloadAttachmentApiV1TasksAttachmentFilePathGetParams = {
    file_path: string;
  };

  type exportApiV1TasksTaskIdSamplesExportPostParams = {
    task_id: number;
    export_type: ExportType;
  };

  type ExportSampleCommand = {
    /** Sample Ids description: sample id */
    sample_ids?: number[];
  };

  enum ExportType {
    JSON = 'JSON',
    MASK = 'MASK',
    COCO = 'COCO',
  }

  type getApiV1TasksTaskIdGetParams = {
    task_id: number;
  };

  type getApiV1TasksTaskIdSamplesSampleIdGetParams = {
    task_id: number;
    sample_id: number;
  };

  type getPreApiV1TasksTaskIdSamplesSampleIdPreGetParams = {
    task_id: number;
    sample_id: number;
  };

  type HTTPValidationError = {
    /** Detail */
    detail?: ValidationError[];
  };

  type listByApiV1TasksGetParams = {
    page?: number;
    size?: number;
  };

  type listByApiV1TasksTaskIdSamplesGetParams = {
    task_id: number;
    after?: number;
    before?: number;
    pageNo?: number;
    pageSize?: number;
    sort?: string;
  };

  type LoginCommand = {
    /** Username */
    username: string;
    /** Password */
    password: string;
  };

  type LoginResponse = {
    /** Token description: user credential */
    token: string;
  };

  type LogoutResponse = {
    /** Msg */
    msg: string;
  };

  enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
  }

  type MetaData = {
    /** Total */
    total: number;
    /** Page */
    page?: number;
    /** Size */
    size: number;
  };

  type OkRespAttachmentResponse_ = {
    data: AttachmentResponse;
  };

  type OkRespCommonDataResp_ = {
    data: CommonDataResp;
  };

  type OkRespCreateSampleResponse_ = {
    data: CreateSampleResponse;
  };

  type OkRespLoginResponse_ = {
    data: LoginResponse;
  };

  type OkRespLogoutResponse_ = {
    data: LogoutResponse;
  };

  type OkRespSampleResponse_ = {
    data: SampleResponse;
  };

  type OkRespSignupResponse_ = {
    data: SignupResponse;
  };

  type OkRespTaskResponse_ = {
    data: TaskResponse;
  };

  type OkRespTaskResponseWithStatics_ = {
    data: TaskResponseWithStatics;
  };

  type PatchSampleCommand = {
    /** Data description: sample data, include filename, file url, or result */
    data?: Record<string, any>;
    /** Annotated Count description: annotate result count */
    annotated_count?: number;
    /** description: sample file state, must be 'SKIPPED', 'NEW', or None */
    state?: SampleState;
  };

  type SampleResponse = {
    /** Id description: annotation id */
    id?: number;
    /** State description: sample file state, NEW is has not start yet, DONE is completed, SKIPPED is skipped */
    state?: string;
    /** Data description: sample data, include filename, file url, or result */
    data?: Record<string, any>;
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
  };

  type SampleResponse_ = {
    meta_data?: MetaData;
    /** Data */
    data: SampleResponse[];
  };

  enum SampleState {
    NEW = 'NEW',
    SKIPPED = 'SKIPPED',
    DONE = 'DONE',
  }

  type SignupCommand = {
    /** Username */
    username: string;
    /** Password */
    password: string;
  };

  type SignupResponse = {
    /** Id */
    id: number;
    /** Username */
    username: string;
  };

  type TaskResponse = {
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
    media_type?: string;
    /** Status description: task status: DRAFT, IMPORTED, CONFIGURED, INPROGRESS, FINISHED */
    status?: string;
    /** Created At description: task created at time */
    created_at?: string;
    /** Created By description: task created at time */
    created_by?: UserResp;
  };

  type TaskResponseWithStatics = {
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
    media_type?: string;
    /** Status description: task status: DRAFT, IMPORTED, CONFIGURED, INPROGRESS, FINISHED */
    status?: string;
    /** Created At description: task created at time */
    created_at?: string;
    /** Created By description: task created at time */
    created_by?: UserResp;
    stats?: TaskStatics;
  };

  type TaskResponseWithStatics_ = {
    meta_data?: MetaData;
    /** Data */
    data: TaskResponseWithStatics[];
  };

  type TaskStatics = {
    /** New description: count for task data have not labeled yet */
    new?: number;
    /** Done description: count for task data already labeled */
    done?: number;
    /** Skipped description: count for task data skipped */
    skipped?: number;
  };

  type updateApiV1TasksTaskIdPatchParams = {
    task_id: number;
  };

  type updateApiV1TasksTaskIdSamplesSampleIdPatchParams = {
    task_id: number;
    sample_id: number;
  };

  type UpdateCommand = {
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
  };

  type UserResp = {
    /** Id */
    id?: number;
    /** Username */
    username?: string;
  };

  type ValidationError = {
    /** Location */
    loc: any[];
    /** Message */
    msg: string;
    /** Error Type */
    type: string;
  };
}
