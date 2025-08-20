import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isLinux, isWindows } from '../../../../../utils/system';
import { deleteVXLANInterface, removeNATRules } from '../../../../../utils/vxlan';
import { stopXray } from '../../../../../utils/xray';

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
  }
}

// Real function to stop tunnel
async function stopTunnel(tunnel: Tunnel): Promise<{ success: boolean; error?: string }> {
  // Check if running on supported platform
  if (isWindows()) {
    return { success: false, error: 'Tunnel functionality is not supported on Windows. Please run on Ubuntu server.' };
  }
  
  if (!isLinux()) {
    return { success: false, error: 'Tunnel functionality is only supported on Linux systems.' };
  }

  try {
    console.log(`Stopping tunnel ${tunnel.id} (${tunnel.type})`);
    
    // 1. Stop Xray process
    const xrayResult = await stopXray(tunnel.socks_port);
    if (!xrayResult.success) {
      console.warn(`Failed to stop Xray: ${xrayResult.error}`);
      // Continue with cleanup even if Xray stop fails
    }
    
    // 2. Remove NAT rules (for foreign servers)
    if (tunnel.type === 'foreign') {
      const natResult = await removeNATRules(tunnel.foreign_vxlan_ip);
      if (!natResult.success) {
        console.warn(`Failed to remove NAT rules: ${natResult.error}`);
        // Continue with cleanup even if NAT removal fails
      }
    }
    
    // 3. Remove VXLAN interface with proper cleanup
    const vxlanResult = await deleteVXLANInterface(tunnel.vni, tunnel.iran_vxlan_ip, tunnel.foreign_vxlan_ip);
    if (!vxlanResult.success) {
      return { success: false, error: `VXLAN cleanup failed: ${vxlanResult.error}` };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// POST - Stop tunnel
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
    
    if (tunnel.status === 'inactive') {
      return NextResponse.json(
        { error: 'Tunnel is already inactive' },
        { status: 400 }
      );
    }
    
    // Stop the tunnel
    const result = await stopTunnel(tunnel);
    
    if (result.success) {
      data.tunnels[tunnelIndex].status = 'inactive';
      data.tunnels[tunnelIndex].bandwidth_usage = 0;
      data.tunnels[tunnelIndex].connection_count = 0;
      data.tunnels[tunnelIndex].error_message = undefined;
      
      await writeTunnels(data);
      
      return NextResponse.json({
        message: 'Tunnel stopped successfully',
        tunnel: data.tunnels[tunnelIndex]
      });
    } else {
      // Update tunnel status to error
      data.tunnels[tunnelIndex].status = 'error';
      data.tunnels[tunnelIndex].error_message = result.error;
      await writeTunnels(data);
      
      return NextResponse.json(
        { error: result.error || 'Failed to stop tunnel' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error stopping tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to stop tunnel: ' + error.message },
      { status: 500 }
    );
  }
}