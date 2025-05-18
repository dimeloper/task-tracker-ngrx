import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Task } from '../interfaces/task';
import { HOUSEHOLD_TASKS } from '../mocks/household-tasks';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly MOCK_DATA: Task[] = [...HOUSEHOLD_TASKS];

  getTasks(
    page: number,
    pageSize: number
  ): Observable<{ tasks: Task[]; totalPages: number }> {
    console.log('[Service - Request] Fetching tasks', { page, pageSize });
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const tasks = this.MOCK_DATA.slice(start, end);
    const totalPages = Math.ceil(this.MOCK_DATA.length / pageSize);

    return of({ tasks, totalPages }).pipe(
      delay(300),
      tap(result => {
        console.log('[Service - Response] Tasks fetched', {
          count: result.tasks.length,
          totalPages: result.totalPages,
        });
      })
    );
  }

  createTask(task: Omit<Task, 'id' | 'createdAt'>): Observable<Task> {
    console.log('[Service - Request] Creating task', task);
    const newTask: Task = {
      ...task,
      id: `${this.MOCK_DATA.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    this.MOCK_DATA.push(newTask);
    return of(newTask).pipe(
      delay(200),
      tap(createdTask => {
        console.log('[Service - Response] Task created', createdTask);
      })
    );
  }

  deleteTask(taskId: string): Observable<boolean> {
    console.log('[Service - Request] Deleting task', taskId);
    const index = this.MOCK_DATA.findIndex(task => task.id === taskId);
    if (index > -1) {
      this.MOCK_DATA.splice(index, 1);
      return of(true).pipe(
        delay(200),
        tap(() => {
          console.log('[Service - Response] Task deleted successfully');
        })
      );
    }
    return of(false).pipe(
      delay(200),
      tap(() => {
        console.log('[Service - Response] Task not found for deletion');
      })
    );
  }

  updateTaskStatus(
    taskId: string,
    newStatus: Task['status']
  ): Observable<boolean> {
    console.log('[Service - Request] Updating task status', {
      taskId,
      newStatus,
    });
    const taskIndex = this.MOCK_DATA.findIndex(task => task.id === taskId);
    if (taskIndex > -1) {
      this.MOCK_DATA[taskIndex] = {
        ...this.MOCK_DATA[taskIndex],
        status: newStatus,
      };
      return of(true).pipe(
        delay(200),
        tap(() => {
          console.log('[Service - Response] Task status updated successfully');
        })
      );
    }
    return of(true).pipe(
      delay(200),
      tap(() => {
        console.log('[Service - Response] Task not found for status update');
      })
    );
  }
}
