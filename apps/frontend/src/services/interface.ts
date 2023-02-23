export interface SamplePayload {
  id: number;
  state: string;
  data: { id: number; [key: string]: unknown };
  annotated_count: number;
  created_at: string;
  created_by: {
    id: number;
    username: string;
  };
  updated_at: string;
  updated_by: {
    id: number;
    username: string;
  };
}

export type SampleState = 'NEW' | 'DONE' | 'SKIPPED';

export interface MetaInfo {
  total: number;
  page: number;
  size: number;
}

export interface PatchSamplePayload {
  data: Record<string, string>;
  annotated_count: number;
  state: SampleState;
}

export interface SampleExportPayload {
  sample_ids: number[];
}

export interface CreateSamplePayload {
  data: {
    ids: number[];
  };
}

export interface TaskPayload {
  meta_data: MetaInfo;
  data: [
    {
      id: number;
      name: string;
      description: string;
      tips: string;
      config: string;
      media_type: string;
      status: string;
      created_at: string;
      created_by: {
        id: number;
        username: string;
      };
      stats: Record<SampleState, number>;
    },
  ];
}

export interface SamplesPayload {
  meta_data: MetaInfo;
  data: SamplePayload[];
}
