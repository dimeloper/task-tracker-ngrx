import { Component, inject, signal } from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { injectDispatch } from '@ngrx/signals/events';
import { TaskStore } from '../../stores/task-store/task.store';
import { errorMessage } from '../../stores/task-store/task.forms';
import { taskPageEvents } from '../../stores/task-store/task.events';
import { taskTitleSchema } from '../../forms/task-title.schema';
import { Task, TaskDraft, TaskStatus } from '../../interfaces/task';
import { TaskEditComponent } from './task-edit/task-edit.component';

const EMPTY_DRAFT: TaskDraft = { title: '', description: '' };

@Component({
  selector: 'app-task-board',
  imports: [FormField, TaskEditComponent],
  // The board owns the store: it lives as long as the page, and the task editor
  // inside the board injects this same instance.
  providers: [TaskStore],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss'],
})
export class TaskBoardComponent {
  readonly store = inject(TaskStore);
  readonly dispatch = injectDispatch(taskPageEvents);

  readonly todo = this.store.tasksTodo;
  readonly inProgress = this.store.tasksInProgress;
  readonly done = this.store.tasksDone;

  /** Each column, with the move its cards offer (Done has none). */
  readonly columns = [
    {
      title: 'To Do',
      tasks: this.todo,
      next: { label: 'Start', status: TaskStatus.IN_PROGRESS },
    },
    {
      title: 'In Progress',
      tasks: this.inProgress,
      next: { label: 'Complete', status: TaskStatus.DONE },
    },
    { title: 'Done', tasks: this.done, next: null },
  ];

  /**
   * The create form's model. A new task has nothing in the store to start
   * from, so the draft is plain local state; Signal Forms writes into it.
   */
  readonly draft = signal({ ...EMPTY_DRAFT });

  readonly taskForm = form(this.draft, path => {
    apply(path.title, taskTitleSchema);
  });

  constructor() {
    // Dispatch the 'opened' event when component initializes
    // This triggers the effect to load tasks
    console.log('[Component] Dispatching: opened');
    this.dispatch.opened();
  }

  /**
   * createTask is a mutation on the store, so it can be awaited: it resolves to
   * success or error, and submit() turns an error into a message on the title.
   */
  async createTask(event: Event) {
    event.preventDefault();

    await submit(this.taskForm, async f => {
      console.log('[Component] Creating task', f().value());
      const result = await this.store.createTask(f().value());

      if (result.status === 'error') {
        return {
          kind: 'server',
          message: errorMessage(result.error),
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

  isEditing(task: Task): boolean {
    return this.store.taskEdit()?.id === task.id;
  }

  deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      // Dispatch event: handled by effects and reducer
      console.log('[Component] Dispatching: taskDeleted', { taskId });
      this.dispatch.taskDeleted(taskId);
    }
  }

  moveTo(task: Task, targetStatus: TaskStatus) {
    // Dispatch event: optimistic update by reducer
    // Effects handle API call and revert on failure
    console.log('[Component] Dispatching: taskStatusChanged', {
      id: task.id,
      status: targetStatus,
      previousStatus: task.status,
    });
    this.dispatch.taskStatusChanged({
      id: task.id,
      status: targetStatus,
      previousStatus: task.status,
    });
  }
}
