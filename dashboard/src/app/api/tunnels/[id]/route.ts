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

// Mock function to simulate tunnel operations
function simulateTunnelOperation(operation: string, tunnel: Tunnel): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate async operation
    setTimeout(() => {
      console.log(`${operation} tunnel: ${tunnel.name} (${tunnel.id})`);
      // In real implementation, this would execute actual VXLAN and Xray commands
      resolve(true);
    }, 1000);
  });
}

// GET - Get specific tunnel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = readTunnels();
    const tunnel = data.tunnels.find(t => t.id === id);
    
    if (!tunnel) {
      return NextResponse.json(
        { error: 'Tunnel not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ tunnel });
  } catch (error) {
    console.error('Error fetching tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tunnel' },
      { status: 500 }
    );
  }
}

// PUT - Update specific tunnel
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const data = readTunnels();
    const tunnelIndex = data.tunnels.findIndex(t => t.id === id);
    
    if (tunnelIndex === -1) {
      return NextResponse.json(
        { error: 'Tunnel not found' },
        { status: 404 }
      );
    }
    
    data.tunnels[tunnelIndex] = {
      ...data.tunnels[tunnelIndex],
      ...body,
      last_active: new Date().toISOString()
    };
    
    writeTunnels(data);
    
    return NextResponse.json({ tunnel: data.tunnels[tunnelIndex] });
  } catch (error) {
    console.error('Error updating tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to update tunnel' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific tunnel
export async function DELETE(
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
    
    // Stop tunnel before deleting if it's active
    const tunnel = data.tunnels[tunnelIndex];
    if (tunnel.status === 'active') {
      await simulateTunnelOperation('stop', tunnel);
    }
    
    data.tunnels.splice(tunnelIndex, 1);
    writeTunnels(data);
    
    return NextResponse.json({ message: 'Tunnel deleted successfully' });
  } catch (error) {
    console.error('Error deleting tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to delete tunnel' },
      { status: 500 }
    );
  }
}