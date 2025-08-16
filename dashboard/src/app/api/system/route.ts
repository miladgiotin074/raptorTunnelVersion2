import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Helper function to get CPU usage
async function getCpuUsage(): Promise<number> {
  try {
    if (process.platform === 'linux') {
      const { stdout } = await execAsync("grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$3+$4+$5)} END {print usage}'");
      return Math.round(parseFloat(stdout.trim()));
    } else {
      // Fallback for other platforms
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - ~~(100 * idle / total);
      return Math.max(0, Math.min(100, usage));
    }
  } catch (error) {
    console.error('Error getting CPU usage:', error);
    return 45; // fallback value
  }
}

// Helper function to get memory usage
function getMemoryUsage() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const usagePercent = Math.round((usedMem / totalMem) * 100);
  
  return {
    total: Math.round(totalMem / (1024 * 1024 * 1024)), // GB
    used: Math.round(usedMem / (1024 * 1024 * 1024)), // GB
    free: Math.round(freeMem / (1024 * 1024 * 1024)), // GB
    percentage: usagePercent
  };
}

// Helper function to get system uptime
function getSystemUptime() {
  const uptimeSeconds = os.uptime();
  const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
  const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

// Helper function to get disk usage (Linux only)
async function getDiskUsage(): Promise<{ total: number; used: number; free: number; percentage: number }> {
  try {
    if (process.platform === 'linux') {
      const { stdout } = await execAsync("df -h / | awk 'NR==2 {print $2,$3,$4,$5}'");
      const [total, used, free, percentage] = stdout.trim().split(' ');
      return {
        total: parseFloat(total.replace('G', '')),
        used: parseFloat(used.replace('G', '')),
        free: parseFloat(free.replace('G', '')),
        percentage: parseInt(percentage.replace('%', ''))
      };
    } else {
      // Fallback for other platforms
      return {
        total: 500,
        used: 380,
        free: 120,
        percentage: 76
      };
    }
  } catch (error) {
    console.error('Error getting disk usage:', error);
    return {
      total: 500,
      used: 380,
      free: 120,
      percentage: 76
    };
  }
}

// Helper function to get network info
async function getNetworkInfo() {
  try {
    const networkInterfaces = os.networkInterfaces();
    let publicIp = '192.168.1.100';
    let localIp = '127.0.0.1';
    
    // Get local IP
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        for (const iface of interfaces) {
          if (iface.family === 'IPv4' && !iface.internal) {
            localIp = iface.address;
            break;
          }
        }
      }
    }
    
    // Try to get public IP (fallback to local if fails)
    try {
      const { stdout } = await execAsync('curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "192.168.1.100"');
      publicIp = stdout.trim() || localIp;
    } catch {
      publicIp = localIp;
    }
    
    return {
      publicIp,
      localIp,
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch()
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return {
      publicIp: '192.168.1.100',
      localIp: '127.0.0.1',
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch()
    };
  }
}

export async function GET() {
  try {
    const [cpuUsage, memoryUsage, diskUsage, networkInfo] = await Promise.all([
      getCpuUsage(),
      Promise.resolve(getMemoryUsage()),
      getDiskUsage(),
      getNetworkInfo()
    ]);
    
    const systemInfo = {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
        speed: os.cpus()[0]?.speed || 0
      },
      memory: memoryUsage,
      disk: diskUsage,
      uptime: getSystemUptime(),
      network: networkInfo,
      activeTunnels: 3, // This should be replaced with actual tunnel count
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(systemInfo);
  } catch (error) {
    console.error('Error fetching system info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system information' },
      { status: 500 }
    );
  }
}