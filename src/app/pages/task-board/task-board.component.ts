import { Component, OnInit, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskStore } from '../../stores/task.store';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss'],
  providers: [TaskStore],
})
export class TaskBoardComponent implements OnInit {
  readonly store = inject(TaskStore);

  readonly todo: Signal<Task[]> = this.store.tasksTodo;
  readonly inProgress: Signal<Task[]> = this.store.tasksInProgress;
  readonly done: Signal<Task[]> = this.store.tasksDone;
  readonly isLoading = this.store.isLoading;

  ngOnInit(): void {
    this.store.fetchTasks();
  }

  moveTo(taskId: string, targetStatus: Task['status']) {
    this.store.changeTaskStatus(taskId, targetStatus);
  }
}
