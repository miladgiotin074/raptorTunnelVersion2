import { executeCommand, isLinux, isProcessRunning, getProcessPid, killProcess, isPortInUse } from './system';
import fs from 'fs/promises';
import path from 'path';

interface XrayConfig {
  socksPort: number;
  vxlanIP: string;
  serverType: 'iran' | 'foreign';
  remoteVxlanIP?: string;
  tunnelId: string;
}

// Generate Xray configuration
function generateXrayConfig(config: XrayConfig): any {
  const baseConfig = {
    log: {
      loglevel: "info"
    },
    inbounds: [] as any[],
    outbounds: [] as any[],
    routing: {
      rules: [] as any[]
    }
  };

  if (config.serverType === 'iran') {
    // Iran server configuration - SOCKS5 inbound for clients
    baseConfig.inbounds.push({
      tag: "socks-in",
      port: config.socksPort,
      listen: "0.0.0.0", // Listen on all interfaces for client connections
      protocol: "socks",
      settings: {
        auth: "noauth",
        udp: true
      }
    });

    // SOCKS5 outbound to foreign server through VXLAN
    baseConfig.outbounds.push({
      tag: "foreign-proxy",
      protocol: "socks",
      settings: {
        servers: [{
          address: config.remoteVxlanIP,
          port: config.socksPort,
          users: []
        }]
      }
    });

    // Direct outbound for local traffic (fallback)
    baseConfig.outbounds.push({
      tag: "direct",
      protocol: "freedom",
      settings: {}
    });

    // Route all SOCKS5 traffic to foreign server
    baseConfig.routing.rules.push({
      type: "field",
      inboundTag: ["socks-in"],
      outboundTag: "foreign-proxy"
    });
  } else {
    // Foreign server configuration - SOCKS5 inbound from Iran server
    baseConfig.inbounds.push({
      tag: "socks-in",
      port: config.socksPort,
      listen: config.vxlanIP, // Listen on VXLAN interface for Iran server
      protocol: "socks",
      settings: {
        auth: "noauth",
        udp: true
      }
    });

    // Direct outbound to internet
    baseConfig.outbounds.push({
      tag: "direct",
      protocol: "freedom",
      settings: {}
    });

    // Route all traffic from Iran server to internet
    baseConfig.routing.rules.push({
      type: "field",
      inboundTag: ["socks-in"],
      outboundTag: "direct"
    });
  }

  return baseConfig;
}

// Generate systemd service file content
function generateSystemdService(config: XrayConfig): string {
  const serviceName = `xray-tunnel-${config.tunnelId}`;
  const configFile = `/etc/raptor-tunnel/xray-${config.tunnelId}.json`;
  const logFile = `/var/log/raptor-tunnel/xray-${config.tunnelId}.log`;
  
  return `[Unit]
Description=Xray Service for Tunnel ${config.tunnelId}
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/xray run -config ${configFile}
Restart=always
RestartSec=5
StandardOutput=append:${logFile}
StandardError=append:${logFile}
SyslogIdentifier=${serviceName}

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/raptor-tunnel

[Install]
WantedBy=multi-user.target
`;
}

