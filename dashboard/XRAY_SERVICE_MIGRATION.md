# Xray Service Migration Documentation

## Overview

This document describes the migration from running Xray as a sub-process of the main application to using independent systemd services for each tunnel. This change provides better isolation, reliability, and management capabilities.

## Benefits of the New Architecture

### 🔒 **Independence & Isolation**
- Each tunnel runs as an independent systemd service
- Xray processes are no longer dependent on the main application
- Application crashes don't affect running tunnels
- Better resource isolation between tunnels

### 🛡️ **Reliability & Stability**
- Automatic service restart on failure (systemd watchdog)
- Better process management and monitoring
- Graceful shutdown and cleanup
- Service persistence across system reboots

### 📊 **Enhanced Management**
- Standard systemd service management
- Centralized logging through journalctl
- Resource monitoring and usage tracking
- Health checks and automated diagnostics

### 🔧 **Operational Benefits**
- Easy troubleshooting with standard Linux tools
- Better integration with system monitoring
- Automated cleanup of orphaned services
- Bulk operations for multiple services

## Changed Files

### Core Files Modified:
1. **`src/utils/xrayService.ts`** (NEW) - New service management system
2. **`src/utils/serviceManager.ts`** (NEW) - Service monitoring and management utilities
3. **`src/app/api/services/route.ts`** (NEW) - API endpoints for service management
4. **`src/app/api/tunnels/[id]/start/route.ts`** - Updated to use service-based Xray
5. **`src/app/api/tunnels/[id]/stop/route.ts`** - Updated to use service-based Xray
6. **`src/app/api/tunnels/[id]/restart/route.ts`** - Updated to use service-based Xray
7. **`src/app/api/tunnels/route.ts`** - Updated DELETE endpoint for service cleanup

## New Service Structure

### Service Files Location:
- **Service files**: `/etc/systemd/system/xray-tunnel-{tunnel-id}.service`
- **Configuration files**: `/etc/raptor-tunnel/xray-{tunnel-id}.json`
- **Log files**: `/var/log/raptor-tunnel/xray-{tunnel-id}.log`

### Service Template:
```ini
[Unit]
Description=Xray Tunnel Service for {tunnel-id}
After=network.target
Wants=network.target

[Service]
Type=simple
User=raptor-tunnel
Group=raptor-tunnel
ExecStart=/usr/local/bin/xray run -config /etc/raptor-tunnel/xray-{tunnel-id}.json
Restart=always
RestartSec=5
StandardOutput=append:/var/log/raptor-tunnel/xray-{tunnel-id}.log
StandardError=append:/var/log/raptor-tunnel/xray-{tunnel-id}.log

[Install]
WantedBy=multi-user.target
```

## Management Commands

### Systemd Commands
You can manage Xray services using standard systemd commands:

```bash
# Check service status
sudo systemctl status xray-tunnel-{tunnel-id}

# View service logs
sudo journalctl -u xray-tunnel-{tunnel-id} -f

# Manually start/stop/restart service
sudo systemctl start xray-tunnel-{tunnel-id}
sudo systemctl stop xray-tunnel-{tunnel-id}
sudo systemctl restart xray-tunnel-{tunnel-id}

# List all tunnel services
sudo systemctl list-units --type=service | grep xray-tunnel
```

### API Endpoints
New service management API endpoints:

```bash
# Get all services status
GET /api/services
GET /api/services?action=list

# Get resource usage
GET /api/services?action=resource-usage

# Health check all services
GET /api/services?action=health-check

# Get service logs
GET /api/services?action=logs&tunnelId={id}&lines=50

# Cleanup orphaned services
POST /api/services
{
  "action": "cleanup-orphaned"
}

# Restart all services
POST /api/services
{
  "action": "restart-all"
}

# Emergency cleanup (remove all services)
DELETE /api/services?confirm=true
```

## Security Features

### User & Permissions:
- Services run under dedicated `raptor-tunnel` user
- Restricted file permissions for configuration files
- Secure log file access
- Proper systemd security settings

