# NEERMETRO — Chennai Water Metro

An intelligent, bilingual, next-generation river transit web platform for the Chennai Water Metro system along the historic Cooum waterway.

![NEERMETRO Logo](/public/logo/neermetro-lockup-transparent.png)

## Overview

**NEERMETRO** connects western Chennai to the Marina coastline across 10 modern waterfront terminals and 3 river corridors (Line C1 Western Trunk, Line C2 Central Express, Line C3 Estuary Loop). The web app delivers an intuitive public transit experience:
- **Instant Journey Planning**: Fast point-to-point transit calculations with duration, fare, transfers, and carbon savings.
- **Live Vessel Tracking**: Real-time GPS-simulated monitoring of electric hybrid catamarans (`F-101` to `F-106`) with speed, occupancy, and battery health.
- **Digital Turnstile QR Passes**: In-app contactless ticketing and turnstile barcode generation.
- **Bilingual Voice Mobility Assistant**:
  - **VX Voice**: 100% zero-login, instant device-native speech recognition in Indian English & Tamil.
  - **Puter.js AI**: Cloud AI Whisper speech-to-text integration.
- **Transit Policies & Support**: Verified cancellation & refund policies, lost & found assistance, and 24/7 customer care integration.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Maps**: Leaflet + React Leaflet
- **Voice & Speech**: Web Speech API (VX) + Puter.js AI Whisper
- **PWA**: Installable Web App with Service Worker & Manifest

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Rizirfan/NeerMetro.git
cd NeerMetro

# Install dependencies
npm install

# Start local development server
npm run dev
```

The app will be available at `http://localhost:5173/`.

### Production Build

```bash
npm run build
```

The compiled assets will be in the `dist/` directory ready for deployment.

---

## Deploying to Vercel

This repository includes a pre-configured `vercel.json` with Single Page Application rewrites and Vite build settings:

1. Import this repository (`https://github.com/Rizirfan/NeerMetro.git`) in your [Vercel Dashboard](https://vercel.com/new).
2. Framework Preset will be automatically detected as **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**.

---

## License

Proprietary / Open transit development for Chennai Water Metro Mobility.
