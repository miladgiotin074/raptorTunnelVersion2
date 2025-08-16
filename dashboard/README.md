# RaptorTunnel Dashboard

A real-time system monitoring dashboard built with Next.js that displays CPU usage, RAM usage, system uptime, and network information.

## Features

- **Real-time System Monitoring**: Live CPU, RAM, and disk usage statistics
- **Network Information**: Display public and local IP addresses
- **System Uptime**: Track system availability and uptime
- **Auto-refresh**: Data automatically refreshes every 30 seconds
- **Manual Refresh**: Click the refresh button to update data immediately
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful error handling with user notifications

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

1. Navigate to the dashboard directory:
```bash
cd dashboard
```

2. Install dependencies:
```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Ubuntu/Linux Deployment

### System Requirements

The dashboard uses system commands to gather real-time information. On Ubuntu/Linux, make sure you have:

- `curl` for getting public IP address
- Access to `/proc/stat` for CPU usage (standard on Linux)
- Access to `/proc/meminfo` for memory information (standard on Linux)

### Installation on Ubuntu

1. Update system packages:
```bash
sudo apt update
sudo apt install curl nodejs npm
```

2. Clone and setup the project:
```bash
cd dashboard
npm install
```

3. Build and run:
```bash
npm run build
npm start
```

### Running as a Service (Ubuntu)

To run the dashboard as a system service:

1. Create a service file:
```bash
sudo nano /etc/systemd/system/raptor-dashboard.service
```

2. Add the following content:
```ini
[Unit]
Description=RaptorTunnel Dashboard
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/dashboard
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable raptor-dashboard
sudo systemctl start raptor-dashboard
```

4. Check service status:
```bash
sudo systemctl status raptor-dashboard
```

## API Endpoints

### GET /api/system

Returns real-time system information:

```json
{
  "cpu": {
    "usage": 45,
    "cores": 4,
    "model": "Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz",
    "speed": 3700
  },
  "memory": {
    "total": 16,
    "used": 9.6,
    "free": 6.4,
    "percentage": 60
  },
  "disk": {
    "total": 500,
    "used": 380,
    "free": 120,
    "percentage": 76
  },
  "uptime": "5 days",
  "network": {
    "publicIp": "203.0.113.1",
    "localIp": "192.168.1.100",
    "hostname": "server-01",
    "platform": "linux",
    "arch": "x64"
  },
  "activeTunnels": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Troubleshooting

### Permission Issues on Linux

If you encounter permission issues when reading system information:

```bash
# Make sure the user running the application has read access to system files
sudo chmod +r /proc/stat /proc/meminfo
```

### Network Issues

If public IP detection fails:

```bash
# Test manual IP detection
curl -s ifconfig.me
curl -s ipinfo.io/ip
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Run on a different port
PORT=3001 npm start
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **System Monitoring**: Node.js built-in modules (os, child_process)
- **API**: Next.js API Routes

## License

This project is part of the RaptorTunnel suite.
