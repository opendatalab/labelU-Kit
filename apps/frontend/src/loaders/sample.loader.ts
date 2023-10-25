import type { LoaderFunctionArgs } from 'react-router';

import queryClient from '@/api/queryClient';
import { sampleKey } from '@/api/queryKeyFactories';
import { getSample } from '@/api/services/samples';

export async function sampleLoader({ params }: LoaderFunctionArgs) {
  const queryKey = sampleKey.detail(params.sampleId!);

  return await queryClient.fetchQuery({
    queryKey,
    queryFn: () =>
      getSample({
        sample_id: +params.sampleId!,
        task_id: +params.taskId!,
      }),
  });
}
