# Task Tracker with NgRx Signals

A modern task management application built with Angular and NgRx Signals Events, demonstrating event-driven state management using the Flux architecture pattern.

## Features

- Task management with three states: Todo, In Progress, and Done
- Event-driven architecture using NgRx Signals Events
- Unidirectional data flow following Flux principles
- Comprehensive test coverage with Vitest
- Detailed logging for debugging and monitoring

## Tech Stack

- Angular 20+
- NgRx Signals with Events plugin for state management
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
- `taskCreated`: User creates a new task
- `taskDeleted`: User deletes a task
- `taskStatusChanged`: User moves a task between columns
- `pageChanged`: User navigates to a different page

**API Events** (`taskApiEvents`): Results from API operations

- `tasksLoadedSuccess/Failure`: Task list fetch results
- `taskCreatedSuccess/Failure`: Task creation results
- `taskDeletedSuccess/Failure`: Task deletion results
- `taskStatusChangedSuccess/Failure`: Status update results

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

The store is composed using feature functions:

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

**withTaskEffects**: Side effect handlers for asynchronous operations

```typescript
loadTasks$: events
  .on(taskPageEvents.opened)
  .pipe(
    exhaustMap(() =>
      taskService
        .getTasks(1, 10)
        .pipe(
          concatMap(response =>
            of(taskApiEvents.tasksLoadedSuccess(response.tasks))
          )
        )
    )
  );
```

**withComputed**: Derived state based on entities

```typescript
tasksTodo: computed(() =>
  store.taskEntities().filter(t => t.status === TaskStatus.TODO)
);
```

**withEventLogging**: Reusable feature for logging all events (for debugging)

```typescript
withEventLogging([taskPageEvents, taskApiEvents]);
```

This feature automatically logs all events from the specified event groups, using `Object.values()` to include all events without manual enumeration. It's a composable feature that can be added to any store.

### Component Integration

Components use `injectDispatch` to dispatch events without directly calling store methods:

```typescript
export class TaskBoardComponent {
  readonly dispatch = injectDispatch(taskPageEvents);

  constructor() {
    this.dispatch.opened(); // Triggers task loading
  }

  createTask() {
    this.dispatch.taskCreated(newTask); // Dispatches creation event
  }
}
```

### Benefits of This Architecture

- **Predictable State Updates**: All state changes flow through reducers
- **Separation of Concerns**: Effects handle side effects, reducers handle state
- **Testability**: Pure functions and isolated effects are easy to test
- **Debugging**: Event logs provide clear audit trail of state changes
- **Type Safety**: TypeScript ensures event payloads match expectations
- **Scalability**: Easy to add new events and handlers

## Project Structure

```text
src/
├── app/
│   ├── interfaces/          # TypeScript interfaces
│   │   └── task.ts         # Task and TaskStatus definitions
│   ├── mocks/              # Mock data for development
│   │   └── household-tasks.ts
│   ├── pages/              # Page components
│   │   └── task-board/
│   │       ├── task-board.component.ts   # Main UI component
│   │       ├── task-board.component.html # Template
│   │       └── task-board.component.scss # Styles
│   ├── services/           # Angular services
│   │   └── task.service.ts # API service (currently using mocks)
│   └── stores/             # NgRx Signal stores
│       ├── shared/
│       │   └── with-event-logging.ts # Reusable event logging feature
│       └── task-store/
│           ├── task.events.ts       # Event definitions
│           ├── task.reducer.ts      # State update logic
│           ├── task.effects.ts      # Side effect handlers
│           ├── task.store.ts        # Store composition
│           └── task-store.config.ts # Initial state configuration
```

### Logging System

The application includes comprehensive logging to visualize the complete event flow through the Flux architecture. Event logging is implemented as a reusable store feature (`withEventLogging`) that can be composed into any store.

#### Log Prefixes

```text
[Service - Request]  - Outgoing API calls
[Service - Response] - API responses

[Store Event] [event group] [event name] - All events flowing through the store
[Task Store] Response from getTasks      - Raw service response (in effects)
[Task Store] Dispatching [event name]    - Event being dispatched (in effects)
```

The `withEventLogging` feature automatically:

- Logs all events from specified event groups using `Object.values()`
- Detects error events (containing "Failure") and logs with `console.error`
- Requires no maintenance when new events are added

#### Example Event Flow

**Loading tasks:**

```text
1. [Store Event] [Task Page] opened                          (User action)
2. [Service - Request] Fetching tasks                        (Effect triggers API)
3. [Service - Response] Tasks fetched                        (API responds)
4. [Task Store] Dispatching tasksLoadedSuccess               (Effect dispatches result)
5. [Store Event] [Task API] tasksLoadedSuccess               (Event logged)
```

**Creating a task:**

```text
1. [Store Event] [Task Page] taskCreated                     (User action)
2. [Service - Request] Creating task                         (Effect triggers API)
3. [Service - Response] Task created                         (API responds)
4. [Store Event] [Task API] taskCreatedSuccess               (Result event)
```

This logging pattern makes it easy to trace the complete lifecycle of any user action through the system.

## Testing

The application uses Vitest for testing, with comprehensive test coverage for:

- Store initialization and state management
- Event reducers and state updates
- Effects and side effect handling
- Service operations (CRUD)
- Component integration
- Event dispatching flow

### Test Structure

**Store Tests** (`task.store.spec.ts`): Verify store initialization, signals, and computed values

**Reducer Tests** (`task.reducer.spec.ts`): Test pure state update functions

**Effects Tests** (`task.effects.spec.ts`): Test asynchronous operations and event dispatching

**Service Tests** (`task.service.spec.ts`): Test API operations and data transformations

**Component Tests**: Test UI behavior and event dispatching

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
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
