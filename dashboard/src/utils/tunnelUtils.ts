// Utility functions for tunnel management

/**
 * Generate a unique VNI (VXLAN Network Identifier)
 * VNI should be between 1 and 16777215 (24-bit)
 */
export function generateVNI(): number {
  // Generate a random VNI between 10000 and 99999 for better readability
  return Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
}

/**
 * Generate VXLAN IP addresses for Iran and Foreign servers
 * Uses 10.100.x.x subnet with /30 networks
 */
export function generateVXLANIPs(vni: number): {
  iran_vxlan_ip: string;
  foreign_vxlan_ip: string;
} {
  // Use VNI to generate unique subnet
  const subnet = Math.floor(vni / 100) % 255;
  const host = (vni % 100) % 252 + 1; // Ensure host is between 1-252
  
  return {
    foreign_vxlan_ip: `10.100.${subnet}.${host}`,
    iran_vxlan_ip: `10.100.${subnet}.${host + 1}`
  };
}

/**
 * Generate a unique tunnel ID
 */
export function generateTunnelId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `tunnel-${timestamp}-${random}`;
}

/**
 * Generate connection code for tunnel
 * The code is a Base64 encoded JSON containing all connection details
 */
export function generateConnectionCode(tunnelData: {
  name: string;
  foreign_ip: string;
  vxlan_port: number;
  socks_port: number;
  vni: number;
  iran_vxlan_ip: string;
  foreign_vxlan_ip: string;
}): string {
  const connectionData = {
    version: '1.0',
    tunnel_name: tunnelData.name,
    server_ip: tunnelData.foreign_ip,
    vxlan_port: tunnelData.vxlan_port,
    socks_port: tunnelData.socks_port,
    vni: tunnelData.vni,
    client_vxlan_ip: tunnelData.iran_vxlan_ip,
    server_vxlan_ip: tunnelData.foreign_vxlan_ip,
    created_at: new Date().toISOString()
  };

  // Convert to JSON and encode in Base64
  const jsonString = JSON.stringify(connectionData);
  return Buffer.from(jsonString).toString('base64');
}

/**
 * Parse connection code and extract tunnel data
 */
export function parseConnectionCode(code: string): {
  name: string;
  foreign_ip: string;
  vxlan_port: number;
  socks_port: number;
  vni: number;
  iran_vxlan_ip: string;
  foreign_vxlan_ip: string;
} | null {
  try {
    // Decode Base64 and parse JSON
    const jsonString = Buffer.from(code, 'base64').toString('utf-8');
    const data = JSON.parse(jsonString);

    // Validate required fields
    if (!data.tunnel_name || !data.server_ip || !data.vxlan_port || 
        !data.socks_port || !data.vni || !data.client_vxlan_ip || 
        !data.server_vxlan_ip) {
      return null;
    }

    return {
      name: data.tunnel_name,
      foreign_ip: data.server_ip,
      vxlan_port: data.vxlan_port,
      socks_port: data.socks_port,
      vni: data.vni,
      iran_vxlan_ip: data.client_vxlan_ip,
      foreign_vxlan_ip: data.server_vxlan_ip
    };
  } catch (error) {
    console.error('Failed to parse connection code:', error);
    return null;
  }
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

/**
 * Validate port number
 */
export function isValidPort(port: number): boolean {
  return port >= 1 && port <= 65535;
}

/**
 * Validate VNI (VXLAN Network Identifier)
 */
export function isValidVNI(vni: number): boolean {
  return vni >= 1 && vni <= 16777215;
}

/**
 * Format bandwidth usage for display
 */
export function formatBandwidth(bytes: number): string {
  if (bytes === 0) return '0 B/s';
  
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * Calculate uptime from creation date
 */
export function calculateUptime(createdAt: string, lastActive: string): string {
  const created = new Date(createdAt);
  const active = new Date(lastActive);
  const diffMs = active.getTime() - created.getTime();
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Generate random ping value for simulation
 */
export function generateRandomPing(): number {
  return Math.floor(Math.random() * (200 - 10 + 1)) + 10;
}

/**
 * Check if VNI is already in use
 */
export function isVNIInUse(vni: number, existingTunnels: any[]): boolean {
  return existingTunnels.some(tunnel => tunnel.vni === vni);
}

/**
 * Generate unique VNI that's not in use
 */
export function generateUniqueVNI(existingTunnels: any[]): number {
  let vni: number;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    vni = generateVNI();
    attempts++;
  } while (isVNIInUse(vni, existingTunnels) && attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    // Fallback: find the first available VNI starting from 10000
    for (let i = 10000; i <= 99999; i++) {
      if (!isVNIInUse(i, existingTunnels)) {
        return i;
      }
    }
    // If all VNIs in range are taken, use a random one (very unlikely)
    return generateVNI();
  }
  
  return vni;
}