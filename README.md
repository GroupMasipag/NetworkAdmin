# MASIPAG Network Administration & Security Dashboard

**Live Cloud Deployment:** [https://networkadministrationgroup6.onrender.com](https://networkadmin.onrender.com)

## Overview
The MASIPAG System is an Network Administration Dashboard designed to monitor physical hardware, live CCTV, and actively defend against network intrusions. Built with a React frontend and a Python/Flask backend, the system utilizes real-time hardware monitoring and a PostgreSQL database to manage and record security events.

## Core System Features

### Security & Access Control
* **JWT Authentication:** Secure login system with encrypted session management.
* **Brute-Force Protection:** Route-level rate limiting (`Flask-Limiter`) that automatically blocks rapid login attempts and logs them as high-severity threats.
* **User Audit Trail:** Comprehensive, immutable logging of all user activity (logins, logouts, and mitigation actions) directly to the database.

### Network Monitoring & Mitigation
* **Hardware Traffic Analysis:** Real-time bandwidth and packet monitoring utilizing `psutil` to read actual interface traffic.
* **Automated DDoS Detection:** Volumetric thresholds that automatically flag traffic spikes exceeding baseline packet limits.

### Physical Hardware Integration
* **Live CCTV Feed:** Natively decodes and streams real-time MJPEG video from a V380 Smart WiFi IP Camera connected to the local network topology via RTSP.
* **Cisco Infrastructure:** Monitors traffic flowing through the physical switch/router lab environment.

## Tech Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons
* **Backend:** Python, Flask, OpenCV (Video Streaming), psutil (Hardware Metrics)
* **Database:** PostgreSQL (Cloud-hosted via Render)
* **Deployment:** Render (Automated CI/CD)

## Local Development Setup

Because this system interfaces with raw network sockets and hardware architecture, development is strictly handled via Linux (WSL).

**Detailed Setup Guide:** Please refer to [`docs/SetupLinuxWSL.md`](./docs/SetupLinuxWSL.md) for complete instructions on configuring the Ubuntu virtual environment and database connections.

### Quick Start
**1. Backend (Flask)**
```bash
# Activate the virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python3 app.py

**2. Frontend (React)**
```bash
# Install Node dependencies
npm install

# Start the Vite development server
npm run dev

### API ROUTES 
*the api routes are protected with several endpoints requiring JWT Bearer tokens:*
POST /api/login - Authenticates user and returns JWT.

POST /api/logout - Securely logs out the user and records the event.

GET /api/threats - Fetches active network security alerts.

POST /api/threats/<id>/mitigate - Updates threat status and updates the WAF blocklist.

POST /api/block - Executes a manual block command against a specific IP address.

GET /api/audit-trail - Fetches the immutable user action log.

GET /api/logs - Retrieves the most recent general system logs.

GET /api/logs/live - Fetches real-time system logs filtered by a specific threat IP.

GET /api/traffic - Pulls the most recent network traffic snapshots for the real-time graph.

GET /api/system-status - Provides a system health snapshot using real hardware metrics.

GET /api/dashboard-summary - Compiles high-level overview data for the main dashboard.

GET /api/camera/stream - Yields the multipart MJPEG CCTV stream.

GET /api/camera-events - Retrieves the most recent physical security camera events.

GET / - Serves the main dashboard UI and passively logs visitor IPs.

### Attributions
please check out the [`docs/ATTRIBUTIONS.md`](./docs/ATTRIBUTIONS.md) for assets liscensing and open-source components


