import type { Models } from '@rematch/core';

import { sample } from './sample.model';
import { task } from './task.model';
import { user } from './user.model';

export interface RootModel extends Models<RootModel> {
  sample: typeof sample;
  task: typeof task;
  user: typeof user;
}

export const models: RootModel = {
  sample,
  user,
  task,
};
