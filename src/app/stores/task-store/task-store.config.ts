import { InjectionToken } from '@angular/core';
import { TaskBoardState } from '../../interfaces/task';

export const TASK_BOARD_INITIAL_STATE = new InjectionToken<TaskBoardState>(
  'taskBoardInitialState',
  {
    providedIn: 'root',
    factory: () => ({
      isLoading: false,
      pageSize: 10,
      pageCount: 1,
      currentPage: 1,
    }),
  }
);
