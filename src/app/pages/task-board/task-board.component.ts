import { Component, inject, signal, Signal } from '@angular/core';
import {
  form,
  FormField,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { firstValueFrom } from 'rxjs';
import { TaskStore } from '../../stores/task-store/task.store';
import { Task, TaskStatus } from '../../interfaces/task';
import {
  taskApiEvents,
  taskPageEvents,
} from '../../stores/task-store/task.events';

const EMPTY_DRAFT = { title: '', description: '' };

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [FormField],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss'],
})
export class TaskBoardComponent {
  readonly store = inject(TaskStore);
  readonly dispatch = injectDispatch(taskPageEvents);
  private readonly events = inject(Events);

  // Expose TaskStatus enum to template
  readonly TaskStatus = TaskStatus;

  readonly todo: Signal<Task[]> = this.store.tasksTodo;
  readonly inProgress: Signal<Task[]> = this.store.tasksInProgress;
  readonly done: Signal<Task[]> = this.store.tasksDone;
  readonly isLoading = this.store.isLoading;

  /** The form's model. Signal Forms writes straight back into this signal. */
  readonly draft = signal({ ...EMPTY_DRAFT });

  readonly taskForm = form(this.draft, path => {
    required(path.title, { message: 'Title is required' });
    minLength(path.title, 3, {
      message: 'Title must be at least 3 characters',
    });
  });

  constructor() {
    // Dispatch the 'opened' event when component initializes
    // This triggers the effect to load tasks
    console.log('[Component] Dispatching: opened');
    this.dispatch.opened();
  }

  /**
   * `submit()` wants an action it can await, and it routes whatever errors that
   * action returns onto the fields. The store speaks events instead: dispatching
   * `taskCreated` returns nothing, and the outcome shows up later as a separate
   * `taskCreatedSuccess` or `taskCreatedFailure`.
   *
   * So we bridge the two — subscribe to the outcome first, dispatch, then await.
   * Subscribing before dispatching is the part that matters: `events.on()` is a
   * hot stream, so an effect that resolves synchronously would land before the
   * subscription did and the promise would never settle.
   */
  async createTask(event: Event) {
    event.preventDefault();

    await submit(this.taskForm, async f => {
      const settled = firstValueFrom(
        this.events.on(
          taskApiEvents.taskCreatedSuccess,
          taskApiEvents.taskCreatedFailure
        )
      );

      console.log('[Component] Dispatching: taskCreated', f().value());
      this.dispatch.taskCreated({
        title: f.title().value(),
        description: f.description().value(),
        status: TaskStatus.TODO,
      });

      const outcome = await settled;
      if (outcome.type === taskApiEvents.taskCreatedFailure.type) {
        return {
          kind: 'server',
          message: String(outcome.payload),
          fieldTree: f.title,
        };
      }

      // reset() clears touched and dirty as well as the value. Writing the model
      // signal directly would leave the field touched, so the "Title is required"
      // error reappears the instant the form empties.
      this.taskForm().reset({ ...EMPTY_DRAFT });
      return undefined;
    });
  }

  deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      // Dispatch event: handled by effects and reducer
      console.log('[Component] Dispatching: taskDeleted', { taskId });
      this.dispatch.taskDeleted(taskId);
    }
  }
  moveTo(taskId: string, targetStatus: TaskStatus) {
    // Capture current status before dispatching for potential rollback
    const task = this.store.taskEntities().find(t => t.id === taskId);
    const previousStatus = task?.status;

    // Dispatch event: optimistic update by reducer
    // Effects handle API call and revert on failure
    console.log('[Component] Dispatching: taskStatusChanged', {
      id: taskId,
      status: targetStatus,
      previousStatus,
    });
    this.dispatch.taskStatusChanged({
      id: taskId,
      status: targetStatus,
      previousStatus: previousStatus!,
    });
  }
}
