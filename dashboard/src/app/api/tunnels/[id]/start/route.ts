import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isLinux, isWindows } from '../../../../../utils/system';
import { createVXLANInterface, setupNATRules, setupClientRouting } from '../../../../../utils/vxlan';
import { startXray } from '../../../../../utils/xray';

interface Tunnel {
  id: string;
  name: string;
  type: 'iran' | 'foreign';
  status: 'active' | 'inactive' | 'error';
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

// Read tunnels from JSON file
async function readTunnels(): Promise<TunnelsData> {
  try {
    const data = await fs.readFile(TUNNELS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return { tunnels: [] };
    }
    console.error('Error reading tunnels file:', error);
    return { tunnels: [] };
  }
}

// Write tunnels to JSON file
async function writeTunnels(data: TunnelsData): Promise<void> {
  const dataDir = path.dirname(TUNNELS_FILE);
  
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(TUNNELS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing tunnels file:', error);
    throw error;
  }
}

// Real function to start tunnel
async function startTunnel(tunnel: Tunnel): Promise<{ success: boolean; error?: string }> {
  // Check if running on supported platform
  if (isWindows()) {
    return { success: false, error: 'Tunnel functionality is not supported on Windows. Please run on Ubuntu server.' };
  }
  
  if (!isLinux()) {
    return { success: false, error: 'Tunnel functionality is only supported on Linux systems.' };
  }

  try {
    console.log(`Starting tunnel ${tunnel.id} (${tunnel.type})`);
    
    if (tunnel.type === 'iran') {
      // Iran server setup (CLIENT SIDE)
      // 1. Create VXLAN interface
      const vxlanResult = await createVXLANInterface({
        vni: tunnel.vni,
        localIP: tunnel.iran_ip,
        remoteIP: tunnel.foreign_ip,
        port: tunnel.vxlan_port,
        vxlanIP: tunnel.iran_vxlan_ip
      });
      
      if (!vxlanResult.success) {
        return { success: false, error: `VXLAN setup failed: ${vxlanResult.error}` };
      }
      
      // 2. Start Xray SOCKS5 server on Iran server (proxy to foreign server)
      const xrayResult = await startXray({
        socksPort: tunnel.socks_port,
        vxlanIP: tunnel.iran_vxlan_ip,
        serverType: 'iran',
        remoteVxlanIP: tunnel.foreign_vxlan_ip
      });
      
      if (!xrayResult.success) {
        return { success: false, error: `Xray startup failed: ${xrayResult.error}` };
      }
      
      // 3. Setup client-side routing to foreign server
      const routeResult = await setupClientRouting({
        foreignVxlanIP: tunnel.foreign_vxlan_ip,
        socksPort: tunnel.socks_port
      });
      
      if (!routeResult.success) {
        return { success: false, error: `Client routing setup failed: ${routeResult.error}` };
      }
      
    } else {
      // Foreign server setup (SERVER SIDE)
      // 1. Create VXLAN interface
      const vxlanResult = await createVXLANInterface({
        vni: tunnel.vni,
        localIP: tunnel.foreign_ip,
        remoteIP: tunnel.iran_ip,
        port: tunnel.vxlan_port,
        vxlanIP: tunnel.foreign_vxlan_ip
      });
      
      if (!vxlanResult.success) {
        return { success: false, error: `VXLAN setup failed: ${vxlanResult.error}` };
      }
      
      // 2. Start Xray SOCKS5 server on foreign server
      const xrayResult = await startXray({
        socksPort: tunnel.socks_port,
        vxlanIP: tunnel.foreign_vxlan_ip,
        serverType: 'foreign'
      });
      
      if (!xrayResult.success) {
        return { success: false, error: `Xray startup failed: ${xrayResult.error}` };
      }
      
      // 3. Setup NAT rules for internet access
      const natResult = await setupNATRules(tunnel.foreign_vxlan_ip);
      if (!natResult.success) {
        return { success: false, error: `NAT setup failed: ${natResult.error}` };
      }
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// POST - Start tunnel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await readTunnels();
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
    const result = await startTunnel(tunnel);
    
    if (result.success) {
      data.tunnels[tunnelIndex].status = 'active';
      data.tunnels[tunnelIndex].last_active = new Date().toISOString();
      data.tunnels[tunnelIndex].error_message = undefined;
      
      // Initialize with zero stats (will be updated by monitoring)
      data.tunnels[tunnelIndex].bandwidth_usage = 0;
      data.tunnels[tunnelIndex].connection_count = 0;
      
      await writeTunnels(data);
      
      return NextResponse.json({
        message: 'Tunnel started successfully',
        tunnel: data.tunnels[tunnelIndex]
      });
    } else {
      // Update tunnel status to error
      data.tunnels[tunnelIndex].status = 'error';
      data.tunnels[tunnelIndex].error_message = result.error;
      await writeTunnels(data);
      
      return NextResponse.json(
        { error: result.error || 'Failed to start tunnel' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error starting tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to start tunnel: ' + error.message },
      { status: 500 }
    );
  }
}