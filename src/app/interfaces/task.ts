export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
}

export interface TaskBoardState {
  isLoading: boolean;
  pageSize: number;
  pageCount: number;
  currentPage: number;
}
