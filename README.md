# Todo Challenge — Backend

REST API built with **Node.js**, **Express**, and **Firebase** following Hexagonal Architecture (Ports and Adapters). Deployed as a Firebase Cloud Function.

---

## Table of Contents

1. [Architecture Decision Justification](#architecture-decision-justification)
2. [Technology Decisions](#technology-decisions)
3. [Project Structure](#project-structure)
4. [Responsibilities: Repositories and Use Cases](#responsibilities-repositories-and-use-cases)
5. [API Endpoints](#api-endpoints)
6. [Environment Variables](#environment-variables)
7. [Getting Started](#getting-started)
8. [Running Tests](#running-tests)

---

## Architecture Decision Justification

### Hexagonal Architecture (Ports and Adapters)

Hexagonal Architecture was chosen as the structural foundation of this backend for the following technical reasons:

**Maintainability**
Business logic is isolated in the domain and application layers, completely decoupled from HTTP handlers, database drivers, or third-party SDKs. Changes to one layer do not cascade into others. Adding a new feature requires touching only the relevant use case and, if needed, extending a repository interface — without modifying controllers or infrastructure code.

**Separation of Concerns**
Each layer has a single, well-defined responsibility:
- The *domain* layer defines entities and repository contracts (interfaces).
- The *application* layer orchestrates business workflows through use cases.
- The *infrastructure* layer provides concrete implementations (Firestore, Firebase Auth REST API).
- The *presentation* layer handles HTTP request/response translation.

No layer reaches across its boundary. Controllers never talk to Firestore directly; use cases never import Express.

**Testability**
Because use cases and controllers depend only on interfaces (ports), every dependency can be replaced with a Jest mock. All 103 unit tests in this project inject mock repositories — zero network calls, zero Firebase SDK calls, zero filesystem access. This makes the test suite fast, deterministic, and maintainable.

**Independence from Frameworks and Infrastructure**
The business rules in `application/use-cases/` import no Express, no Firebase Admin SDK, and no external packages. If the HTTP framework were replaced (e.g., Fastify instead of Express), only the presentation layer would need to change. If the database were replaced (e.g., PostgreSQL instead of Firestore), only the infrastructure repositories would change — interfaces and use cases remain untouched.

**Scalability of the Codebase**
New features follow a predictable pattern: add an entity or extend an interface in the domain, implement a use case in the application layer, add a repository method in infrastructure, and wire a controller in the presentation layer. This makes the codebase easy to scale with a growing team without conflicts or ambiguity about where code belongs.

**Easier Replacement of External Services**
All third-party integrations implement a domain interface. `FirebaseAuthRepository` implements `IAuthRepository`; `FirestoreTaskRepository` implements `ITaskRepository`. Swapping Firebase Auth for Auth0 or Firestore for MongoDB only requires a new class that satisfies the same interface — no business logic is affected.

---

## Technology Decisions

### Firestore

Firestore was selected as the primary database for the following reasons:

- **Serverless infrastructure**: Firestore runs fully managed with no provisioning, patching, or scaling configuration required. This aligns perfectly with the Cloud Functions deployment model where the backend itself is serverless.
- **Automatic scalability**: Firestore scales horizontally and handles concurrent reads/writes without manual sharding or connection pooling — critical when the function may have cold starts or burst traffic.
- **NoSQL flexibility**: Task documents have optional fields (`description`, `priority`) that can evolve over time without schema migrations. NoSQL document storage makes this additive evolution zero-cost.
- **Firebase ecosystem integration**: The Firebase Admin SDK provides a unified authentication + database surface. Verifying a Firebase Auth token and querying Firestore use the same initialized `admin` instance, reducing configuration overhead and keeping the infrastructure layer cohesive.
- **Real-time capability**: Although not used in the current REST API, Firestore's built-in real-time listeners provide a clear upgrade path to WebSocket-based features without changing the data model.

### Firebase Authentication

Firebase Authentication was selected to handle user identity for the following reasons:

- **Security by default**: Token signing, rotation, expiry, and revocation are handled by Google's infrastructure. The backend never stores or compares passwords directly — it only verifies signed JWTs issued by Firebase Auth.
- **REST API token issuance**: The Firebase Auth REST API (`identitytoolkit.googleapis.com`) allows the backend to authenticate users with email/password and return a signed `idToken` directly, so the frontend never needs to embed the Firebase client SDK for auth flows.
- **Stateless token verification**: `firebaseAuth.verifyIdToken()` validates the JWT signature against Google's public keys. This is stateless, fast, and does not require a database lookup per request.
- **Scalability**: Token verification is a local cryptographic operation. It adds no latency to request handling and does not create a bottleneck at scale.
- **Unified user management**: Firebase Auth provides a single source of truth for user identity linked to the same Firebase project as Firestore, ensuring `uid` values are consistent across both services without a separate user synchronisation layer.

---

## Project Structure

```
src/
├── index.ts                          # Entry point — Express app + Cloud Function export
├── application/
│   └── use-cases/
│       ├── create-task.use-case.ts
│       ├── create-user.use-case.ts
│       ├── delete-task.use-case.ts
│       ├── get-tasks.use-case.ts
│       ├── login-user.use-case.ts
│       └── update-task.use-case.ts
├── domain/
│   ├── entities/
│   │   ├── task.entity.ts
│   │   └── user.entity.ts
│   └── repositories/
│       ├── auth.repository.interface.ts
│       ├── task.repository.interface.ts
│       └── user.repository.interface.ts
├── infrastructure/
│   ├── firebase/
│   │   └── firebase.config.ts
│   └── repositories/
│       ├── firebase-auth.repository.ts
│       ├── firestore-task.repository.ts
│       └── firestore-user.repository.ts
├── presentation/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── task.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   └── routes/
│       ├── auth.routes.ts
│       └── task.routes.ts
└── types/
    └── express.d.ts
```

---

## Responsibilities: Repositories and Use Cases

### Domain Interfaces (Ports)

| Interface | Responsibility |
|-----------|----------------|
| `IAuthRepository` | Contract for verifying tokens, signing in, and registering users |
| `ITaskRepository` | Contract for CRUD operations on task documents |
| `IUserRepository` | Contract for creating and retrieving user profile documents |

### Infrastructure Repositories (Adapters)

| Class | Responsibility |
|-------|----------------|
| `FirebaseAuthRepository` | Verifies Firebase JWTs using Admin SDK; issues tokens via Firebase Auth REST API |
| `FirestoreTaskRepository` | Reads and writes task documents in the Firestore `tasks` collection; enforces userId ownership on all mutations |
| `FirestoreUserRepository` | Creates and retrieves user profile documents in the Firestore `users` collection |

### Application Use Cases

| Use Case | Responsibility |
|----------|----------------|
| `LoginUserUseCase` | Delegates email/password authentication to `IAuthRepository.signIn` and returns the resulting token |
| `CreateUserUseCase` | Registers a new user in Firebase Auth then persists a profile document via `IUserRepository` |
| `GetTasksUseCase` | Retrieves all tasks belonging to the authenticated user |
| `CreateTaskUseCase` | Validates and normalises task input (trims strings, applies defaults) then persists via `ITaskRepository` |
| `UpdateTaskUseCase` | Delegates a partial task update to `ITaskRepository`, enforcing ownership |
| `DeleteTaskUseCase` | Delegates task deletion to `ITaskRepository`, enforcing ownership |

### Middlewares

| Middleware | Responsibility |
|------------|----------------|
| `authMiddleware` | Extracts the Bearer token from `Authorization` header, verifies it via `FirebaseAuthRepository.verifyToken`, and attaches `req.user` |
| `validateLogin` | Validates that `email` is a well-formed address and `password` is present |
| `validateRegister` | Validates that `email` is a well-formed address and `password` is at least 6 characters |
| `validateCreateTask` | Validates that `title` is present and non-empty |
| `validateUpdateTask` | Validates that `status` and `priority`, if provided, are within their allowed value sets |

---

## API Endpoints

Base URL (local): `http://localhost:3000`  
Base URL (production): `https://us-central1-<project-id>.cloudfunctions.net/api`

---

### Authentication

#### `POST /auth/login`

Authenticates an existing user with email and password.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | ✅ | Valid email address |
| `password` | `string` | ✅ | User password |

**Request Example**
```json
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "mypassword123"
}
```

**Success Response** `200 OK`
```json
{
  "uid": "abc123uid",
  "email": "user@example.com",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Missing or invalid email / missing password | `{ "message": "El campo \"email\" debe ser un correo válido" }` |
| `401` | Wrong credentials | `{ "error": { "message": "INVALID_LOGIN_CREDENTIALS" } }` |
| `401` | Email not found | `{ "error": { "message": "EMAIL_NOT_FOUND" } }` |
| `500` | Unexpected server error | `{ "error": { "message": "INTERNAL_ERROR" } }` |

---

#### `POST /auth/register`

Creates a new user account with email and password.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | ✅ | Valid email address |
| `password` | `string` | ✅ | Password — minimum 6 characters |

**Request Example**
```json
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure123"
}
```

**Success Response** `201 Created`
```json
{
  "uid": "xyz789uid",
  "email": "newuser@example.com",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Invalid email format | `{ "message": "El campo \"email\" debe ser un correo válido" }` |
| `400` | Password shorter than 6 characters | `{ "message": "El campo \"password\" debe tener al menos 6 caracteres" }` |
| `409` | Email already registered | `{ "message": "El correo ya está registrado" }` |
| `500` | Unexpected server error | `{ "message": "Error al crear el usuario" }` |

---

### Tasks

All task endpoints require a valid Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <idToken>
```

---

#### `GET /tasks`

Returns all tasks belonging to the authenticated user, sorted by creation date descending.

**Request Example**
```
GET /tasks
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** `200 OK`
```json
[
  {
    "id": "taskDocId1",
    "userId": "abc123uid",
    "title": "Implement login feature",
    "description": "Add email/password login flow",
    "priority": "Alta",
    "status": "inProgress",
    "createdAt": "2024-06-01T10:00:00.000Z",
    "completed": false
  },
  {
    "id": "taskDocId2",
    "userId": "abc123uid",
    "title": "Write unit tests",
    "description": "",
    "priority": "Media",
    "status": "todo",
    "createdAt": "2024-05-30T08:00:00.000Z",
    "completed": false
  }
]
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| `401` | Missing or invalid token | `{ "message": "Unauthorized: missing or malformed token" }` |
| `500` | Unexpected server error | `{ "message": "Error al obtener tareas" }` |

---

#### `POST /tasks`

Creates a new task for the authenticated user.

**Request Body**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | `string` | ✅ | — | Task title (non-empty) |
| `description` | `string` | ❌ | `""` | Optional task description |
| `priority` | `"Baja" \| "Media" \| "Alta"` | ❌ | `"Media"` | Task priority |
| `status` | `"todo" \| "inProgress" \| "done"` | ❌ | `"todo"` | Task status |

**Request Example**
```json
POST /tasks
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Deploy to production",
  "description": "Run firebase deploy",
  "priority": "Alta",
  "status": "todo"
}
```

**Success Response** `201 Created`
```json
{
  "id": "newTaskDocId",
  "userId": "abc123uid",
  "title": "Deploy to production",
  "description": "Run firebase deploy",
  "priority": "Alta",
  "status": "todo",
  "createdAt": "2024-06-15T14:30:00.000Z",
  "completed": false
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Missing or empty `title` | `{ "message": "El campo \"title\" es obligatorio" }` |
| `401` | Missing or invalid token | `{ "message": "Unauthorized: missing or malformed token" }` |
| `500` | Unexpected server error | `{ "message": "Error al crear tarea" }` |

---

#### `PATCH /tasks/:id`

Partially updates an existing task. Only fields provided in the request body are updated. The task must belong to the authenticated user.

**URL Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Firestore document ID of the task |

**Request Body** (all fields optional)

| Field | Type | Allowed Values |
|-------|------|----------------|
| `title` | `string` | Any non-empty string |
| `description` | `string` | Any string |
| `priority` | `string` | `"Baja"`, `"Media"`, `"Alta"` |
| `status` | `string` | `"todo"`, `"inProgress"`, `"done"` |
| `completed` | `boolean` | `true`, `false` |

**Request Example**
```json
PATCH /tasks/newTaskDocId
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "inProgress",
  "completed": false
}
```

**Success Response** `200 OK`
```json
{
  "id": "newTaskDocId",
  "userId": "abc123uid",
  "title": "Deploy to production",
  "description": "Run firebase deploy",
  "priority": "Alta",
  "status": "inProgress",
  "createdAt": "2024-06-15T14:30:00.000Z",
  "completed": false
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Invalid `status` value | `{ "message": "status debe ser: todo \| inProgress \| done" }` |
| `400` | Invalid `priority` value | `{ "message": "priority debe ser: Baja \| Media \| Alta" }` |
| `401` | Missing or invalid token | `{ "message": "Unauthorized: missing or malformed token" }` |
| `404` | Task not found or not owned by user | `{ "message": "Task not found or unauthorized" }` |
| `500` | Unexpected server error | `{ "message": "Error al actualizar tarea" }` |

---

#### `DELETE /tasks/:id`

Deletes a task. The task must belong to the authenticated user.

**URL Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Firestore document ID of the task |

**Request Example**
```
DELETE /tasks/newTaskDocId
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** `204 No Content` *(empty body)*

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| `401` | Missing or invalid token | `{ "message": "Unauthorized: missing or malformed token" }` |
| `404` | Task not found or not owned by user | `{ "message": "Task not found or unauthorized" }` |
| `500` | Unexpected server error | `{ "message": "Error al eliminar tarea" }` |

---

#### `GET /health`

Health check endpoint. No authentication required.

**Response** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-06-15T14:30:00.000Z"
}
```

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `FB_API_KEY` | ✅ | Firebase Web API Key — found in Firebase Console → Project Settings → General → Web API Key |
| `CORS_ORIGIN` | ❌ | Allowed CORS origin. Defaults to `http://localhost:4200` in development |

**Firebase Admin credentials** (choose one):

| Method | Description |
|--------|-------------|
| `serviceAccountKey.json` in project root | Download from Firebase Console → Project Settings → Service Accounts → Generate new private key. Recommended for local development. |
| `GOOGLE_APPLICATION_CREDENTIALS` env var | Set to the path of your service account JSON file |
| Application Default Credentials | Automatically used when deployed to Google Cloud / Firebase Functions |

**Example `.env`**
```env
FB_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
CORS_ORIGIN=http://localhost:4200
```

> **Security note**: Never commit `.env` or `serviceAccountKey.json` to version control. Both are listed in `.gitignore`.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- A Firebase project with Firestore and Authentication enabled

### Install Dependencies

```bash
npm install
```

### Run Locally (Development Mode)

```bash
npm run dev
```

The server starts at `http://localhost:3000`. File changes are watched and the server restarts automatically via `ts-node-dev`.

### Build for Production

```bash
npm run build
```

Compiles TypeScript to `dist/`.

### Deploy to Firebase Functions

```bash
npm run deploy
```

Builds the project then deploys the `api` Cloud Function to `us-central1`.

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run with Coverage Report

```bash
npm run test:coverage
```

**Coverage thresholds** (enforced by Jest):

| Metric | Threshold |
|--------|-----------|
| Statements | 90% |
| Functions | 90% |
| Lines | 90% |
| Branches | 80% |

Current results: **103 tests — 13 suites — 100% functions, 96.7% branches**.

Tests are fully isolated — no real Firebase or network calls are made. All infrastructure dependencies are mocked.

---

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server with hot reload on port 3000 |
| `build` | `npm run build` | Compile TypeScript to `dist/` |
| `start` | `npm start` | Run compiled output (production) |
| `test` | `npm test` | Run all unit tests |
| `test:coverage` | `npm run test:coverage` | Run tests with coverage report |
| `deploy` | `npm run deploy` | Build and deploy to Firebase Functions |
