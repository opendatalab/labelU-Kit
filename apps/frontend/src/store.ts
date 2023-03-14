import type { RematchDispatch, RematchRootState } from '@rematch/core';
import { init } from '@rematch/core';
import immerPlugin from '@rematch/immer';
import type { ExtraModelsFromLoading } from '@rematch/loading';
import loadingPlugin from '@rematch/loading';
import selectPlugin from '@rematch/select';

import type { RootModel } from './models';
import { models } from './models';

type FullModel = ExtraModelsFromLoading<RootModel>;

export const store = init<RootModel, FullModel>({
  models,
  plugins: [loadingPlugin(), immerPlugin(), selectPlugin()],
});

export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel, FullModel>;
