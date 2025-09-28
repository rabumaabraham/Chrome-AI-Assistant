# Architecture Documentation

## Overview

The Chrome AI Assistant is built with a clean, modular architecture that separates concerns and promotes maintainability, scalability, and testability.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome        │    │   Backend       │    │   OpenRouter    │
│   Extension     │◄──►│   API Server    │◄──►│   AI Service    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   DOM Content   │    │   OCR Service   │
│   Extraction    │    │   (Tesseract)   │
└─────────────────┘    └─────────────────┘
```

## Backend Architecture

### Core Components

#### 1. Application Layer (`src/app.js`)
- Express application setup and configuration
- Middleware initialization
- Route registration
- Error handling setup

#### 2. Server Layer (`src/server.js`)
- Server startup and shutdown
- Process management
- Health monitoring
- Graceful shutdown handling

#### 3. Configuration Layer (`src/config/`)
- Centralized configuration management
- Environment variable handling
- Validation and defaults
- Service-specific settings

#### 4. Service Layer (`src/services/`)
- **AIService**: OpenRouter integration and AI operations
- **OCRService**: Image text extraction using Tesseract.js
- **PDFService**: PDF text extraction using pdf-parse
- **Logger**: Centralized logging with Winston

#### 5. Controller Layer (`src/controllers/`)
- Request/response handling
- Input validation
- Business logic orchestration
- Error handling

#### 6. Middleware Layer (`src/middleware/`)
- **Security**: CORS, rate limiting, helmet
- **Validation**: Request validation and sanitization
- **Authentication**: API key authentication
- **Logging**: Request/response logging

#### 7. Route Layer (`src/routes/`)
- API endpoint definitions
- Route-specific middleware
- Request routing and handling

### Data Flow

```
Request → Middleware → Controller → Service → External API
    ↓
Response ← Middleware ← Controller ← Service ← External API
```

## Frontend Architecture

### Core Components

#### 1. Core Layer (`src/core/`)
- **Config**: Configuration management
- **Logger**: Centralized logging
- **AIAssistant**: Main orchestrator class

#### 2. Service Layer (`src/services/`)
- **APIService**: Backend communication
- **StorageService**: Chrome storage operations
- **DOMService**: Content extraction
- **VoiceService**: Speech recognition

#### 3. UI Layer (`src/popup/`)
- **PopupController**: Popup UI management
- **Event handling**: User interactions
- **State management**: UI state coordination

#### 4. Content Layer (`src/content/`)
- **ContentController**: Content script functionality
- **DOM manipulation**: Page interaction
- **Message handling**: Communication with popup

#### 5. Background Layer (`src/background/`)
- **BackgroundController**: Service worker operations
- **Context menus**: Right-click menu integration
- **Message routing**: Inter-script communication

### Component Communication

```
Background Script ←→ Content Script ←→ Popup Script
       ↓                    ↓                ↓
   Chrome APIs         DOM Access      User Interface
