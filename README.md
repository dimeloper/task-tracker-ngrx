# Task Tracker with NgRx Signals

A modern task management application built with Angular and NgRx Signals, demonstrating state management best practices and reactive programming patterns.

## Features

- 📋 Task management with three states: Todo, In Progress, and Done
- 🔄 Real-time state updates using NgRx Signals
- 🧪 Comprehensive test coverage with Vitest
- 📊 Detailed logging for debugging and monitoring

## Tech Stack

- Angular 19+
- NgRx Signals for state management
- RxJS for reactive programming
- Vitest for testing
- SCSS for styling
- pnpm for package management

## Project Structure

```
src/
├── app/
│   ├── components/     # Reusable UI components
│   ├── interfaces/     # TypeScript interfaces
│   ├── mocks/         # Mock data for development
│   ├── pages/         # Page components
│   ├── services/      # Angular services
│   └── stores/        # NgRx Signal stores
```

## State Management

The application uses NgRx Signals for state management, providing a reactive and efficient way to handle application state. The main store (`TaskStore`) includes:

- State management with `withState`
- Entity management with `withEntities`
- Computed selectors with `withComputed`
- Action methods with `withMethods`

### Store Features

- Task CRUD operations
- Pagination support
- Status updates
- Loading state management
- Error handling

### Logging System

The application includes a comprehensive logging system to track state changes and operations:

```
[Store - Init]     - Store initialization
[Store - Setup]    - Store setup and configuration
[Store - Selector] - Computed selector updates
[Store - Update]   - State updates
[Store - Action]   - Action dispatches
[Store - Warning]  - Warning messages
[Store - Error]    - Error messages

[Service - Request]  - Service method calls
[Service - Response] - Service responses
```

## Testing

The application uses Vitest for testing, with comprehensive test coverage for:

- Store functionality
- Service operations
- Component behavior
- State management
- Error handling

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
