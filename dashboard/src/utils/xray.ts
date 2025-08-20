import { executeCommand, isLinux, isProcessRunning, getProcessPid, killProcess, isPortInUse } from './system';
import fs from 'fs/promises';
import path from 'path';

interface XrayConfig {
  socksPort: number;
  vxlanIP: string;
  serverType: 'iran' | 'foreign';
  remoteVxlanIP?: string;
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

// Start Xray process
export async function startXray(config: XrayConfig): Promise<{ success: boolean; error?: string; pid?: number }> {
  if (!isLinux()) {
    return { success: false, error: 'Xray is only supported on Linux systems' };
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

    // Generate configuration
    const xrayConfig = generateXrayConfig(config);
    const configDir = '/tmp/raptor-tunnel';
    const configFile = path.join(configDir, `xray-${config.socksPort}.json`);

    // Create config directory
    await executeCommand(`mkdir -p ${configDir}`);

    // Write configuration file
    await fs.writeFile(configFile, JSON.stringify(xrayConfig, null, 2));

    // Start Xray process
    const xrayCmd = `nohup xray run -config ${configFile} > /tmp/xray-${config.socksPort}.log 2>&1 & echo $!`;
    const result = await executeCommand(xrayCmd);

    if (!result.success) {
      return { success: false, error: `Failed to start Xray: ${result.error}` };
    }

    const pid = parseInt(result.output.trim());
    if (isNaN(pid)) {
      return { success: false, error: 'Failed to get Xray process PID' };
    }

    // Wait a moment and check if process is still running
    await new Promise(resolve => setTimeout(resolve, 1000));
    const isRunning = await isProcessRunning(`xray.*${configFile}`);
    
    if (!isRunning) {
      // Read log file for error details
      try {
        const logContent = await fs.readFile(`/tmp/xray-${config.socksPort}.log`, 'utf-8');
        return { success: false, error: `Xray failed to start: ${logContent}` };
      } catch {
        return { success: false, error: 'Xray failed to start (no log available)' };
      }
    }

    return { success: true, pid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Stop Xray process
export async function stopXray(socksPort: number): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'Xray is only supported on Linux systems' };
  }

  try {
    const configFile = `/tmp/raptor-tunnel/xray-${socksPort}.json`;
    
    // Find and kill Xray process
    const pid = await getProcessPid(`xray.*${configFile}`);
    if (pid) {
      const killed = await killProcess(pid);
      if (!killed) {
        return { success: false, error: `Failed to kill Xray process (PID: ${pid})` };
      }
    }

    // Clean up configuration file
    try {
      await fs.unlink(configFile);
    } catch {
      // Ignore if file doesn't exist
    }

    // Clean up log file
    try {
      await fs.unlink(`/tmp/xray-${socksPort}.log`);
    } catch {
      // Ignore if file doesn't exist
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Check if Xray is running
export async function isXrayRunning(socksPort: number): Promise<boolean> {
  if (!isLinux()) {
    return false;
  }

  const configFile = `/tmp/raptor-tunnel/xray-${socksPort}.json`;
  return await isProcessRunning(`xray.*${configFile}`);
}

// Get Xray process status
export async function getXrayStatus(socksPort: number): Promise<{ isRunning: boolean; pid?: number; logContent?: string }> {
  if (!isLinux()) {
    return { isRunning: false };
  }

  try {
    const configFile = `/tmp/raptor-tunnel/xray-${socksPort}.json`;
    const isRunning = await isProcessRunning(`xray.*${configFile}`);
    
    let pid: number | undefined;
    if (isRunning) {
      const processPid = await getProcessPid(`xray.*${configFile}`);
      if (processPid) {
        pid = processPid;
      }
    }

    // Read log content (last 50 lines)
    let logContent: string | undefined;
    try {
      const logResult = await executeCommand(`tail -n 50 /tmp/xray-${socksPort}.log`);
      if (logResult.success) {
        logContent = logResult.output;
      }
    } catch {
      // Ignore log read errors
    }

    return { isRunning, pid, logContent };
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