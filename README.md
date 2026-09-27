# THE CROWD SAFETY ENGINE — 3D Representation & Real-Time Analytics

> **23IT711 · Big Data Analytics Project**  
> **Author:** Gokul SV (2303717620521019) | Coimbatore Institute of Technology

---

## 📌 Project Overview

**The Crowd Safety Engine** is an interactive, real-time 3D simulation and Big Data analytics platform built for monitoring and managing crowd congestion in high-traffic public venues (e.g., railway station concourses, transit hubs, stadiums). 

It combines **Three.js WebGL spatial visualization** with a simulated **end-to-end Big Data processing pipeline** (Sensors → HDFS → MapReduce → Stream Processing Engine → Operations Control Room).

---

## ✨ Features

- **Interactive 3D Digital Twin**: Realistic railway station concourse complete with platforms, turnstiles, ticket gates, waiting areas, and security checkpoints.
- **Zone Density Monitoring**:
  - **Zone A**: Platform 1 Concourse (Normal Density)
  - **Zone B**: Main Concourse (High Density)
  - **Zone C**: West Ticket Counter (Normal Density)
  - **Zone D**: Turnstile Exit Bottleneck (Critical Density)
- **Big Data Analytics Pipeline**:
  - **Sensors / CCTV**: Real-time optical count feeds.
  - **HDFS**: Distributed storage for historical event logs.
  - **MapReduce**: Batch aggregation and historical baseline computation.
  - **Stream Processing**: 5-minute sliding window streaming analytics.
  - **Control Room Dashboard**: Spatial awareness & operator intervention trigger.
- **Operator Intervention Workflow**: Interactive emergency mitigation panel with actions like opening auxiliary gates, deploying security marshals, and redirecting passenger flow.
- **100% Offline Standalone Build**: Includes a single zero-dependency [`standalone.html`](./standalone.html) file that opens directly in any WebGL-capable browser.

---

## 🛠️ Architecture & Tech Stack

- **3D Engine**: Three.js (WebGL rendering, PCF soft shadows, OrbitControls camera navigation)
- **UI & Styling**: Vanilla CSS, modern glassmorphism, responsive inspector panels
- **Build Tooling**: Vite & Node.js bundling script (`build_standalone.cjs`)

---

## 🚀 Getting Started

### 1. Standalone File (Zero Setup)
Simply double-click or open [`standalone.html`](./standalone.html) directly in Google Chrome, Microsoft Edge, Firefox, or Safari.

### 2. Local Development Server
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build standalone file
node build_standalone.cjs
```

---

## 📄 License
Academic project built for **Coimbatore Institute of Technology — Department of Information Technology**.
