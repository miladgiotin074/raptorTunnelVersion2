import { executeCommand, isLinux } from './system';
import { isXrayServiceRunning, getXrayServiceStatus, stopXrayService, removeXrayService } from './xrayService';

// Get all Xray services
export async function getAllXrayServices(): Promise<{
  success: boolean;
  services?: Array<{
    serviceName: string;
    tunnelId: string;
    isRunning: boolean;
    status?: string;
  }>;
  error?: string;
}> {
  if (!isLinux()) {
    return { success: false, error: 'Service management is only supported on Linux systems' };
  }

  try {
    // List all xray-tunnel services
    const result = await executeCommand('sudo systemctl list-units --type=service --state=loaded | grep "xray-tunnel-" | awk "{print $1}"');
    
    if (!result.success) {
      return { success: false, error: `Failed to list services: ${result.error}` };
    }

    const serviceNames = result.output.trim().split('\n').filter(name => name.length > 0);
    const services = [];

    for (const serviceName of serviceNames) {
      const tunnelId = serviceName.replace('xray-tunnel-', '').replace('.service', '');
      const isRunning = await isXrayServiceRunning(tunnelId);
      const statusInfo = await getXrayServiceStatus(tunnelId);
      
      services.push({
        serviceName,
        tunnelId,
        isRunning,
        status: statusInfo.status
      });
    }

    return { success: true, services };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Clean up orphaned services (services without corresponding tunnels)
export async function cleanupOrphanedServices(activeTunnelIds: string[]): Promise<{
  success: boolean;
  cleanedServices?: string[];
  error?: string;
}> {
  if (!isLinux()) {
    return { success: false, error: 'Service cleanup is only supported on Linux systems' };
  }

  try {
    const servicesResult = await getAllXrayServices();
    if (!servicesResult.success || !servicesResult.services) {
      return { success: false, error: 'Failed to get services list' };
    }

    const cleanedServices = [];
    
    for (const service of servicesResult.services) {
      if (!activeTunnelIds.includes(service.tunnelId)) {
        console.log(`Cleaning up orphaned service: ${service.serviceName}`);
        
        // Stop and remove the orphaned service
        await stopXrayService(service.tunnelId);
        const removeResult = await removeXrayService(service.tunnelId);
        
        if (removeResult.success) {
          cleanedServices.push(service.serviceName);
        } else {
          console.warn(`Failed to remove service ${service.serviceName}: ${removeResult.error}`);
        }
      }
    }

    return { success: true, cleanedServices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get system resource usage for all Xray services
export async function getXrayServicesResourceUsage(): Promise<{
  success: boolean;
  usage?: {
    totalMemory: number; // in MB
    totalCpu: number; // percentage
    serviceCount: number;
    services: Array<{
      tunnelId: string;
      memory: number; // in MB
      cpu: number; // percentage
      pid?: number;
    }>;
  };
  error?: string;
}> {
  if (!isLinux()) {
    return { success: false, error: 'Resource monitoring is only supported on Linux systems' };
  }

  try {
    const servicesResult = await getAllXrayServices();
    if (!servicesResult.success || !servicesResult.services) {
      return { success: false, error: 'Failed to get services list' };
    }

    const services = [];
    let totalMemory = 0;
    let totalCpu = 0;
    let serviceCount = 0;

    for (const service of servicesResult.services) {
      if (service.isRunning) {
        try {
          // Get PID of the service
          const pidResult = await executeCommand(`sudo systemctl show ${service.serviceName} --property=MainPID --value`);
          if (pidResult.success && pidResult.output.trim() !== '0') {
            const pid = parseInt(pidResult.output.trim());
            
            // Get memory and CPU usage
            const psResult = await executeCommand(`ps -p ${pid} -o pid,pcpu,pmem --no-headers`);
            if (psResult.success) {
              const [, cpu, mem] = psResult.output.trim().split(/\s+/);
              const cpuUsage = parseFloat(cpu) || 0;
              const memUsage = parseFloat(mem) || 0;
              
              // Convert memory percentage to MB (approximate)
              const totalMemResult = await executeCommand('free -m | grep "^Mem:" | awk "{print $2}"');
              const totalSystemMem = totalMemResult.success ? parseInt(totalMemResult.output.trim()) : 1000;
              const memoryMB = (memUsage / 100) * totalSystemMem;
              
              services.push({
                tunnelId: service.tunnelId,
                memory: Math.round(memoryMB * 100) / 100,
                cpu: Math.round(cpuUsage * 100) / 100,
                pid
              });
              
              totalMemory += memoryMB;
              totalCpu += cpuUsage;
              serviceCount++;
            }
          }
        } catch (error) {
          console.warn(`Failed to get resource usage for ${service.serviceName}:`, error);
        }
      }
    }

    return {
      success: true,
      usage: {
        totalMemory: Math.round(totalMemory * 100) / 100,
        totalCpu: Math.round(totalCpu * 100) / 100,
        serviceCount,
        services
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Restart all Xray services
export async function restartAllXrayServices(): Promise<{
  success: boolean;
  restarted?: string[];
  failed?: string[];
  error?: string;
}> {
  if (!isLinux()) {
    return { success: false, error: 'Service restart is only supported on Linux systems' };
  }

  try {
    const servicesResult = await getAllXrayServices();
    if (!servicesResult.success || !servicesResult.services) {
      return { success: false, error: 'Failed to get services list' };
    }

    const restarted = [];
    const failed = [];

    for (const service of servicesResult.services) {
      try {
        const restartResult = await executeCommand(`sudo systemctl restart ${service.serviceName}`);
        if (restartResult.success) {
          restarted.push(service.serviceName);
        } else {
          failed.push(service.serviceName);
        }
      } catch (error) {
        failed.push(service.serviceName);
      }
    }

    return { success: true, restarted, failed };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get service logs for a specific tunnel
export async function getServiceLogs(tunnelId: string, lines: number = 50): Promise<{
  success: boolean;
  logs?: string;
  error?: string;
}> {
  if (!isLinux()) {
    return { success: false, error: 'Log retrieval is only supported on Linux systems' };
  }

  try {
    const serviceName = `xray-tunnel-${tunnelId}`;
    
    // Try to get logs from journalctl first
    const journalResult = await executeCommand(`sudo journalctl -u ${serviceName} -n ${lines} --no-pager`);
    if (journalResult.success && journalResult.output.trim()) {
      return { success: true, logs: journalResult.output };
    }
    
    // Fallback to log file
    const logFile = `/var/log/raptor-tunnel/xray-${tunnelId}.log`;
    const fileResult = await executeCommand(`sudo tail -n ${lines} ${logFile}`);
    if (fileResult.success) {
      return { success: true, logs: fileResult.output };
    }
    
    return { success: false, error: 'No logs available' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Health check for all services
export async function healthCheckAllServices(): Promise<{
  success: boolean;
  healthStatus?: {
    totalServices: number;
    runningServices: number;
    failedServices: number;
    services: Array<{
      tunnelId: string;
      serviceName: string;
      isHealthy: boolean;
      status: string;
      lastCheck: string;
    }>;
  };
  error?: string;
}> {
  if (!isLinux()) {
    return { success: false, error: 'Health check is only supported on Linux systems' };
  }

  try {
    const servicesResult = await getAllXrayServices();
    if (!servicesResult.success || !servicesResult.services) {
      return { success: false, error: 'Failed to get services list' };
    }

    const services = [];
    let runningServices = 0;
    let failedServices = 0;

    for (const service of servicesResult.services) {
      const statusInfo = await getXrayServiceStatus(service.tunnelId);
      const isHealthy = statusInfo.isRunning;
      
      if (isHealthy) {
        runningServices++;
      } else {
        failedServices++;
      }
      
      services.push({
        tunnelId: service.tunnelId,
        serviceName: service.serviceName,
        isHealthy,
        status: statusInfo.status || 'unknown',
        lastCheck: new Date().toISOString()
      });
    }

    return {
      success: true,
      healthStatus: {
        totalServices: servicesResult.services.length,
        runningServices,
        failedServices,
        services
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}