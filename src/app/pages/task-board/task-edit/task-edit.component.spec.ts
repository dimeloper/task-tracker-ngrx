import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { injectDispatch } from '@ngrx/signals/events';
import { TaskEditComponent } from './task-edit.component';
import { TaskStore } from '../../../stores/task-store/task.store';
import { taskPageEvents } from '../../../stores/task-store/task.events';
import { TaskService } from '../../../services/task.service';
import { Task, TaskStatus } from '../../../interfaces/task';

describe('TaskEditComponent', () => {
  let fixture: ComponentFixture<TaskEditComponent>;
  let component: TaskEditComponent;
  let store: InstanceType<typeof TaskStore>;
  let updateTask: ReturnType<typeof vi.fn>;

  const task: Task = {
    id: '1',
    title: 'Water the plants',
    description: 'Balcony first',
    status: TaskStatus.TODO,
    createdAt: '2026-10-06T00:00:00.000Z',
  };

  beforeEach(() => {
    updateTask = vi.fn();
    TestBed.configureTestingModule({
      imports: [TaskEditComponent],
      providers: [
        TaskStore,
        {
          provide: TaskService,
          useValue: {
            getTasks: () => of({ tasks: [task], totalPages: 1 }),
            updateTask,
          },
        },
      ],
    });

    store = TestBed.inject(TaskStore);
    TestBed.runInInjectionContext(() =>
      injectDispatch(taskPageEvents)
    ).opened();
    store.startEditing('1');

    fixture = TestBed.createComponent(TaskEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const submitEvent = () => new Event('submit');

  describe('the form and the store share one draft', () => {
    it('opens with the draft the store holds', () => {
      expect(component.editForm.title().value()).toBe('Water the plants');
      expect(component.editForm.description().value()).toBe('Balcony first');
    });

    it('writes what is typed straight into the store', () => {
      component.editForm.title().value.set('Water the herbs');

      expect(store.taskEdit()?.title).toBe('Water the herbs');
    });

    it('follows the store when the draft changes there', () => {
      store.updateTaskEdit({
        id: '1',
        title: 'Changed elsewhere',
        description: '',
      });

      expect(component.editForm.title().value()).toBe('Changed elsewhere');
    });
  });

  it('applies the same title rule as the create form', () => {
    component.editForm.title().value.set('ab');

    expect(
      component.editForm
        .title()
        .errors()
        .map(e => e.kind)
    ).toContain('minLength');
    expect(component.editForm().invalid()).toBe(true);
  });

  it('saves the edit, which updates the task and closes the editor', async () => {
    updateTask.mockReturnValue(
      of({ ...task, title: 'Water the herbs', description: 'Balcony first' })
    );
    component.editForm.title().value.set('Water the herbs');

    await component.save(submitEvent());

    expect(updateTask).toHaveBeenCalledWith('1', {
      title: 'Water the herbs',
      description: 'Balcony first',
    });
    expect(store.taskEntities()[0].title).toBe('Water the herbs');
    expect(store.taskEdit()).toBeNull();
  });

  it('routes a server rejection onto the title and keeps the draft', async () => {
    updateTask.mockReturnValue(
      throwError(() => ({ message: 'A task with this title already exists' }))
    );
    component.editForm.title().value.set('Clean the kitchen');

    await component.save(submitEvent());

    const errors = component.editForm.title().errors();
    expect(errors.map(e => e.kind)).toContain('server');
    expect(errors.map(e => e.message)).toContain(
      'A task with this title already exists'
    );
    expect(store.taskEdit()?.title).toBe('Clean the kitchen');
  });

  it('does not save while the title is invalid', async () => {
    component.editForm.title().value.set('');

    await component.save(submitEvent());

    expect(updateTask).not.toHaveBeenCalled();
  });

  it('drops the draft on cancel, leaving the task as it was', () => {
    component.editForm.title().value.set('Never mind');

    component.cancel();

    expect(store.taskEdit()).toBeNull();
    expect(store.taskEntities()[0].title).toBe('Water the plants');
  });
});
