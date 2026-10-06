import { minLength, required, schema } from '@angular/forms/signals';

/** One title rule for both forms, so creating and editing can't drift apart. */
export const taskTitleSchema = schema<string>(title => {
  required(title, { message: 'Title is required' });
  minLength(title, 3, { message: 'Title must be at least 3 characters' });
});
