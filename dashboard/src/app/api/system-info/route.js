import si from 'systeminformation';
import os from 'os';

export async function GET(request) {
  try {
    // Get system information using systeminformation library
    const [cpuInfo, memInfo, osInfo, currentLoad, diskLayout, networkInterfaces, systemInfo] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.currentLoad(),
      si.diskLayout(),
      si.networkInterfaces(),
      si.system()
    ]);

    // Calculate uptime in a readable format
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    let uptimeString = '';
    if (days > 0) uptimeString += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) uptimeString += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0) uptimeString += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (!uptimeString) uptimeString = 'Less than a minute';

    // Get primary network interface
    const primaryInterface = networkInterfaces.find(iface => 
      !iface.internal && iface.ip4 && iface.operstate === 'up'
    ) || networkInterfaces[0];

    // Calculate memory usage percentage
    const memoryUsagePercent = Math.round(((memInfo.total - memInfo.available) / memInfo.total) * 100);

    // Get disk information
    const totalDiskSize = diskLayout.reduce((total, disk) => total + (disk.size || 0), 0);
    
    const systemData = {
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
        hostname: osInfo.hostname || os.hostname(),
        uptime: uptimeString,
        uptimeSeconds: uptimeSeconds
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

    return Response.json(systemData);
  } catch (error) {
    console.error('Error fetching system information:', error);
    return Response.json({ 
      error: 'Failed to fetch system information',
      details: error.message 
    }, { status: 500 });
  }
}