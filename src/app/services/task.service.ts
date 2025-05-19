import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Task } from '../interfaces/task';
import { HOUSEHOLD_TASKS } from '../mocks/household-tasks';
// import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly MOCK_DATA: Task[] = [...HOUSEHOLD_TASKS];
  // private readonly API_URL = 'https://api.example.com/tasks';

  // Expected CRUD API Endpoints:
  // GET    /tasks?page=1&pageSize=10    - Get paginated tasks
  // POST   /tasks                       - Create new task
  // DELETE /tasks/:id                   - Delete task by ID
  // PATCH  /tasks/:id/status           - Update task status
  // GET    /tasks/:id                   - Get single task (if needed)
  // PUT    /tasks/:id                   - Update entire task (if needed)

  // constructor(private http: HttpClient) {}

  getTasks(
    page: number,
    pageSize: number
  ): Observable<{ tasks: Task[]; totalPages: number }> {
    // Real API implementation:
    // GET /tasks?page=1&pageSize=10
    // Returns: { tasks: Task[], totalPages: number }
    // const params = new HttpParams()
    //   .set('page', page.toString())
    //   .set('pageSize', pageSize.toString());
    // return this.http.get<{ tasks: Task[]; totalPages: number }>(this.API_URL, { params });

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
    // Real API implementation:
    // POST /tasks
    // Body: { title: string, description: string, status: string, ... }
    // Returns: Task (with id and createdAt)
    // return this.http.post<Task>(this.API_URL, task);

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
    // Real API implementation:
    // DELETE /tasks/:id
    // Returns: boolean (success/failure)
    // return this.http.delete<boolean>(`${this.API_URL}/${taskId}`);

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
    // Real API implementation:
    // PATCH /tasks/:id/status
    // Body: { status: string }
    // Returns: boolean (success/failure)
    // return this.http.patch<boolean>(`${this.API_URL}/${taskId}/status`, { status: newStatus });

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
