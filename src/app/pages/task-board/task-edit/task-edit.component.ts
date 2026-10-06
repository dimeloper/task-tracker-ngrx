import { Component, inject, linkedSignal } from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { TaskStore } from '../../../stores/task-store/task.store';
import { errorMessage } from '../../../stores/task-store/task.forms';
import { taskTitleSchema } from '../../../forms/task-title.schema';
import { TaskEdit } from '../../../interfaces/task';

const NO_EDIT: TaskEdit = { id: '', title: '', description: '' };

/**
 * Edits the task in the store's taskEdit. The board only renders this while an
 * edit is open, so NO_EDIT is there for the types, not for the screen.
 */
@Component({
  selector: 'app-task-edit',
  imports: [FormField],
  templateUrl: './task-edit.component.html',
  styleUrl: './task-edit.component.scss',
})
export class TaskEditComponent {
  private readonly store = inject(TaskStore);

  /**
   * form() needs a writable signal, and the store's state is read-only from
   * outside. linkedSignal bridges the two: it reads taskEdit from the store, and
   * its set option sends every write (each keystroke, and reset()) back to a
   * store method instead of keeping a local copy. The store stays the one owner
   * of the draft, and the form follows whatever the store holds.
   */
  readonly edit = linkedSignal(() => this.store.taskEdit() ?? NO_EDIT, {
    set: edit => this.store.updateTaskEdit(edit),
  });

  readonly editForm = form(this.edit, path => {
    apply(path.title, taskTitleSchema);
  });

  readonly isSaving = this.store.saveTaskEditIsPending;

  async save(event: Event) {
    event.preventDefault();

    await submit(this.editForm, async f => {
      const result = await this.store.saveTaskEdit(f().value());

      if (result.status === 'error') {
        return {
          kind: 'server',
          message: errorMessage(result.error),
          fieldTree: f.title,
        };
      }

      // On success the reducer closes the edit, which removes this component.
      return undefined;
    });
  }

  cancel() {
    this.store.stopEditing();
  }
}
