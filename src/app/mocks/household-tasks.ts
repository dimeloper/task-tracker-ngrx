import { Task, TaskStatus } from '../interfaces/task';

export const HOUSEHOLD_TASKS: Task[] = [
  // TODO (1)
  {
    id: '1',
    title: 'Clean the kitchen',
    description: 'Wipe counters, clean stove, mop floor',
    status: TaskStatus.TODO,
    createdAt: new Date().toISOString(),
  },
  // IN_PROGRESS (3)
  {
    id: '2',
    title: 'Do laundry',
    description: 'Wash, dry, and fold clothes',
    status: TaskStatus.IN_PROGRESS,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Pay bills',
    description: 'Pay electricity, water, and internet bills',
    status: TaskStatus.IN_PROGRESS,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Water plants',
    description: 'Water indoor and outdoor plants',
    status: TaskStatus.IN_PROGRESS,
    createdAt: new Date().toISOString(),
  },
  // DONE (5)
  {
    id: '5',
    title: 'Grocery shopping',
    description: 'Buy fruits, vegetables, and household supplies',
    status: TaskStatus.DONE,
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Organize pantry',
    description: 'Sort and organize food items',
    status: TaskStatus.DONE,
    createdAt: new Date().toISOString(),
  },
  {
    id: '7',
    title: 'Change bed sheets',
    description: 'Wash and replace bed sheets',
    status: TaskStatus.DONE,
    createdAt: new Date().toISOString(),
  },
];
