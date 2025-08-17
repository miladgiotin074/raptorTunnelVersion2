import os from 'os';

// Function to get mock data for Windows or real data for Linux
async function getSystemData() {
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    // Mock data for Windows demonstration
    return {
      cpu: {
        usage: Math.floor(Math.random() * 30) + 30, // Random between 30-60%
        cores: os.cpus().length,
        physicalCores: Math.floor(os.cpus().length / 2),
        model: os.cpus()[0]?.model || 'Intel Core i7',
        speed: os.cpus()[0]?.speed ? (os.cpus()[0].speed / 1000).toFixed(1) : '2.4',
        temperature: Math.floor(Math.random() * 20) + 45 // Random between 45-65°C
      },
      memory: {
        total: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
        used: Math.round((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024)),
        free: Math.round(os.freemem() / (1024 * 1024 * 1024)),
        usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      system: {
        platform: os.platform(),
        distro: 'Windows 11',
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname()
      },
      network: {
        hostname: os.hostname(),
        interfaces: Object.keys(os.networkInterfaces()).length,
        primaryInterface: {
          name: 'Ethernet',
          ip: '192.168.1.100',
          mac: '00:1B:44:11:3A:B7',
          speed: 1000
        }
      },
      storage: {
        totalSize: 512, // Mock 512GB
        disks: 1
      },
      manufacturer: 'Dell Inc.',
      model: 'OptiPlex 7090',
      version: '1.0'
    };
  } else {
    // Use systeminformation for Linux
    try {
      const si = await import('systeminformation');
      
      const [cpuInfo, memInfo, osInfo, currentLoad, diskLayout, networkInterfaces, systemInfo] = await Promise.all([
        si.default.cpu(),
        si.default.mem(),
        si.default.osInfo(),
        si.default.currentLoad(),
        si.default.diskLayout(),
        si.default.networkInterfaces(),
        si.default.system()
      ]);

      // Get primary network interface
      const primaryInterface = networkInterfaces.find(iface => 
        !iface.internal && iface.ip4 && iface.operstate === 'up'
      ) || networkInterfaces[0];

      // Calculate memory usage percentage
      const memoryUsagePercent = Math.round(((memInfo.total - memInfo.available) / memInfo.total) * 100);

      // Get disk information
      const totalDiskSize = diskLayout.reduce((total, disk) => total + (disk.size || 0), 0);
      
      return {
        cpu: {
          usage: Math.round(currentLoad.currentLoad || 0),
          cores: cpuInfo.cores || os.cpus().length,
          physicalCores: cpuInfo.physicalCores || Math.floor(os.cpus().length / 2),
          model: cpuInfo.brand || os.cpus()[0]?.model || 'Unknown',
          speed: cpuInfo.speed || (os.cpus()[0]?.speed / 1000) || 0,
          temperature: currentLoad.cpuTemperature || null
        },
        memory: {
          total: Math.round(memInfo.total / (1024 * 1024 * 1024)), // GB
          used: Math.round((memInfo.total - memInfo.available) / (1024 * 1024 * 1024)), // GB
          free: Math.round(memInfo.available / (1024 * 1024 * 1024)), // GB
          usage: memoryUsagePercent
        },
        system: {
          platform: osInfo.platform || os.platform(),
          distro: osInfo.distro || os.type(),
          release: osInfo.release || os.release(),
          arch: osInfo.arch || os.arch(),
          hostname: osInfo.hostname || os.hostname()
        },
        network: {
          hostname: os.hostname(),
          interfaces: networkInterfaces.length,
          primaryInterface: primaryInterface ? {
            name: primaryInterface.iface,
            ip: primaryInterface.ip4,
            mac: primaryInterface.mac,
            speed: primaryInterface.speed
          } : null
        },
        storage: {
          totalSize: Math.round(totalDiskSize / (1024 * 1024 * 1024)), // GB
          disks: diskLayout.length
        },
        manufacturer: systemInfo.manufacturer || 'Unknown',
        model: systemInfo.model || 'Unknown',
        version: systemInfo.version || 'Unknown'
      };
    } catch (error) {
      console.error('Error loading systeminformation:', error);
      // Fallback to basic OS data if systeminformation fails
      return {
        cpu: {
          usage: 0,
          cores: os.cpus().length,
          physicalCores: Math.floor(os.cpus().length / 2),
          model: os.cpus()[0]?.model || 'Unknown',
          speed: os.cpus()[0]?.speed ? (os.cpus()[0].speed / 1000).toFixed(1) : '0',
          temperature: null
        },
        memory: {
          total: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
          used: Math.round((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024)),
          free: Math.round(os.freemem() / (1024 * 1024 * 1024)),
          usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        },
        system: {
          platform: os.platform(),
          distro: os.type(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname()
        },
        network: {
          hostname: os.hostname(),
          interfaces: Object.keys(os.networkInterfaces()).length,
          primaryInterface: null
        },
        storage: {
          totalSize: 0,
          disks: 0
        },
        manufacturer: 'Unknown',
        model: 'Unknown',
        version: 'Unknown'
      };
    }
  }
}

export async function GET(request) {
  try {
    // Get system data based on platform
    const systemData = await getSystemData();

    // Calculate uptime in a short readable format
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    let uptimeString = '';
    if (days > 0) uptimeString += `${days}d `;
    if (hours > 0) uptimeString += `${hours}h `;
    if (minutes > 0) uptimeString += `${minutes}m`;
    if (!uptimeString) uptimeString = '<1m';
    
    // Remove trailing space
    uptimeString = uptimeString.trim();

    // Add uptime to system data
    systemData.system.uptime = uptimeString;
    systemData.system.uptimeSeconds = uptimeSeconds;

    return Response.json(systemData);
  } catch (error) {
    console.error('Error fetching system information:', error);
    return Response.json({ 
      error: 'Failed to fetch system information',
      details: error.message 
    }, { status: 500 });
  }
}