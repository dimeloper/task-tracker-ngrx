import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Task, TaskDraft, TasksPage } from '../interfaces/task';
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

  getTasks(page: number, pageSize: number): Observable<TasksPage> {
    // Real API implementation:
    // GET /tasks?page=1&pageSize=10
    // Returns: { tasks: Task[], totalPages: number }
    // const params = new HttpParams()
    //   .set('page', page.toString())
    //   .set('pageSize', pageSize.toString());
    // return this.http.get<{ tasks: Task[]; totalPages: number }>(this.API_URL, { params });

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

    if (this.isTitleTaken(task.title)) {
      return this.rejectDuplicateTitle(task.title);
    }

    const newTask: Task = {
      ...task,
      // length + 1 would reuse a live id once anything has been deleted.
      id: `${Math.max(0, ...this.MOCK_DATA.map(t => Number(t.id))) + 1}`,
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

  updateTask(taskId: string, changes: TaskDraft): Observable<Task> {
    // Real API implementation:
    // PUT /tasks/:id
    // Body: { title: string, description: string }
    // Returns: Task (the saved version)
    // return this.http.put<Task>(`${this.API_URL}/${taskId}`, changes);

    if (this.isTitleTaken(changes.title, taskId)) {
      return this.rejectDuplicateTitle(changes.title);
    }

    const index = this.MOCK_DATA.findIndex(task => task.id === taskId);
    if (index === -1) {
      return throwError(() => ({ message: 'This task no longer exists' })).pipe(
        delay(200)
      );
    }

    const saved: Task = { ...this.MOCK_DATA[index], ...changes };
    this.MOCK_DATA[index] = saved;
    return of(saved).pipe(
      delay(200),
      tap(task => {
        console.log('[Service - Response] Task updated', task);
      })
    );
  }

  deleteTask(taskId: string): Observable<boolean> {
    // Real API implementation:
    // DELETE /tasks/:id
    // Returns: boolean (success/failure)
    // return this.http.delete<boolean>(`${this.API_URL}/${taskId}`);

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

    // Simulate failure for task ID '3' to demonstrate optimistic update rollback
    if (taskId === '3') {
      return of(false).pipe(
        delay(200),
        tap(() => {
          console.error(
            '[Service - Response] Failed to update task status (simulated failure for task 3)'
          );
        }),
        // Convert false to error to trigger catchError in effect
        tap(() => {
          throw new Error(
            'Failed to update task status: Server error (simulated for task 3)'
          );
        })
      );
    }

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

  // A real API would reject a duplicate title server-side. Simulating it gives
  // both forms a failure that only the server can know about, which is the case
  // Signal Forms routes back onto a specific field.
  private isTitleTaken(title: string, ignoreId?: string): boolean {
    const wanted = title.trim().toLowerCase();
    return this.MOCK_DATA.some(
      existing =>
        existing.id !== ignoreId && existing.title.toLowerCase() === wanted
    );
  }

  private rejectDuplicateTitle(title: string): Observable<never> {
    console.log('[Service - Response] Duplicate title rejected', title);
    return throwError(() => ({
      message: 'A task with this title already exists',
    })).pipe(delay(200));
  }
}
