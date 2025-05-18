import { describe, it, expect, beforeEach } from 'vitest';
import { TaskService } from './task.service';
import { Task } from '../interfaces/task';
import { firstValueFrom } from 'rxjs';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    service = new TaskService();
  });

  describe('getTasks', () => {
    it('should return paginated tasks and total pages', async () => {
      const pageSize = 2;
      const page = 1;

      const result = await firstValueFrom(service.getTasks(page, pageSize));

      expect(result.tasks).toBeDefined();
      expect(result.totalPages).toBeGreaterThan(0);
      expect(Array.isArray(result.tasks)).toBe(true);
    });

    it('should return correct page size', async () => {
      const pageSize = 2;
      const page = 1;

      const result = await firstValueFrom(service.getTasks(page, pageSize));

      expect(result.tasks.length).toBeLessThanOrEqual(pageSize);
    });

    it('should return empty array for out of bounds page', async () => {
      const pageSize = 2;
      const page = 999; // Use a very large page number

      const result = await firstValueFrom(service.getTasks(page, pageSize));

      expect(result.tasks).toHaveLength(0);
      expect(result.totalPages).toBeGreaterThan(0);
    });
  });

  describe('createTask', () => {
    it('should create a new task with generated id and timestamp', async () => {
      const newTask: Omit<Task, 'id' | 'createdAt'> = {
        title: 'New Task',
        description: 'New Description',
        status: 'todo',
      };

      const result = await firstValueFrom(service.createTask(newTask));

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.title).toBe(newTask.title);
      expect(result.description).toBe(newTask.description);
      expect(result.status).toBe(newTask.status);
    });

    it('should create task with unique id', async () => {
      const newTask: Omit<Task, 'id' | 'createdAt'> = {
        title: 'New Task',
        description: 'New Description',
        status: 'todo',
      };

      const result1 = await firstValueFrom(service.createTask(newTask));
      const result2 = await firstValueFrom(service.createTask(newTask));

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('deleteTask', () => {
    it('should return true when task exists', async () => {
      // First create a task
      const newTask: Omit<Task, 'id' | 'createdAt'> = {
        title: 'Task to Delete',
        description: 'Will be deleted',
        status: 'todo',
      };
      const createdTask = await firstValueFrom(service.createTask(newTask));

      // Then try to delete it
      const result = await firstValueFrom(service.deleteTask(createdTask.id));

      expect(result).toBe(true);
    });

    it('should return false when task does not exist', async () => {
      const result = await firstValueFrom(
        service.deleteTask('non-existent-id')
      );

      expect(result).toBe(false);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status when task exists', async () => {
      // First create a task
      const newTask: Omit<Task, 'id' | 'createdAt'> = {
        title: 'Task to Update',
        description: 'Will be updated',
        status: 'todo',
      };
      const createdTask = await firstValueFrom(service.createTask(newTask));

      // Then update its status
      const newStatus: Task['status'] = 'done';
      const result = await firstValueFrom(
        service.updateTaskStatus(createdTask.id, newStatus)
      );

      expect(result).toBe(true);
    });

    it('should return true even when task does not exist', async () => {
      const result = await firstValueFrom(
        service.updateTaskStatus('non-existent-id', 'done')
      );

      expect(result).toBe(true);
    });
  });
});
