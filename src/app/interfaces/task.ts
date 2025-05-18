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
