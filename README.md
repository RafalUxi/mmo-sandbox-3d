# Monolit — Browser-Based 3D MMO

A real-time multiplayer 3D MMO that runs entirely in the browser. Explore a bioluminescent world, fight, trade, upgrade gear, and gamble your gold with no download required.

🎮 Live demo: https://mmo-sandbox-3d.vercel.app/

⚠️ The backend runs on a free tier that sleeps after inactivity, so the first load may take up to ~50 seconds to wake the server.
> The game UI is in Polish.

https://github.com/user-attachments/assets/393e85eb-4d70-4b93-803d-3075d36258e7

## About

Monolit is a solo-built portfolio project. It is a full-stack, real-time multiplayer game built from the ground up: 3D rendering and physics in the browser, an authoritative game server, persistent player data, and a full economy loop. The goal was to build something that genuinely works end to end, not just locally, and to solve the hard problems that come with real-time multiplayer and a server-authoritative economy.

## Features

- **Real-time multiplayer.** See other players move and interact live over WebSockets.
- **3D world in the browser.** Rendered with React Three Fiber, with real physics via Rapier.
- **Combat.** Hit detection against destructible targets.
- **Inventory and gear.** Collect, equip, and upgrade items.
- **Item upgrading.** Server-side RNG with success and fail mechanics.
- **Casino.** A gold-sink crash-style betting game with a built-in house edge.
- **Private chat.** Real-time messaging between players.
- **Authentication.** Secure registration and login using JWT and bcrypt.

## Tech Stack

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
- Frontend deployed on Vercel
- Backend deployed on Render
- Database hosted on Supabase

## Architecture

The project is split into three independently deployed parts. The browser renders the game and captures input. The Node server is authoritative and owns all game logic, randomness, and economy operations, so the client can never be trusted with outcomes. Real-time state such as movement, chat, and casino rounds flows over a persistent WebSocket connection, while regular data such as login, inventory, and shop actions uses a REST API. PostgreSQL stores players, stats, and inventory.

```mermaid
flowchart LR
    A["Browser<br/>React + React Three Fiber"]
    B["Game Server<br/>Node + Express + Socket.IO"]
    C["Database<br/>PostgreSQL / Supabase"]

    A -->|"REST (login, shop, inventory)"| B
    A <-->|"WebSocket (movement, chat, casino)"| B
    B -->|"SQL queries + transactions"| C
```

## Key Technical Decisions

**Server-authoritative economy.** All gold and item operations run on the server. The client only sends intent such as "place bet" or "buy item". The server validates it, generates any randomness with Node's `crypto` module, and writes the result. This prevents players from tampering with outcomes through the browser.

**Concurrency-safe transactions.** Operations on player gold and inventory use PostgreSQL transactions with row-level locking (`SELECT ... FOR UPDATE`). This prevents race conditions. For example, double-clicking "buy" or firing two requests at once cannot duplicate gold or items. Each mutation is atomic, so it either fully succeeds or rolls back.

**Casino house edge.** The crash game's outcome is drawn from a probability distribution tuned so the expected payout is below the stake. This makes the casino a controlled gold-sink for the economy rather than a way to print currency.

**JSON inventory as a conscious trade-off.** Inventory is stored as a JSON column rather than a normalized table. This kept iteration fast for a solo project, at the cost of not being able to query across items at the database level. It is a trade-off I would revisit for a larger-scale system.

## Running Locally

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
# create a .env file (see "Environment Variables" below)
npm run dev
```
The server runs on `http://localhost:5000`.

**3. Start the frontend** in a separate terminal.
```bash
cd mmo-sandbox-3d
npm install
# create a .env file (see "Environment Variables" below)
npm run dev
```
The app runs on `http://localhost:5173` (Vite's default).

**4. Open the game** at `http://localhost:5173` in your browser.

## Environment Variables

Each part needs its own `.env` file. The values below are examples.

## Environment Variables

**Backend** (`backend-sandbox/.env`)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=your_jwt_secret
COR

https://github.com/user-attachments/assets/b514b1f5-38a6-4943-acf1-efb3030a8f4c

S_ORIGIN=http://localhost:5173
```

**Frontend** (`mmo-sandbox-3d/.env`)
```bash
VITE_API_URL=http://localhost:5000
```

## Project Structure
```bash
mmo-sandbox-3d/
  backend-sandbox/      serwer Node + Express + Socket.IO
    config/             konfiguracja bazy i JWT
    middleware/         autoryzacja
    routes/             endpointy REST
  mmo-sandbox-3d/       frontend React + R3F
    models/             modele, animacje
    public/             assety
    componenets/        komponenty
    src/                komponenty, logika gry, assety
  shared/               wspólne typy TypeScript
```
 
## 📹 Dev-log — "Full Stack Logs"

I'm documenting the development of Monolit on YouTube.

| Security exploits | Inventory & upgrading | The casino |
|:---:|:---:|:---:|
| [![Chat hacking](https://img.youtube.com/vi/b6tOCxGQyQI/hqdefault.jpg)](https://www.youtube.com/watch?v=b6tOCxGQyQI) | [![Inventory](https://img.youtube.com/vi/HRYPWzRkmaQ/hqdefault.jpg)](https://www.youtube.com/watch?v=HRYPWzRkmaQ) | [![Casino](https://img.youtube.com/vi/vhM-AaIaUdg/hqdefault.jpg)](https://www.youtube.com/watch?v=vhM-AaIaUdg) |
