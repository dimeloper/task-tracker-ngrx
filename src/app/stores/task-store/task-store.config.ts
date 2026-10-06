import { InjectionToken } from '@angular/core';
import { type } from '@ngrx/signals';
import { NamedEntityProps, NamedEntityState } from '@ngrx/signals/entities';
import { Task, TaskBoardState } from '../../interfaces/task';

export const TASK_BOARD_INITIAL_STATE = new InjectionToken<TaskBoardState>(
  'taskBoardInitialState',
  {
    providedIn: 'root',
    factory: () => ({
      isLoading: false,
      error: null,
      pageSize: 10,
      pageCount: 1,
      currentPage: 1,
      taskEdit: null,
    }),
  }
);

/**
 * What the reducer, effects, columns and forms features each declare they need.
 * They all declare the same thing on purpose: signalStore() infers the earlier
 * features' types partly from the inputs later features declare, and when one
 * feature asks only for state and another only for props, the two guesses
 * disagree and no signalStore overload matches.
 */
export const taskStoreInput = {
  state: type<TaskBoardState & NamedEntityState<Task, 'task'>>(),
  props: type<NamedEntityProps<Task, 'task'>>(),
};
