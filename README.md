# Real-Time Chat Application

A full-stack real-time chat application built with Node.js, React, WebSockets, and MySQL - containerized with Docker.

<img width="500" height="794" alt="image" src="https://github.com/user-attachments/assets/38166cdb-249b-4e23-8d4d-54fcbc8f6ed9" />

<img width="500" height="793" alt="image" src="https://github.com/user-attachments/assets/2e2fba8b-304e-4166-b57d-ff8597688284" />


## Features

- Real-time messaging using WebSockets — messages appear instantly with no page refresh
- Persistent message history stored in MySQL — messages survive server restarts
- User registration and login with JWT authentication and bcrypt password hashing
- Create and join multiple chat rooms
- Typing indicators — see when other users are typing in real time
- User presence indicator showing live connection status
- Fully containerized database with Docker

## Technologies

- **Node.js + Express** — REST API framework for auth and room management
- **ws** — WebSocket library for real-time bidirectional messaging
- **MySQL** — relational database for users, rooms, and messages
- **JWT + bcrypt** — authentication and password hashing
- **React** — frontend UI with hooks for WebSocket and state management
- **Docker** — containerized MySQL database

## Project Structure

- **backend/src/server.js** — Express app entry point, creates the HTTP server shared with WebSockets
- **backend/src/db.js** — MySQL connection pool using mysql2
- **backend/src/websocket.js** — WebSocket server handling auth, room joining, messaging, and typing indicators
- **backend/src/routes/auth.js** — Register and login endpoints with JWT token generation
- **backend/src/routes/rooms.js** — Endpoints to create and list chat rooms, protected by auth middleware
- **backend/docker-compose.yml** — Runs MySQL 8 in a Docker container with persistent volume storage
- **frontend/src/App.js** — Root component managing login state and routing between Auth and Chat views
- **frontend/src/components/Auth.js** — Login and registration form with error handling
- **frontend/src/components/Chat.js** — Main chat UI with sidebar, room list, message history, typing indicators, and WebSocket connection management

## Usage

```bash
# Clone the repo
git clone https://github.com/ZainaNadeem/real-time-chat-application.git
cd real-time-chat-application/chat-app
```

**Start the database:**
```bash
cd backend
docker compose up -d
```

**Start the backend:**
```bash
npm install
npm run dev
```

**Start the frontend** (in a new terminal):
```bash
cd frontend
npm install
npm start
```

- Frontend: http://localhost:3000
- API: http://localhost:5001

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register a new user |
| POST | /auth/login | Login and receive a JWT token |
| GET | /rooms | Get all chat rooms (auth required) |
| POST | /rooms | Create a new chat room (auth required) |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| auth | Client → Server | Authenticate with JWT token |
| join_room | Client → Server | Join a chat room and receive message history |
| send_message | Client → Server | Send a message to the current room |
| typing | Client → Server | Broadcast typing status to other users |
| auth_success | Server → Client | Confirms successful authentication |
| message_history | Server → Client | Last 50 messages on room join |
| new_message | Server → Client | A new message broadcast to the room |
| user_typing | Server → Client | Another user's typing status |