// Create systemd service for Xray tunnel
export async function createXrayService(config: XrayConfig): Promise<{ success: boolean; error?: string; serviceName?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'Xray services are only supported on Linux systems' };
  }

  try {
    // Check if port is already in use
    const portInUse = await isPortInUse(config.socksPort);
    if (portInUse) {
      return { success: false, error: `Port ${config.socksPort} is already in use` };
    }

    // Check if Xray is installed
    const xrayExists = await executeCommand('which xray');
    if (!xrayExists.success) {
      return { success: false, error: 'Xray is not installed. Please install Xray first.' };
    }

    const serviceName = `xray-tunnel-${config.tunnelId}`;
    const configDir = '/etc/raptor-tunnel';
    const logDir = '/var/log/raptor-tunnel';
    const configFile = path.join(configDir, `xray-${config.tunnelId}.json`);
    const serviceFile = `/etc/systemd/system/${serviceName}.service`;

    // Create necessary directories
    await executeCommand(`sudo mkdir -p ${configDir}`);
    await executeCommand(`sudo mkdir -p ${logDir}`);

    // Generate and write Xray configuration
    const xrayConfig = generateXrayConfig(config);
    const tempConfigFile = `/tmp/xray-${config.tunnelId}.json`;
    await fs.writeFile(tempConfigFile, JSON.stringify(xrayConfig, null, 2));
    await executeCommand(`sudo mv ${tempConfigFile} ${configFile}`);
    await executeCommand(`sudo chmod 644 ${configFile}`);

    // Generate and write systemd service file
    const serviceContent = generateSystemdService(config);
    const tempServiceFile = `/tmp/${serviceName}.service`;
    await fs.writeFile(tempServiceFile, serviceContent);
    await executeCommand(`sudo mv ${tempServiceFile} ${serviceFile}`);
    await executeCommand(`sudo chmod 644 ${serviceFile}`);

    // Reload systemd and enable service
    const reloadResult = await executeCommand('sudo systemctl daemon-reload');
    if (!reloadResult.success) {
      return { success: false, error: `Failed to reload systemd: ${reloadResult.error}` };
    }

    const enableResult = await executeCommand(`sudo systemctl enable ${serviceName}`);
    if (!enableResult.success) {
      return { success: false, error: `Failed to enable service: ${enableResult.error}` };
    }

    return { success: true, serviceName };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Start Xray service
export async function startXrayService(tunnelId: string): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'Xray services are only supported on Linux systems' };
  }

  try {
    const serviceName = `xray-tunnel-${tunnelId}`;
    
    // Start the service
    const startResult = await executeCommand(`sudo systemctl start ${serviceName}`);
    if (!startResult.success) {
      return { success: false, error: `Failed to start service: ${startResult.error}` };
    }

    // Wait a moment and check if service is running
    await new Promise(resolve => setTimeout(resolve, 2000));
    const statusResult = await executeCommand(`sudo systemctl is-active ${serviceName}`);
    
    if (statusResult.success && statusResult.output.trim() === 'active') {
      return { success: true };
    } else {
      // Get service status for error details
      const detailsResult = await executeCommand(`sudo systemctl status ${serviceName} --no-pager -l`);
      return { success: false, error: `Service failed to start: ${detailsResult.output}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Stop Xray service
export async function stopXrayService(tunnelId: string): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'Xray services are only supported on Linux systems' };
  }

  try {
    const serviceName = `xray-tunnel-${tunnelId}`;
    
    // Stop the service
    const stopResult = await executeCommand(`sudo systemctl stop ${serviceName}`);
    if (!stopResult.success) {
      return { success: false, error: `Failed to stop service: ${stopResult.error}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Remove Xray service completely
export async function removeXrayService(tunnelId: string): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'Xray services are only supported on Linux systems' };
  }

  try {
    const serviceName = `xray-tunnel-${tunnelId}`;
    const configFile = `/etc/raptor-tunnel/xray-${tunnelId}.json`;
    const serviceFile = `/etc/systemd/system/${serviceName}.service`;
    const logFile = `/var/log/raptor-tunnel/xray-${tunnelId}.log`;

    // Stop and disable service
    await executeCommand(`sudo systemctl stop ${serviceName}`);
    await executeCommand(`sudo systemctl disable ${serviceName}`);

    // Remove service file
    await executeCommand(`sudo rm -f ${serviceFile}`);
    
    // Remove config file
    await executeCommand(`sudo rm -f ${configFile}`);
    
    // Remove log file
    await executeCommand(`sudo rm -f ${logFile}`);

    // Reload systemd
    await executeCommand('sudo systemctl daemon-reload');
    await executeCommand('sudo systemctl reset-failed');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Check if Xray service is running
export async function isXrayServiceRunning(tunnelId: string): Promise<boolean> {
  if (!isLinux()) {
    return false;
  }

  try {
    const serviceName = `xray-tunnel-${tunnelId}`;
    const result = await executeCommand(`sudo systemctl is-active ${serviceName}`);
    return result.success && result.output.trim() === 'active';
  } catch {
    return false;
  }
}

// Get Xray service status
export async function getXrayServiceStatus(tunnelId: string): Promise<{ isRunning: boolean; status?: string; logContent?: string }> {
  if (!isLinux()) {
    return { isRunning: false };
  }

  try {
    const serviceName = `xray-tunnel-${tunnelId}`;
    const logFile = `/var/log/raptor-tunnel/xray-${tunnelId}.log`;
    
    // Get service status
    const statusResult = await executeCommand(`sudo systemctl is-active ${serviceName}`);
    const isRunning = statusResult.success && statusResult.output.trim() === 'active';
    
    // Get detailed status
    const detailsResult = await executeCommand(`sudo systemctl status ${serviceName} --no-pager -l`);
    const status = detailsResult.success ? detailsResult.output : 'Unknown';

    // Read log content (last 50 lines)
    let logContent: string | undefined;
    try {
      const logResult = await executeCommand(`sudo tail -n 50 ${logFile}`);
      if (logResult.success) {
        logContent = logResult.output;
      }
    } catch {
      // Ignore log read errors
    }

    return { isRunning, status, logContent };
  } catch {
    return { isRunning: false };
  }
}

// Test SOCKS5 connection
export async function testSOCKS5Connection(socksIP: string, socksPort: number): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'SOCKS5 testing is only supported on Linux systems' };
  }

  try {
    // Test connection using curl through SOCKS5 proxy
    const testCmd = `timeout 10 curl -x socks5://${socksIP}:${socksPort} -s -o /dev/null -w "%{http_code}" http://httpbin.org/ip`;
    const result = await executeCommand(testCmd);

    if (!result.success) {
      return { success: false, error: `SOCKS5 test failed: ${result.error}` };
    }

    const httpCode = result.output.trim();
    if (httpCode === '200') {
      return { success: true };
    } else {
      return { success: false, error: `HTTP request failed with code: ${httpCode}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}