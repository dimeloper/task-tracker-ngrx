import { computed, inject, InjectionToken } from '@angular/core';
import {
  patchState,
  signalStore,
  type,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  setEntities,
  withEntities,
  removeEntities,
  removeAllEntities,
} from '@ngrx/signals/entities';
import { firstValueFrom } from 'rxjs';
import { TaskService } from '../services/task.service';
import { Task, TaskBoardState } from '../interfaces/task';

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
  withState(() => {
    console.log(
      '[Store - Init] Initializing with state:',
      inject(TASK_BOARD_INITIAL_STATE)
    );
    return inject(TASK_BOARD_INITIAL_STATE);
  }),
  withEntities({ entity: type<Task>(), collection: 'task' }),
  withComputed(store => {
    console.log('[Store - Setup] Setting up computed selectors');
    return {
      tasksTodo: computed(() => {
        const tasks = store.taskEntities().filter(t => t.status === 'todo');
        console.log('[Store - Selector] Todo tasks count:', tasks.length);
        return tasks;
      }),
      tasksInProgress: computed(() => {
        const tasks = store
          .taskEntities()
          .filter(t => t.status === 'in-progress');
        console.log(
          '[Store - Selector] In Progress tasks count:',
          tasks.length
        );
        return tasks;
      }),
      tasksDone: computed(() => {
        const tasks = store.taskEntities().filter(t => t.status === 'done');
        console.log('[Store - Selector] Done tasks count:', tasks.length);
        return tasks;
      }),
      totalTasks: computed(() => {
        const total = store.taskEntities().length;
        console.log('[Store - Selector] Total tasks:', total);
        return total;
      }),
    };
  }),
  withMethods((store, service = inject(TaskService)) => {
    const updateTasks = (tasks: Task[]) => {
      console.log('[Store - Update] Updating tasks in store:', tasks.length);
      patchState(store, setEntities(tasks, { collection: 'task' }));
    };

    const updateTaskStatus = (taskId: string, status: Task['status']) => {
      console.log(
        `[Store - Update] Updating task ${taskId} status to:`,
        status
      );
      const currentTask = store.taskEntities().find(t => t.id === taskId);
      if (!currentTask) {
        console.warn('[Store - Warning] Task not found:', taskId);
        return null;
      }

      const updatedTask: Task = {
        ...currentTask,
        status,
      };

      patchState(store, setEntities([updatedTask], { collection: 'task' }));
      return currentTask.status;
    };

    const updatePage = (page: number) => {
      console.log('[Store - Update] Updating current page to:', page);
      patchState(store, { currentPage: page });
    };

    return {
      updateTasks,
      updateTaskStatus,
      updatePage,
      async fetchTasks(page = 1) {
        console.log('[Store - Action] Fetching tasks for page:', page);
        patchState(store, { isLoading: true });

        try {
          const result = await firstValueFrom(
            service.getTasks(page, store.pageSize())
          );
          console.log('[Store - Action] Fetched tasks:', result.tasks.length);
          patchState(store, {
            pageCount: result.totalPages,
            currentPage: page,
          });
          updateTasks(result.tasks);
        } catch (error) {
          console.error('[Store - Error] Error fetching tasks:', error);
        } finally {
          patchState(store, { isLoading: false });
        }
      },

      async createTask(task: Omit<Task, 'id' | 'createdAt'>) {
        console.log('[Store - Action] Creating new task:', task);
        try {
          const newTask = await firstValueFrom(service.createTask(task));
          console.log('[Store - Action] Task created:', newTask);
          const currentTasks = store.taskEntities();
          updateTasks([...currentTasks, newTask]);
          return newTask;
        } catch (error) {
          console.error('[Store - Error] Error creating task:', error);
          throw error;
        }
      },

      async deleteTask(taskId: string) {
        console.log('[Store - Action] Deleting task:', taskId);
        try {
          const success = await firstValueFrom(service.deleteTask(taskId));
          if (success) {
            console.log('[Store - Action] Task deleted successfully');
            patchState(store, removeEntities([taskId], { collection: 'task' }));
          } else {
            console.warn('[Store - Warning] Task deletion failed');
          }
          return success;
        } catch (error) {
          console.error('[Store - Error] Error deleting task:', error);
          throw error;
        }
      },

      async changeTaskStatus(taskId: string, newStatus: Task['status']) {
        console.log(
          `[Store - Action] Changing task ${taskId} status to:`,
          newStatus
        );

        const previousStatus = updateTaskStatus(taskId, newStatus);

        try {
          await firstValueFrom(service.updateTaskStatus(taskId, newStatus));
          console.log('[Store - Action] Task status updated successfully');
        } catch (error) {
          console.error('[Store - Error] Error updating task status:', error);
          if (previousStatus) {
            console.log(
              '[Store - Action] Reverting task status to:',
              previousStatus
            );
            updateTaskStatus(taskId, previousStatus);
          }
          throw error;
        }
      },
    };
  }),
  withHooks(store => ({
    onInit() {
      console.log('[Store - Lifecycle] Store initialized, fetching tasks');
      store.fetchTasks();
    },
    onDestroy() {
      console.log('[Store - Lifecycle] Store destroyed, resetting state');
      patchState(store, {
        isLoading: false,
        currentPage: 1,
        pageCount: 1,
      });
      patchState(store, removeAllEntities({ collection: 'task' }));
    },
  }))
);
