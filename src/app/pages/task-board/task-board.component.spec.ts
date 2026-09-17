import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskBoardComponent } from './task-board.component';

describe('TaskBoardComponent', () => {
  let component: TaskBoardComponent;
  let fixture: ComponentFixture<TaskBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('starts invalid, because the title is required', () => {
      expect(component.taskForm().invalid()).toBe(true);
      expect(
        component.taskForm
          .title()
          .errors()
          .map(e => e.kind)
      ).toContain('required');
    });

    it('rejects a title shorter than three characters', () => {
      component.draft.set({ title: 'ab', description: '' });
      expect(
        component.taskForm
          .title()
          .errors()
          .map(e => e.kind)
      ).toContain('minLength');
      expect(component.taskForm().invalid()).toBe(true);
    });

    it('accepts a title of three characters or more', () => {
      component.draft.set({ title: 'Mop the floor', description: '' });
      expect(component.taskForm.title().errors()).toEqual([]);
      expect(component.taskForm().valid()).toBe(true);
    });

    it('leaves the description unvalidated', () => {
      component.draft.set({ title: 'Mop the floor', description: '' });
      expect(component.taskForm.description().errors()).toEqual([]);
    });
  });

  describe('createTask', () => {
    const submitEvent = () => new Event('submit');

    it('creates the task and clears the form on success', async () => {
      component.draft.set({
        title: 'A brand new task',
        description: 'written by the spec',
      });

      await component.createTask(submitEvent());

      expect(component.draft()).toEqual({ title: '', description: '' });
      expect(
        component.todo().some(task => task.title === 'A brand new task')
      ).toBe(true);
    });

    it('routes a server rejection onto the title field', async () => {
      // The mock service rejects a title that already exists, which is the kind of
      // failure only the server can know about.
      const existing = 'Clean the kitchen'; // seeded in HOUSEHOLD_TASKS
      component.draft.set({ title: existing, description: '' });

      await component.createTask(submitEvent());

      const errors = component.taskForm.title().errors();
      expect(errors.map(e => e.kind)).toContain('server');
      expect(errors.map(e => e.message)).toContain(
        'A task with this title already exists'
      );
      // The draft survives so the user can correct it.
      expect(component.draft().title).toBe(existing);
    });

    it('does not submit while the form is invalid', async () => {
      const before = component.todo().length;
      component.draft.set({ title: 'ab', description: '' });

      await component.createTask(submitEvent());

      expect(component.todo().length).toBe(before);
    });
  });
});
