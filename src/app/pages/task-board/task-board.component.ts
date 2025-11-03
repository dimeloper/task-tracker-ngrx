import { Component, inject, Signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { injectDispatch } from '@ngrx/signals/events';
import { TaskStore } from '../../stores/task-store/task.store';
import { Task, TaskStatus } from '../../interfaces/task';
import { taskPageEvents } from '../../stores/task-store/task.events';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss'],
})
export class TaskBoardComponent {
  readonly store = inject(TaskStore);
  private readonly fb = inject(FormBuilder);
  readonly dispatch = injectDispatch(taskPageEvents);

  // Expose TaskStatus enum to template
  readonly TaskStatus = TaskStatus;

  readonly todo: Signal<Task[]> = this.store.tasksTodo;
  readonly inProgress: Signal<Task[]> = this.store.tasksInProgress;
  readonly done: Signal<Task[]> = this.store.tasksDone;
  readonly isLoading = this.store.isLoading;

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
  });

  constructor() {
    // Dispatch the 'opened' event when component initializes
    // This triggers the effect to load tasks
    this.dispatch.opened();
  }

  createTask() {
    if (this.taskForm.invalid) return;

    const newTask = {
      title: this.taskForm.get('title')?.value,
      description: this.taskForm.get('description')?.value,
      status: TaskStatus.TODO,
    };

    // Dispatch event: task.effects.ts handles the API call
    // task.reducer.ts updates the store state on success
    this.dispatch.taskCreated(newTask);
    this.taskForm.reset();
  }

  deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      // Dispatch event: handled by effects and reducer
      this.dispatch.taskDeleted(taskId);
    }
  }

  moveTo(taskId: string, targetStatus: TaskStatus) {
    // Dispatch event: optimistic update by reducer
    // Effects handle API call and revert on failure
    this.dispatch.taskStatusChanged({ id: taskId, status: targetStatus });
  }
}
