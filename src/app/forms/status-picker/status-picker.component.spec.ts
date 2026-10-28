import { describe, it, expect, beforeEach } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { disabled, form, FormField } from '@angular/forms/signals';
import { StatusPickerComponent } from './status-picker.component';
import { TaskStatus } from '../../interfaces/task';

// A host form, so the control is tested through [formField] the way the board
// uses it, rather than by setting its inputs directly.
@Component({
  imports: [FormField, StatusPickerComponent],
  template: `<app-status-picker [formField]="statusForm.status" />`,
})
class HostComponent {
  readonly locked = signal(false);
  readonly model = signal({ status: TaskStatus.TODO });
  readonly statusForm = form(this.model, path => {
    disabled(path.status, () => this.locked());
  });
}

describe('StatusPickerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const button = (label: string): HTMLButtonElement =>
    [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => b.textContent?.trim() === label
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the field value as the pressed option', () => {
    expect(button('To Do').getAttribute('aria-pressed')).toBe('true');
    expect(button('Done').getAttribute('aria-pressed')).toBe('false');
  });

  it('writes a click back into the model', () => {
    button('Done').click();

    expect(host.model().status).toBe(TaskStatus.DONE);
  });

  it('marks the field touched when focus leaves it', () => {
    button('Done').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

    expect(host.statusForm.status().touched()).toBe(true);
  });

  it('takes its disabled state from the form rule', async () => {
    host.locked.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(button('In Progress').disabled).toBe(true);
  });
});
