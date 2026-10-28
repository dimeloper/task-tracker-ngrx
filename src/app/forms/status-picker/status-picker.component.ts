import { Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { TaskStatus } from '../../interfaces/task';

/**
 * Picks the column a new task starts in. It implements FormValueControl, so a
 * form binds it with [formField] like a native input: `value` is the only
 * required member, and `disabled` and `touch` are picked up when declared.
 */
@Component({
  selector: 'app-status-picker',
  templateUrl: './status-picker.component.html',
  styleUrls: ['./status-picker.component.scss'],
})
export class StatusPickerComponent implements FormValueControl<TaskStatus> {
  readonly value = model(TaskStatus.TODO);
  readonly disabled = input(false);
  readonly touch = output<void>();

  readonly options = [
    { status: TaskStatus.TODO, label: 'To Do' },
    { status: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { status: TaskStatus.DONE, label: 'Done' },
  ];
}
