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

// Mock function to simulate stopping a tunnel
function stopTunnel(tunnel: Tunnel): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate async operation
    setTimeout(() => {
      console.log(`Stopping tunnel: ${tunnel.name} (${tunnel.id})`);
      
      // In real implementation, this would execute:
      // 1. Stop Xray process (if running)
      // 2. Remove VXLAN interface: ip link delete vxlan${tunnel.vni}
      // 3. Clean up routing rules and NAT configurations
      // 4. Kill any related processes
      
      resolve(true);
    }, 1500);
  });
}

// POST - Stop tunnel
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
    
    if (tunnel.status === 'inactive') {
      return NextResponse.json(
        { error: 'Tunnel is already inactive' },
        { status: 400 }
      );
    }
    
    // Stop the tunnel
    const success = await stopTunnel(tunnel);
    
    if (success) {
      data.tunnels[tunnelIndex].status = 'inactive';
      data.tunnels[tunnelIndex].bandwidth_usage = '0 MB/s';
      data.tunnels[tunnelIndex].connection_count = 0;
      
      writeTunnels(data);
      
      return NextResponse.json({
        message: 'Tunnel stopped successfully',
        tunnel: data.tunnels[tunnelIndex]
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to stop tunnel' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error stopping tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to stop tunnel' },
      { status: 500 }
    );
  }
}