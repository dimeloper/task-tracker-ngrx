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

/** The fields a user types, for both the create and the edit form. */
export interface TaskDraft {
  title: string;
  description: string;
}

/** An edit in progress: which task, and what it currently says. */
export interface TaskEdit extends TaskDraft {
  id: string;
}

export interface TasksPage {
  tasks: Task[];
  totalPages: number;
}

export interface TaskBoardState {
  isLoading: boolean;
  error: string | null;
  pageSize: number;
  pageCount: number;
  currentPage: number;
  taskEdit: TaskEdit | null;
}
