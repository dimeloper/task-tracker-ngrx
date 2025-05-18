import { Component, OnInit, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskStore } from '../../stores/task.store';
import { Task } from '../../interfaces/task';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  newTaskTitle = '';
  newTaskDescription = '';

  ngOnInit(): void {
    this.store.fetchTasks();
  }

  async createTask() {
    if (!this.newTaskTitle.trim()) return;

    try {
      await this.store.createTask({
        title: this.newTaskTitle,
        description: this.newTaskDescription,
        status: 'todo',
      });
      this.newTaskTitle = '';
      this.newTaskDescription = '';
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  async deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await this.store.deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  }

  moveTo(taskId: string, targetStatus: Task['status']) {
    this.store.changeTaskStatus(taskId, targetStatus);
  }
}
