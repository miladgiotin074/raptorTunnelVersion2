import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
  bandwidth_usage: number;
  connection_count: number;
  created_at: string;
  last_active: string;
  error_message?: string;
}

interface TunnelsData {
  tunnels: Tunnel[];
}

const TUNNELS_FILE = path.join(process.cwd(), 'data', 'tunnels.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(TUNNELS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read tunnels from JSON file
function readTunnels(): TunnelsData {
  ensureDataDirectory();
  
  if (!fs.existsSync(TUNNELS_FILE)) {
    const initialData: TunnelsData = { tunnels: [] };
    fs.writeFileSync(TUNNELS_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
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
  ensureDataDirectory();
  
  try {
    fs.writeFileSync(TUNNELS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing tunnels file:', error);
    throw error;
  }
}

// Generate unique VNI
function generateVNI(existingTunnels: Tunnel[]): number {
  const usedVNIs = existingTunnels.map(t => t.vni);
  let vni;
  do {
    vni = Math.floor(Math.random() * 16777215) + 1; // VNI range: 1-16777215
  } while (usedVNIs.includes(vni));
  return vni;
}

// Generate network IP pair
function generateVXLANIPs(existingTunnels: Tunnel[]): { iran_vxlan_ip: string; foreign_vxlan_ip: string } {
  const usedSubnets = existingTunnels.map(t => {
    const iranIP = t.iran_vxlan_ip.split('.').slice(0, 3).join('.');
    return iranIP;
  });
  
  let subnet;
  let counter = 1;
  do {
    subnet = `10.100.${counter}`;
    counter++;
  } while (usedSubnets.includes(subnet) && counter < 255);
  
  return {
    iran_vxlan_ip: `${subnet}.2`,
    foreign_vxlan_ip: `${subnet}.1`
  };
}

// Generate connection code
function generateConnectionCode(tunnel: Partial<Tunnel>): string {
  const codeData = {
    type: 'tunnel_config',
    foreign_ip: tunnel.foreign_ip,
    iran_ip: tunnel.iran_ip,
    vxlan_port: tunnel.vxlan_port,
    vni: tunnel.vni,
    iran_vxlan_ip: tunnel.iran_vxlan_ip,
    foreign_vxlan_ip: tunnel.foreign_vxlan_ip,
    socks_port: tunnel.socks_port
  };
  
  return Buffer.from(JSON.stringify(codeData)).toString('base64');
}

// Mock bandwidth and connection data
function getMockStats(): { bandwidth_usage: number; connection_count: number } {
  const bandwidth = Math.floor(Math.random() * 200) + 50; // 50-250 MB/s
  const connections = Math.floor(Math.random() * 50) + 5; // 5-55 connections
  
  return {
    bandwidth_usage: bandwidth,
    connection_count: connections
  };
}

// GET - Retrieve all tunnels
export async function GET() {
  try {
    const data = readTunnels();
    
    // Update mock stats for active tunnels
    const updatedTunnels = data.tunnels.map(tunnel => {
      if (tunnel.status === 'active') {
        const stats = getMockStats();
        return {
          ...tunnel,
          bandwidth_usage: stats.bandwidth_usage,
          connection_count: stats.connection_count,
          last_active: new Date().toISOString()
        };
      }
      return tunnel;
    });
    
    // Write back updated data
    if (updatedTunnels.some((t, i) => t !== data.tunnels[i])) {
      writeTunnels({ tunnels: updatedTunnels });
    }
    
    return NextResponse.json({ tunnels: updatedTunnels });
  } catch (error) {
    console.error('Error fetching tunnels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tunnels' },
      { status: 500 }
    );
  }
}

// POST - Create new tunnel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, foreign_ip, iran_ip, vxlan_port = 4789, socks_port = 1080, connection_code } = body;
    
    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }
    
    const data = readTunnels();
    
    let newTunnel: Tunnel;
    
    if (type === 'foreign') {
      // Foreign server tunnel creation
      if (!iran_ip || !foreign_ip) {
        return NextResponse.json(
          { error: 'Iran IP and Foreign IP are required for foreign server' },
          { status: 400 }
        );
      }
      
      const vni = generateVNI(data.tunnels);
      const vxlanIPs = generateVXLANIPs(data.tunnels);
      
      newTunnel = {
        id: crypto.randomUUID(),
        name,
        type: 'foreign',
        status: 'inactive',
        foreign_ip: foreign_ip || '',
        iran_ip,
        vxlan_port,
        socks_port,
        vni,
        iran_vxlan_ip: vxlanIPs.iran_vxlan_ip,
        foreign_vxlan_ip: vxlanIPs.foreign_vxlan_ip,
        bandwidth_usage: 0,
        connection_count: 0,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };
      
      // Generate connection code
      const connectionCode = generateConnectionCode(newTunnel);
      
      data.tunnels.push(newTunnel);
      writeTunnels(data);
      
      return NextResponse.json({
        tunnel: newTunnel,
        connection_code: connectionCode
      });
      
    } else if (type === 'iran') {
      // Iran server tunnel creation
      if (connection_code) {
        // Create from connection code
        try {
          const decodedData = JSON.parse(Buffer.from(connection_code, 'base64').toString());
          
          if (decodedData.type !== 'tunnel_config') {
            return NextResponse.json(
              { error: 'Invalid connection code format' },
              { status: 400 }
            );
          }
          
          newTunnel = {
            id: crypto.randomUUID(),
            name: name,
            type: 'iran',
            status: 'inactive',
            foreign_ip: decodedData.foreign_ip,
            iran_ip: decodedData.iran_ip || '',
            vxlan_port: decodedData.vxlan_port,
            socks_port: decodedData.socks_port,
            vni: decodedData.vni,
            iran_vxlan_ip: decodedData.iran_vxlan_ip,
            foreign_vxlan_ip: decodedData.foreign_vxlan_ip,
            bandwidth_usage: 0,
            connection_count: 0,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          };
          
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid connection code' },
            { status: 400 }
          );
        }
      } else {
        // Manual creation
        if (!foreign_ip || !vxlan_port || !socks_port) {
          return NextResponse.json(
            { error: 'Foreign IP, network port, and SOCKS port are required for manual setup' },
            { status: 400 }
          );
        }
        
        const { vni, iran_vxlan_ip, foreign_vxlan_ip } = body;
        
        if (!vni || !iran_vxlan_ip || !foreign_vxlan_ip) {
          return NextResponse.json(
            { error: 'VNI and network IPs are required for manual setup' },
            { status: 400 }
          );
        }
        
        newTunnel = {
          id: crypto.randomUUID(),
          name,
          type: 'iran',
          status: 'inactive',
          foreign_ip,
          iran_ip: iran_ip || '',
          vxlan_port,
          socks_port,
          vni,
          iran_vxlan_ip,
          foreign_vxlan_ip,
          bandwidth_usage: 0,
          connection_count: 0,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        };
      }
      
      data.tunnels.push(newTunnel);
      writeTunnels(data);
      
      return NextResponse.json({ tunnel: newTunnel });
    }
    
    return NextResponse.json(
      { error: 'Invalid tunnel type' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error creating tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to create tunnel' },
      { status: 500 }
    );
  }
}

// PUT - Update tunnel
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tunnel ID is required' },
        { status: 400 }
      );
    }
    
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
      ...updates,
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

// DELETE - Delete tunnel
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tunnel ID is required' },
        { status: 400 }
      );
    }
    
    const data = readTunnels();
    const tunnelIndex = data.tunnels.findIndex(t => t.id === id);
    
    if (tunnelIndex === -1) {
      return NextResponse.json(
        { error: 'Tunnel not found' },
        { status: 404 }
      );
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