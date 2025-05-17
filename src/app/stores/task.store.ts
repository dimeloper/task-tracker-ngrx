import { computed, inject, InjectionToken } from '@angular/core';
import {
  patchState,
  signalStore,
  type,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { setEntities, withEntities } from '@ngrx/signals/entities';
import { firstValueFrom } from 'rxjs';
import { TaskService } from '../services/task.service';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
}

export interface TaskBoardState {
  isLoading: boolean;
  pageSize: number;
  pageCount: number;
  currentPage: number;
}

const initialState: TaskBoardState = {
  isLoading: false,
  pageSize: 10,
  pageCount: 1,
  currentPage: 1,
};

export const TASK_BOARD_INITIAL_STATE = new InjectionToken<TaskBoardState>(
  'TaskBoardState',
  {
    factory: () => initialState,
  }
);

export const TaskStore = signalStore(
  withState(() => inject(TASK_BOARD_INITIAL_STATE)),
  withEntities({ entity: type<Task>(), collection: 'task' }),
  withComputed(store => ({
    tasksTodo: computed(() =>
      store.taskEntities().filter(t => t.status === 'todo')
    ),
    tasksInProgress: computed(() =>
      store.taskEntities().filter(t => t.status === 'in-progress')
    ),
    tasksDone: computed(() =>
      store.taskEntities().filter(t => t.status === 'done')
    ),
    totalTasks: computed(() => store.taskEntities().length),
  })),
  withMethods((store, service = inject(TaskService)) => {
    const updateTasks = (tasks: Task[]) => {
      patchState(store, setEntities(tasks, { collection: 'task' }));
    };

    const updateTaskStatus = (taskId: string, status: Task['status']) => {
      const currentTask = store.taskEntities().find(t => t.id === taskId);
      if (!currentTask) return;

      const updatedTask: Task = {
        ...currentTask,
        status,
      };

      patchState(store, setEntities([updatedTask], { collection: 'task' }));
    };

    const updatePage = (page: number) => {
      patchState(store, { currentPage: page });
    };

    return {
      updateTasks,
      updateTaskStatus,
      updatePage,
      async fetchTasks(page = 1) {
        patchState(store, { isLoading: true });

        try {
          const result = await firstValueFrom(
            service.getTasks(page, store.pageSize())
          );
          patchState(store, {
            pageCount: result.totalPages,
            currentPage: page,
          });
          updateTasks(result.tasks);
        } catch (error) {
          console.error('Error fetching tasks:', error);
        } finally {
          patchState(store, { isLoading: false });
        }
      },

      async changeTaskStatus(taskId: string, newStatus: Task['status']) {
        updateTaskStatus(taskId, newStatus);
        try {
          await firstValueFrom(service.updateTaskStatus(taskId, newStatus));
        } catch (error) {
          console.error('Error updating task status:', error);
          // Optionally revert status here
        }
      },
    };
  })
);