```

## Design Patterns

### 1. Singleton Pattern
- **Services**: All services are singleton instances
- **Configuration**: Centralized configuration access
- **Logging**: Unified logging interface

### 2. Service Layer Pattern
- **Separation of Concerns**: Business logic in services
- **Reusability**: Services can be used across controllers
- **Testability**: Services can be unit tested independently

### 3. Observer Pattern
- **Event Handling**: UI event management
- **State Changes**: Reactive state updates
- **Message Passing**: Inter-component communication

### 4. Factory Pattern
- **Service Creation**: Service instantiation
- **Configuration**: Dynamic configuration creation
- **Validation**: Request validation schemas

## Security Architecture

### 1. Input Validation
- **Request Validation**: Comprehensive input validation
- **Sanitization**: Data sanitization and cleaning
- **Type Checking**: Runtime type validation

### 2. Authentication & Authorization
- **API Key Authentication**: Optional API key validation
- **Rate Limiting**: Request rate limiting
- **CORS Protection**: Cross-origin request protection

### 3. Error Handling
- **Secure Error Messages**: No sensitive data in errors
- **Error Logging**: Comprehensive error tracking
- **Graceful Degradation**: Fallback mechanisms

## Scalability Considerations

### 1. Horizontal Scaling
- **Stateless Design**: No server-side session storage
- **Load Balancing**: Multiple server instances
- **Database Independence**: No database dependencies

### 2. Performance Optimization
- **Caching**: Response caching mechanisms
- **Connection Pooling**: Efficient resource usage
- **Async Operations**: Non-blocking I/O operations

### 3. Monitoring & Observability
- **Structured Logging**: JSON-formatted logs
- **Health Checks**: Service health monitoring
- **Metrics Collection**: Performance metrics

## Extension Architecture

### 1. Manifest V3 Compliance
- **Service Worker**: Background script as service worker
- **Content Security Policy**: Secure content policies
- **Permissions**: Minimal required permissions

### 2. Module System
- **ES6 Modules**: Modern JavaScript module system
- **Import/Export**: Clean dependency management
- **Tree Shaking**: Optimized bundle sizes

### 3. Communication Patterns
- **Message Passing**: Chrome runtime messaging
- **Event-Driven**: Event-based architecture
- **Async Communication**: Promise-based operations

## Data Flow Architecture

### 1. User Interaction Flow
```
User Action → UI Event → Controller → Service → API → Response
```

### 2. Content Extraction Flow
```
Page Load → Content Script → DOM Analysis → Data Extraction → Storage
```

### 3. AI Processing Flow
```
Question → Context Building → API Call → AI Processing → Response
```

## Error Handling Architecture

### 1. Error Types
- **Validation Errors**: Input validation failures
- **Service Errors**: External service failures
- **Network Errors**: Connectivity issues
- **System Errors**: Internal system failures

### 2. Error Propagation
- **Service Layer**: Error creation and logging
- **Controller Layer**: Error handling and response
- **Middleware Layer**: Global error handling
- **UI Layer**: User-friendly error messages

### 3. Recovery Mechanisms
- **Retry Logic**: Automatic retry for transient failures
- **Fallback Options**: Alternative processing methods
- **Graceful Degradation**: Reduced functionality on errors

## Testing Architecture

### 1. Unit Testing
- **Service Tests**: Individual service testing
- **Controller Tests**: Request/response testing
- **Utility Tests**: Helper function testing

### 2. Integration Testing
- **API Tests**: End-to-end API testing
- **Extension Tests**: Chrome extension testing
- **Service Integration**: Cross-service testing

### 3. End-to-End Testing
- **User Workflows**: Complete user journey testing
- **Browser Testing**: Cross-browser compatibility
- **Performance Testing**: Load and stress testing

## Deployment Architecture

### 1. Development Environment
- **Local Development**: Local server and extension
- **Hot Reloading**: Development server with hot reload
- **Debug Logging**: Verbose logging for debugging

### 2. Production Environment
- **Container Deployment**: Docker containerization
- **Reverse Proxy**: Nginx/Apache reverse proxy
- **SSL Termination**: HTTPS certificate handling
- **Monitoring**: Production monitoring and alerting

### 3. Extension Distribution
- **Chrome Web Store**: Official extension distribution
- **Version Management**: Semantic versioning
- **Update Mechanism**: Automatic update handling

## Future Enhancements

### 1. Microservices Architecture
- **Service Decomposition**: Break down into microservices
- **API Gateway**: Centralized API management
- **Service Discovery**: Dynamic service discovery

### 2. Advanced AI Features
- **Multi-Model Support**: Support for multiple AI models
- **Custom Models**: User-defined model configurations
- **Batch Processing**: Bulk processing capabilities

### 3. Enhanced Security
- **OAuth Integration**: Third-party authentication
- **Encryption**: End-to-end encryption
- **Audit Logging**: Comprehensive audit trails
