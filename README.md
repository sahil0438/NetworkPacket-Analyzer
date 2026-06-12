# 🌐 Network Packet Analyzer

A Wireshark-inspired **Network Packet Analyzer** web application built with **React + Vite** on the frontend and a **Python Flask + WebSocket** backend. Capture and analyze live network packets in real time through an interactive browser-based UI.

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the App](#running-the-app)
- [Build for Production](#build-for-production)
- [Credits](#credits)

---

## About

This project is a browser-based network packet analyzer inspired by Wireshark. The Python Flask backend performs live packet sniffing on your network interface (e.g. Wi-Fi) and streams packet data to the frontend in real time via **WebSockets**. The React frontend visualizes the captured packets with charts, filters, and an interactive table.

---

## Features

- 📡 **Live packet sniffing** on your Wi-Fi / network interface
- 🔌 **Real-time streaming** via WebSocket (`ws://localhost:5000/ws`)
- 📊 **Traffic charts** using Recharts and Chart.js
- 🔍 **Packet filtering** by protocol, IP, port, etc.
- 📁 **Export packet data** (via file-saver)
- 🌙 **Dark-themed UI** inspired by Wireshark
- ⚡ **Fast frontend** powered by Vite 6 + React 18
- 🐍 **Python Flask backend** for low-level packet capture

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 6 | Build tool and dev server (port 3000) |
| Tailwind CSS 3 | Styling |
| Recharts | Traffic/protocol charts |
| Chart.js | Additional data visualizations |
| Lucide React | Icons |
| file-saver | Export packet data to file |

### Backend
| Technology | Purpose |
|---|---|
| Python | Backend runtime |
| Flask | Web server (port 5000) |
| Flask-SocketIO / WebSocket | Real-time packet streaming |
| Scapy / PyShark | Live packet sniffing |
| venv | Python virtual environment |

---

## Project Structure

```
packet-analyzer/
│
├── src/                        # React frontend source
│   ├── main.jsx                # App entry point
│   └── (components, pages...)
│
├── backend/                    # Python Flask backend
│   └── server.py               # Main server — Flask + WebSocket
│
├── venv/                       # Python virtual environment (not committed)
├── node_modules/               # Node dependencies (not committed)
│
├── index.html                  # HTML entry point
├── vite.config.js              # Vite config (port 3000)
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
├── package.json                # Node dependencies & scripts
├── package-lock.json           # Lockfile
└── README.md
```

---

## Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher — [Download](https://nodejs.org)
- **Python** 3.8 or higher — [Download](https://python.org)
- **npm** (comes with Node.js)
- ⚠️ **Administrator privileges** are required for live packet sniffing

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/packet-analyzer.git
cd packet-analyzer
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Set up the Python backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (macOS/Linux)
source venv/bin/activate

cd ..
```

---

## Running the App

> ⚠️ You need **two separate terminals** — one for the backend, one for the frontend.

### Terminal 1 — Start the Backend (as Administrator)

Open **Command Prompt as Administrator**, then:

```bash
cd path\to\packet-analyzer\backend

python server.py
```

You should see:

```
INFO: Server starting on http://0.0.0.0:5000
INFO: WebSocket available on ws://0.0.0.0:5000/ws
* Serving Flask app 'server'
* Running on http://127.0.0.1:5000
```

> 💡 **Must run as Administrator** on Windows for packet sniffing to work.
> On Linux/macOS use: `sudo python server.py`

---

### Terminal 2 — Start the Frontend

Open a **normal terminal** in the project root:

```bash
npm run dev
```

You should see:

```
VITE v6.3.5  ready in ~1453 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

Now open **http://localhost:3000** in your browser and start capturing packets!

---

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder. To preview it locally:

```bash
npm run preview
```

---

## Credits

- Inspired by [Wireshark](https://www.wireshark.org/)
- UI icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/) and [Chart.js](https://www.chartjs.org/)
- Built with [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/) + [Flask](https://flask.palletsprojects.com/)
