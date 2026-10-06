# Task Tracker with NgRx Signals

A modern task management application built with Angular and NgRx Signals Events, demonstrating event-driven state management using the Flux architecture pattern.

## Features

- Task management with three states: Todo, In Progress, and Done
- Create and edit tasks with Signal Forms, including server-side validation
- Event-driven architecture using NgRx Signals Events
- Awaitable mutations for the forms, so a form knows when its save succeeded
- Optimistic status moves with rollback, and paging
- Unidirectional data flow following Flux principles
- Comprehensive test coverage with Vitest
- Detailed logging for debugging and monitoring

## Versions

Each article in the series ships against a tag, so the code you are reading
matches the post you came from.

| Tag                   | Article                                              |
| --------------------- | ---------------------------------------------------- |
| `v1.0.0-method-based` | Using NgRx Signal Store for State Management         |
| `v2.0.0-event-based`  | Event-Driven State Management with NgRx Signal Store |
| `v3.0.0-signal-forms` | Building Angular Forms with Signal Forms and NgRx    |

## Tech Stack

- Angular 22+
- Angular Signal Forms (`@angular/forms/signals`)
- NgRx Signals with Events plugin for state management
- `@angular-architects/ngrx-toolkit` for mutations (`withMutations`, `rxMutation`)
- RxJS for reactive programming
- Vitest for testing
- SCSS for styling
- pnpm for package management

## Architecture

This application implements the **Flux architecture pattern** using NgRx Signals Events, providing a predictable and maintainable approach to state management.

### Flux Pattern Overview

Flux is a unidirectional data flow pattern that consists of four main parts:

1. **Actions (Events)**: Describe what happened in the application
2. **Dispatcher**: Routes events to appropriate handlers
3. **Store**: Holds application state and business logic
4. **View**: Displays the current state and dispatches user actions

### Implementation in This Project

#### Event Groups

Events are organized into two groups representing different sources:

**Page Events** (`taskPageEvents`): User interactions from the UI

- `opened`: Page initialization
- `taskDeleted`: User deletes a task
- `taskStatusChanged`: User moves a task between columns
- `pageChanged`: User navigates to a different page
- `errorDismissed`: User closes the error banner

