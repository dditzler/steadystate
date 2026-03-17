# SteadyState

IoT-driven predictive maintenance platform for residential property managers (20–200 doors).

## Projects

### `/site` — Landing Page
Static marketing website. Open `site/index.html` directly or deploy via GitHub Pages.

**Live via GitHub Pages:** See the Deployments section.

### `/ops` — CRM & Device Management Dashboard
React + Node.js application for managing sales pipeline, leads, and IoT device fleet.

#### Running locally:
```bash
cd ops
npm install
npm run dev
```

## Tech Stack
- **Landing Page:** HTML, CSS, vanilla JS
- **Dashboard:** React, TypeScript, Tailwind CSS, Express, Drizzle ORM
- **Hardware:** ESP32 (WiFi + optional cellular via Hologram.io)
- **Sensors:** Temperature, humidity, vibration (HVAC), leak detection
- **Protocols:** MQTT, Zigbee/Thread for peripheral sensors

## Architecture
ESP32 sensors → HiveMQ (MQTT) → Node-RED (Railway) → AI Processing → Customer Dashboard

## Target Market
Mid-size property managers (20–200 doors) using AppFolio or Buildium.
