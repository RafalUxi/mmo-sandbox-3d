# Monolit: browser-based 3D MMO

A multiplayer 3D MMO that runs in the browser. You explore a bioluminescent world, fight, trade, upgrade gear, and bet your gold in the casino. There is nothing to download.

Live demo: https://mmo-sandbox-3d.vercel.app/

> The backend runs on a free tier that sleeps after inactivity, so the first load can take up to about 50 seconds while the server wakes up.   
> The game UI is in Polish.

https://github.com/user-attachments/assets/393e85eb-4d70-4b93-803d-3075d36258e7

## About

Monolit is a portfolio project I built alone. It is a full-stack multiplayer game with 3D rendering and physics in the browser, an authoritative game server, persistent player data, and a working economy. I wanted it to run in production and not just on my machine, which is where the interesting problems showed up: keeping state in sync in real time, and building an economy the client cannot cheat.

## Features

- Real-time multiplayer over WebSockets. You see other players move and act live.
- A 3D world rendered with React Three Fiber, with physics from Rapier.
- Combat with hit detection against destructible targets.
- An inventory where you collect, equip and upgrade items.
- Item upgrading with server-side RNG, including failed attempts.
- A crash-style betting game with a house edge, which works as a gold sink.
- Private real-time chat between players.
- Registration and login with JWT and bcrypt.

## Tech stack

**Frontend**
- React and TypeScript
- React Three Fiber (Three.js) for 3D rendering
- Rapier for physics
- Tailwind CSS for styling
- Vite for build tooling

**Backend**
- Node.js and Express for the REST API
- Socket.IO for real-time WebSocket communication
- PostgreSQL (Supabase) for persistent data
- JWT and bcrypt for authentication

**Infrastructure**
- Frontend on Vercel
- Backend on Render
- Database on Supabase

## Architecture

The project is split into three parts that deploy independently. The browser renders the game and captures input. The Node server is authoritative and owns all game logic, randomness and economy operations, so the client can never be trusted with outcomes. Real-time state such as movement, chat and casino rounds flows over a persistent WebSocket connection, while regular data such as login, inventory and shop actions goes through the REST API. PostgreSQL stores players, stats and inventory.

```mermaid
flowchart LR
    A["Browser<br/>React + React Three Fiber"]
    B["Game Server<br/>Node + Express + Socket.IO"]
    C["Database<br/>PostgreSQL / Supabase"]

    A -->|"REST (login, shop, inventory)"| B
    A <-->|"WebSocket (movement, chat, casino)"| B
    B -->|"SQL queries + transactions"| C
```

## Key technical decisions

### Server-authoritative economy

All gold and item operations run on the server. The client only sends intent, such as "place bet" or "buy item". The server validates it, generates any randomness with Node's `crypto` module, and writes the result. Players cannot tamper with outcomes through the browser.

### Concurrency-safe transactions

Operations on player gold and inventory use PostgreSQL transactions with row-level locking (`SELECT ... FOR UPDATE`), which prevents race conditions. Double-clicking "buy" or firing two requests at once cannot duplicate gold or items. Each mutation is atomic, so it either fully succeeds or rolls back.

### Casino house edge

The crash game draws its outcome from a probability distribution tuned so the expected payout stays below the stake. That makes the casino a controlled gold sink for the economy instead of a way to print currency.

### JSON inventory as a conscious trade-off

Inventory is stored as a JSON column rather than a normalized table. This kept iteration fast for a solo project, at the cost of not being able to query across items at the database level. For a larger system I would do it differently.

## Running locally

**Prerequisites:** Node.js 20 or newer, and a PostgreSQL database

**1. Clone the repository.**
```bash
git clone https://github.com/RafalUxi/mmo-sandbox-3d.git
cd mmo-sandbox-3d
```

**2. Start the backend.**
```bash
cd backend-sandbox
npm install
# create a .env file (see "Environment variables" below)
npm run dev
```
The server runs on `http://localhost:5000`.

**3. Start the frontend** in a separate terminal.
```bash
cd mmo-sandbox-3d
npm install
# create a .env file (see "Environment variables" below)
npm run dev
```
The app runs on `http://localhost:5173`, which is Vite's default.

**4. Open the game** at `http://localhost:5173` in your browser.

## Environment variables

Each part needs its own `.env` file. The values below are examples.

**Backend** (`backend-sandbox/.env`)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`mmo-sandbox-3d/.env`)
```bash
VITE_API_URL=http://localhost:5000
```

## Project structure
```bash
mmo-sandbox-3d/
  backend-sandbox/      Node + Express + Socket.IO server
    config/             database and JWT config
    middleware/         authorization
    routes/             REST endpoints
  mmo-sandbox-3d/       React + R3F frontend
    models/             models and animations
    public/             assets
    componenets/        components
    src/                components, game logic, assets
  shared/               shared TypeScript types
```

## Dev-log: "Full Stack Logs"

I document the development of Monolit on YouTube.

| Security exploits | Inventory & upgrading | The casino |
|:---:|:---:|:---:|
| [![Chat hacking](https://img.youtube.com/vi/b6tOCxGQyQI/hqdefault.jpg)](https://www.youtube.com/watch?v=b6tOCxGQyQI) | [![Inventory](https://img.youtube.com/vi/HRYPWzRkmaQ/hqdefault.jpg)](https://www.youtube.com/watch?v=HRYPWzRkmaQ) | [![Casino](https://img.youtube.com/vi/vhM-AaIaUdg/hqdefault.jpg)](https://www.youtube.com/watch?v=vhM-AaIaUdg) |
