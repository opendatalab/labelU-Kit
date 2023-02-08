import type { PageData } from '@/types';
import type { BuniesssUser } from '@/types/business';

import { request } from './request';

export const getBusinessUserList = (params: any) => request<PageData<BuniesssUser>>('get', '/business/list', params);
