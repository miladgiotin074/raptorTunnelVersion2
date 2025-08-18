import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Tunnel {
  id: string;
  name: string;
  type: 'foreign' | 'iran';
  status: 'active' | 'inactive';
  foreign_ip: string;
  iran_ip: string;
  vxlan_port: number;
  socks_port: number;
  vni: number;
  iran_vxlan_ip: string;
  foreign_vxlan_ip: string;
  bandwidth_usage: string;
  connection_count: number;
  created_at: string;
  last_active: string;
}

interface TunnelsData {
  tunnels: Tunnel[];
}

const TUNNELS_FILE = path.join(process.cwd(), 'data', 'tunnels.json');

// Read tunnels from JSON file
function readTunnels(): TunnelsData {
  if (!fs.existsSync(TUNNELS_FILE)) {
    return { tunnels: [] };
  }
  
  try {
    const data = fs.readFileSync(TUNNELS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tunnels file:', error);
    return { tunnels: [] };
  }
}

// Write tunnels to JSON file
function writeTunnels(data: TunnelsData): void {
  const dataDir = path.dirname(TUNNELS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(TUNNELS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing tunnels file:', error);
    throw error;
  }
}

// Mock function to simulate starting a tunnel
function startTunnel(tunnel: Tunnel): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate async operation
    setTimeout(() => {
      console.log(`Starting tunnel: ${tunnel.name} (${tunnel.id})`);
      
      // In real implementation, this would execute:
      // For Iran server (client):
      // 1. Create VXLAN interface: ip link add vxlan${tunnel.vni} type vxlan id ${tunnel.vni} remote ${tunnel.foreign_ip} dstport ${tunnel.vxlan_port}
      // 2. Set IP: ip addr add ${tunnel.iran_vxlan_ip}/24 dev vxlan${tunnel.vni}
      // 3. Bring up interface: ip link set vxlan${tunnel.vni} up
      // 4. Start Xray with SOCKS5 proxy on port ${tunnel.socks_port}
      
      // For Foreign server:
      // 1. Create VXLAN interface: ip link add vxlan${tunnel.vni} type vxlan id ${tunnel.vni} remote ${tunnel.iran_ip} dstport ${tunnel.vxlan_port}
      // 2. Set IP: ip addr add ${tunnel.foreign_vxlan_ip}/24 dev vxlan${tunnel.vni}
      // 3. Bring up interface: ip link set vxlan${tunnel.vni} up
      // 4. Configure routing and NAT rules
      
      resolve(true);
    }, 2000);
  });
}

// POST - Start tunnel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = readTunnels();
    const tunnelIndex = data.tunnels.findIndex(t => t.id === id);
    
    if (tunnelIndex === -1) {
      return NextResponse.json(
        { error: 'Tunnel not found' },
        { status: 404 }
      );
    }
    
    const tunnel = data.tunnels[tunnelIndex];
    
    if (tunnel.status === 'active') {
      return NextResponse.json(
        { error: 'Tunnel is already active' },
        { status: 400 }
      );
    }
    
    // Start the tunnel
    const success = await startTunnel(tunnel);
    
    if (success) {
      data.tunnels[tunnelIndex].status = 'active';
      data.tunnels[tunnelIndex].last_active = new Date().toISOString();
      
      // Update with mock stats
      data.tunnels[tunnelIndex].bandwidth_usage = `${Math.floor(Math.random() * 500) + 50} MB/s`;
      data.tunnels[tunnelIndex].connection_count = Math.floor(Math.random() * 100) + 1;
      
      writeTunnels(data);
      
      return NextResponse.json({
        message: 'Tunnel started successfully',
        tunnel: data.tunnels[tunnelIndex]
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to start tunnel' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error starting tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to start tunnel' },
      { status: 500 }
    );
  }
}