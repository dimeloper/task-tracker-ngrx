# TaskTrackerNgrx

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.12.

This project serves as a demonstration of NgRx Signal Store capabilities, showcasing how to implement state management using Angular's new signals-based approach. It provides a practical example of building a task tracking application with modern Angular state management patterns.

## Signal Store Implementation

This project demonstrates the use of NgRx Signal Store, a new state management solution that leverages Angular's signals for reactive state management. The implementation includes:

### Key Features

- **Signal-based State**: Utilizes Angular's signal system for fine-grained reactivity
- **Type-safe State Management**: Full TypeScript support with type inference
- **Computed Values**: Derived state using computed signals
- **State Updates**: Immutable state updates with built-in immutability helpers

### Store Structure

The application's state is organized into:

- **Tasks Store**: Manages the task list and task-related operations
- **UI Store**: Handles UI-specific state like loading states and filters

### Usage Example

```typescript
// Accessing store state
const tasks = inject(TasksStore).tasks;
const isLoading = inject(TasksStore).isLoading;

// Updating state
const store = inject(TasksStore);
store.addTask(newTask);
store.updateTask(taskId, updates);
store.deleteTask(taskId);
```

### Benefits

- **Performance**: Fine-grained updates with minimal re-renders
- **Developer Experience**: Simplified API compared to traditional NgRx
- **Bundle Size**: Smaller bundle size with no additional dependencies
- **Type Safety**: Full TypeScript integration with excellent type inference

## Prerequisites

- Node.js (managed by Volta)
- pnpm (managed by Volta)

## Project Setup

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

## Development Tools

### Volta

This project uses [Volta](https://volta.sh/) for managing Node.js and npm versions. The following versions are pinned:

- Node.js: v23.11.0
- pnpm: v10.9.2

Volta will automatically switch to these versions when you enter the project directory.

### Code Quality Tools

#### ESLint & Prettier

The project uses ESLint and Prettier for code formatting and linting. To run the linter:

```bash
pnpm lint
```

To format code:

```bash
pnpm format
```

To check formatting:

```bash
pnpm format:check
```

#### Husky & lint-staged

The project uses Husky and lint-staged to enforce code quality on commit. The following checks run automatically on staged files before each commit:

- ESLint and Prettier on JavaScript/TypeScript files
- Prettier on HTML, CSS, and SCSS files
- Prettier on JSON and Markdown files

## Development server

To start a local development server, run:

```bash
pnpm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

This project uses Vitest for unit testing. To run the tests:

```bash
pnpm test
```

To run tests in watch mode (useful during development):

```bash
pnpm test:watch
```

To generate a coverage report:

```bash
pnpm test:coverage
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
