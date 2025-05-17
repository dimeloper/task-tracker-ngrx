import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Task } from '../stores/task.store';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly MOCK_DATA: Task[] = Array.from({ length: 25 }).map(
    (_, index) => ({
      id: `${index + 1}`,
      title: `Task #${index + 1}`,
      description: `Description for task ${index + 1}`,
      status:
        index % 3 === 0 ? 'done' : index % 2 === 0 ? 'in-progress' : 'todo',
      createdAt: new Date().toISOString(),
    })
  );

  getTasks(
    page: number,
    pageSize: number
  ): Observable<{ tasks: Task[]; totalPages: number }> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const tasks = this.MOCK_DATA.slice(start, end);
    const totalPages = Math.ceil(this.MOCK_DATA.length / pageSize);

    return of({ tasks, totalPages }).pipe(delay(300));
  }

  updateTaskStatus(
    taskId: string,
    newStatus: Task['status']
  ): Observable<boolean> {
    const taskIndex = this.MOCK_DATA.findIndex(task => task.id === taskId);
    if (taskIndex > -1) {
      this.MOCK_DATA[taskIndex] = {
        ...this.MOCK_DATA[taskIndex],
        status: newStatus,
      };
    }

    return of(true).pipe(delay(200));
  }
}