### File Security:
```bash
# Configuration files
sudo chown raptor-tunnel:raptor-tunnel /etc/raptor-tunnel/
sudo chmod 750 /etc/raptor-tunnel/
sudo chmod 640 /etc/raptor-tunnel/xray-*.json

# Log files
sudo chown raptor-tunnel:raptor-tunnel /var/log/raptor-tunnel/
sudo chmod 750 /var/log/raptor-tunnel/

# Service files
sudo chmod 644 /etc/systemd/system/xray-tunnel-*.service
```

## Service Management Features

### Monitoring Capabilities:
- **Service Status**: Real-time status of all Xray services
- **Resource Usage**: Memory and CPU usage monitoring
- **Health Checks**: Automated health monitoring
- **Log Management**: Centralized log access and viewing
- **Orphaned Service Cleanup**: Automatic cleanup of unused services

### Advanced Features:
- **Bulk Operations**: Start, stop, or restart all services at once
- **Resource Monitoring**: Track system resource usage per service
- **Service Discovery**: Automatic detection of all tunnel services
- **Emergency Cleanup**: Force removal of all services when needed

## Migration Notes

### Prerequisites:
1. **Linux System**: systemd-based Linux distribution
2. **Xray Installation**: Xray binary available at `/usr/local/bin/xray`
3. **User Account**: `raptor-tunnel` user and group created
4. **Directory Structure**: Required directories created with proper permissions

### Setup Commands:
```bash
# Create user and group
sudo useradd -r -s /bin/false raptor-tunnel

# Create directories
sudo mkdir -p /etc/raptor-tunnel
sudo mkdir -p /var/log/raptor-tunnel

# Set permissions
sudo chown raptor-tunnel:raptor-tunnel /etc/raptor-tunnel
sudo chown raptor-tunnel:raptor-tunnel /var/log/raptor-tunnel
sudo chmod 750 /etc/raptor-tunnel
sudo chmod 750 /var/log/raptor-tunnel
```

### Backward Compatibility:
- Old `xray.ts` functions are preserved for reference
- New system is completely independent
- No breaking changes to existing tunnel data

## Troubleshooting

### Common Issues:

1. **Service fails to start**
   ```bash
   sudo journalctl -u xray-tunnel-{tunnel-id} -n 50
   # Or use API
   GET /api/services?action=logs&tunnelId={id}
   ```

2. **Permission issues**
   ```bash
   sudo chown -R raptor-tunnel:raptor-tunnel /etc/raptor-tunnel/
   sudo chmod 644 /etc/systemd/system/xray-tunnel-*.service
   ```

3. **Port conflicts**
   - Check if SOCKS port is already in use
   - Verify tunnel configuration
   - Use resource monitoring API to check conflicts

4. **Configuration issues**
   - Validate Xray config JSON syntax
   - Check log files in `/var/log/raptor-tunnel/`
   - Use health check API for automated validation

5. **Orphaned services**
   ```bash
   # Use API to cleanup
   POST /api/services
   {
     "action": "cleanup-orphaned"
   }
   ```

### Diagnostic Commands:
```bash
# Check all tunnel services
sudo systemctl list-units --type=service --state=loaded | grep xray-tunnel

# Check service dependencies
sudo systemctl list-dependencies xray-tunnel-{tunnel-id}

# View detailed service information
sudo systemctl show xray-tunnel-{tunnel-id}

# Check system resources
sudo systemctl status
free -h
df -h
```

## Performance Considerations

### Resource Usage:
- Each service uses minimal system resources
- Better memory isolation prevents memory leaks
- CPU usage is distributed across services
- Automatic cleanup prevents resource accumulation

### Scalability:
- Supports hundreds of concurrent tunnel services
- Efficient service discovery and management
- Bulk operations for large-scale deployments
- Automated monitoring and health checks

## Future Enhancements

### Planned Features:
- **Service Templates**: Configurable service templates
- **Auto-scaling**: Dynamic service scaling based on load
- **Metrics Export**: Prometheus/Grafana integration
- **Service Mesh**: Integration with service mesh technologies
- **Container Support**: Docker/Podman service containers

---

**Migration completed successfully!** 🎉

Each tunnel now runs as an independent systemd service, providing better reliability, security, and management capabilities.