Creating and editing a task are not page events. The forms need to await the
outcome, which a dispatched event can't give them, so they call mutations on the
store instead (see [Forms and the store](#forms-and-the-store)).

**API Events** (`taskApiEvents`): Results from API operations

- `tasksLoadedSuccess/Failure`: Task list fetch results
- `taskCreatedSuccess/Failure`: Task creation results (dispatched by the `createTask` mutation)
- `taskUpdatedSuccess/Failure`: Task edit results (dispatched by the `saveTaskEdit` mutation)
- `taskDeletedSuccess/Failure`: Task deletion results
- `taskStatusChangedSuccess/Failure`: Status update results

Because the mutations report their outcome as API events too, the reducer is
still the only code that changes the tasks, and the event log still shows every
result.

#### Data Flow

```text
┌─────────────┐
│    View     │  (TaskBoardComponent)
│  (Component)│
└──────┬──────┘
       │
       │ dispatch(event)
       ▼
┌─────────────┐
│  Dispatcher │  (injectDispatch)
└──────┬──────┘
       │
       │ routes event
       ▼
┌─────────────────────────────────────────┐
│              Store                      │
│  ┌────────────┐      ┌──────────────┐  │
│  │  Effects   │──────│   Reducer    │  │
│  │ (Side      │      │  (Pure State │  │
│  │  Effects)  │      │   Updates)   │  │
│  └────────────┘      └──────────────┘  │
│        │                     │          │
│        │ API calls           │ state    │
│        ▼                     ▼          │
│  ┌────────────┐      ┌──────────────┐  │
│  │  Service   │      │    Signals   │  │
│  └────────────┘      └──────────────┘  │
└────────────────────────┬────────────────┘
                         │
                         │ subscribe
                         ▼
                  ┌─────────────┐
                  │    View     │
                  │  (Updates)  │
                  └─────────────┘
```

#### Store Structure

The store is composed using feature functions. `TaskBoardComponent` provides
it (`providers: [TaskStore]`), so it lives as long as the board does, and the
task editor inside the board injects the same instance.

**withEntities**: Manages the task collection with CRUD operations

```typescript
withEntities({ entity: type<Task>(), collection: 'task' });
```

**withState**: Manages additional UI state (loading, pagination)

```typescript
withState(() => inject(TASK_BOARD_INITIAL_STATE));
```

**withTaskReducer**: Pure state update functions that respond to events

```typescript
on(taskApiEvents.tasksLoadedSuccess, event => [
  setAllEntities(event.payload, { collection: 'task' }),
  { isLoading: false },
]);
```

**withTaskEffects**: Side effect handlers for asynchronous operations. Each one
picks its flattening operator on purpose:

```typescript
// switchMap: only the page asked for last matters
loadTasks$: events.on(taskPageEvents.opened, taskPageEvents.pageChanged).pipe(
  switchMap(() =>
    taskService.getTasks(store.currentPage(), store.pageSize()).pipe(
      map(page => taskApiEvents.tasksLoadedSuccess(page)),
      catchError(error => of(taskApiEvents.tasksLoadedFailure(error.message)))
    )
  )
);

// One queue per task: moves of one card reach the server in order,
// moves of different cards don't wait on each other, and none is dropped
changeTaskStatus$: events.on(taskPageEvents.taskStatusChanged).pipe(
  groupBy(event => event.payload.id),
  mergeMap(movesOfOneTask => movesOfOneTask.pipe(concatMap(/* request */)))
);
```

**withTaskColumns**: Derived state based on entities

```typescript
tasksTodo: computed(() =>
  taskEntities().filter(t => t.status === TaskStatus.TODO)
);
```

**withTaskForms**: What the create and edit forms call: the edit draft's
methods, and the two mutations

```typescript
withMutations(store => ({
  createTask: rxMutation<TaskDraft, Task>({
    operation: draft =>
      store._taskService.createTask({ ...draft, status: TaskStatus.TODO }),
    onSuccess: task =>
      store._dispatcher.dispatch(taskApiEvents.taskCreatedSuccess(task)),
    onError: error =>
      store._dispatcher.dispatch(
        taskApiEvents.taskCreatedFailure(errorMessage(error))
      ),
  }),
  saveTaskEdit: rxMutation<TaskEdit, Task>({/* same shape */}),
}));
```

The reducer, effects, columns and forms features all declare the same input,
`taskStoreInput` (in `task-store.config.ts`). `signalStore()` infers each
feature's types partly from what later features declare they need. When one
feature asks only for state and another only for props, those guesses disagree,
and TypeScript reports that no overload matches.

**withEventLogging**: Reusable feature for logging all events (for debugging)

```typescript
withEventLogging([taskPageEvents, taskApiEvents]);
```

This feature automatically logs all events from the specified event groups, using `Object.values()` to include all events without manual enumeration. It's a composable feature that can be added to any store.

### Component Integration

Components dispatch events for the board, and call mutations for the forms:

```typescript
export class TaskBoardComponent {
  readonly store = inject(TaskStore);
  readonly dispatch = injectDispatch(taskPageEvents);

  constructor() {
    this.dispatch.opened(); // Triggers task loading
  }

  moveTo(task: Task, status: TaskStatus) {
    this.dispatch.taskStatusChanged({
      id: task.id,
      status,
      previousStatus: task.status,
    });
  }
}
```

### Forms and the store

This follows the approach the NgRx team recommends for Signal Forms with
SignalStore ([ngrx/platform#5053](https://github.com/ngrx/platform/discussions/5053)),
with mutations for saving as described in
[Full-Cycle Reactivity in Angular](https://www.angulararchitects.io/en/blog/full-cycle-reativity-in-angular-signal-forms-signal-store-resources-mutation-api/).

**Saving: await a mutation.** `submit()` wants an action it can await, and a
mutation resolves to `{ status: 'success' | 'error' | 'aborted' }`. An error goes
straight onto the title field:

```typescript
async createTask(event: Event) {
  event.preventDefault();

  await submit(this.taskForm, async f => {
    const result = await this.store.createTask(f().value());

    if (result.status === 'error') {
      return {
        kind: 'server',
        message: errorMessage(result.error),
        fieldTree: f.title,
      };
    }

    this.taskForm().reset({ title: '', description: '' });
    return undefined;
  });
}
```

**Creating: local state.** A new task has nothing in the store to start from,
so the create form's model is a plain `signal` in the component.

**Editing: `linkedSignal` with `set`.** `form()` needs a writable signal, and
store state is read-only outside the store. A `linkedSignal` reads the draft
from the store, and its `set` option (Angular 22.1+) sends every write back to a
store method. The form never keeps its own copy:

```typescript
readonly edit = linkedSignal(() => this.store.taskEdit() ?? NO_EDIT, {
  set: edit => this.store.updateTaskEdit(edit),
});

readonly editForm = form(this.edit, path => {
  apply(path.title, taskTitleSchema);
});
```

Saving the edit is the `saveTaskEdit` mutation; on success the reducer applies
the change and closes the editor. Both forms share one title rule,
`taskTitleSchema`.

The draft methods (`startEditing`, `updateTaskEdit`, `stopEditing`) are plain
store methods rather than events: they fire on every keystroke and change
nothing but the draft, so an event each would bury the event log.

### Benefits of This Architecture

- **Predictable State Updates**: Every change to the tasks flows through the reducer
- **Separation of Concerns**: Effects handle side effects, reducers handle state
- **Testability**: Pure functions and isolated effects are easy to test
- **Debugging**: Event logs provide clear audit trail of state changes
- **Type Safety**: TypeScript ensures event payloads match expectations
- **Scalability**: Easy to add new events and handlers

## Project Structure

```text
src/
├── app/
│   ├── forms/
│   │   └── task-title.schema.ts # Title rule shared by both forms
│   ├── interfaces/          # TypeScript interfaces
│   │   └── task.ts         # Task, TaskStatus, drafts and board state
│   ├── mocks/              # Mock data for development
│   │   └── household-tasks.ts
│   ├── pages/              # Page components
│   │   └── task-board/
│   │       ├── task-board.component.ts   # Main UI component, provides the store
│   │       ├── task-board.component.html # Template
│   │       ├── task-board.component.scss # Styles
│   │       └── task-edit/                # In-place edit form for a task
│   ├── services/           # Angular services
│   │   └── task.service.ts # API service (currently using mocks)
│   └── stores/             # NgRx Signal stores
│       ├── shared/
│       │   └── with-event-logging.ts # Reusable event logging feature
│       └── task-store/
│           ├── task.events.ts       # Event definitions
│           ├── task.reducer.ts      # State update logic
│           ├── task.effects.ts      # Side effect handlers
│           ├── task.forms.ts        # Edit draft methods and mutations
│           ├── task.store.ts        # Store composition
│           └── task-store.config.ts # Initial state and shared feature input
```

### Logging System

The application includes comprehensive logging to visualize the complete event flow through the Flux architecture. Logs are strategically placed at each layer to show the unidirectional data flow.

#### Log Prefixes

```text
[Component] Dispatching: [event name]    - Event dispatched from UI component
[Event → Reducer] [description]          - Event being processed by reducer (synchronous)
[Component] Creating task                - Create form calling the mutation
[Event → Effect] [event group] [event]   - Event reaching effects (asynchronous)
[Service - Response] [description]       - API/Service responses
```

#### Execution Order

The logs reveal NgRx Signals' internal execution model:

1. **Component dispatches** - User action initiates the flow
2. **Reducers process first** - Synchronous state updates happen immediately
3. **Effects run after** - Asynchronous side effects (logging, API calls) execute
4. **Service responds** - External operations complete
5. **Success events flow** - Results trigger new reducer and effect cycles

The `withEventLogging` feature automatically:

- Logs all events from specified event groups using `Object.values()`
- Detects error events (containing "Failure") and logs with `console.error`
- Runs as an effect, so logs appear after reducers process events
- Requires no maintenance when new events are added

#### Example Event Flow

**Changing task status (optimistic update):**

```text
1. [Component] Dispatching: taskStatusChanged               (User clicks to move task)
   {id: '1', status: 'in-progress'}

2. [Event → Reducer] Task status changed (optimistic)       (State updated immediately)
   {taskId: '1', newStatus: 'in-progress'}

3. [Event → Effect] [Task Page] taskStatusChanged           (Event logger effect runs)
   {id: '1', status: 'in-progress'}

4. [Service - Response] Task status updated successfully     (API confirms change)

5. [Event → Effect] [Task API] taskStatusChangedSuccess     (Success event logged)
   {id: '1', status: 'in-progress'}
```

**Loading tasks:**

```text
1. [Component] Dispatching: opened                          (Page initializes)

2. [Event → Reducer] Page opened - setting isLoading: true  (Loading state set)

3. [Event → Effect] [Task Page] opened                      (Event logger)

4. [Service - Response] Tasks fetched                       (Service responds)
   {count: 7, totalPages: 1}

5. [Event → Reducer] Tasks loaded successfully              (State updated with tasks)
   {count: 7, totalPages: 1}

6. [Event → Effect] [Task API] tasksLoadedSuccess           (Success event logged)
```

This logging pattern makes it easy to trace the complete lifecycle of any user action through the system and understand the order of execution in the Flux architecture.

## Testing

The application uses Vitest for testing, with comprehensive test coverage for:

- Store initialization and state management
- Event reducers and state updates
- Effects and side effect handling
- Service operations (CRUD)
- Component integration
- Event dispatching flow

### Test Structure

**Store Tests** (`task.store.spec.ts`): The whole store against a stubbed service: loading, paging, the mutations, editing, deleting and rollback

**Reducer Tests** (`task.reducer.spec.ts`): Events in, state out, with no effects or service

**Effects Tests** (`task.effects.spec.ts`): Which API events each effect produces, including what happens to clicks that arrive mid-request

**Service Tests** (`task.service.spec.ts`): Test API operations and data transformations

**Component Tests**: The create form, the edit form's link to the store, and the board

### Running Tests

```bash
# Run all tests
pnpm test
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Build for production
pnpm build
```

## Mobile Support

The application is fully responsive with a mobile-first approach:

- Full-width columns on mobile devices
- Stacked layout for better mobile viewing
- Optimized touch targets
- Responsive typography

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
