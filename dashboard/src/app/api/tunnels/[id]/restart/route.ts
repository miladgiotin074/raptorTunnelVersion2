import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isLinux, isWindows, executeCommand } from '../../../../../utils/system';
import { createVXLANInterface, setupNATRules, deleteVXLANInterface, removeNATRules, setupClientRouting } from '../../../../../utils/vxlan';
import { startXray, stopXray } from '../../../../../utils/xray';

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

// Real function to restart tunnel
async function restartTunnel(tunnel: Tunnel): Promise<{ success: boolean; error?: string }> {
  // Check if running on supported platform
  if (isWindows()) {
    return { success: false, error: 'Tunnel functionality is not supported on Windows. Please run on Ubuntu server.' };
  }
  
  if (!isLinux()) {
    return { success: false, error: 'Tunnel functionality is only supported on Linux systems.' };
  }

  try {
    console.log(`Restarting tunnel ${tunnel.id} (${tunnel.type})`);
    
    // Step 1: Stop existing tunnel components
    console.log('Stopping existing tunnel components...');
    
    // Stop Xray process
    const xrayStopResult = await stopXray(tunnel.socks_port);
    if (!xrayStopResult.success) {
      console.warn(`Failed to stop Xray: ${xrayStopResult.error}`);
    }
    
    // Remove NAT rules (for foreign servers) or client routes (for iran servers)
    if (tunnel.type === 'foreign') {
      const natRemoveResult = await removeNATRules(tunnel.foreign_vxlan_ip);
      if (!natRemoveResult.success) {
        console.warn(`Failed to remove NAT rules: ${natRemoveResult.error}`);
      }
    } else {
      // Remove client routes for Iran servers
      const routeRemoveCmd = `ip route del ${tunnel.foreign_vxlan_ip}/32`;
      const routeRemoveResult = await executeCommand(routeRemoveCmd);
      if (!routeRemoveResult.success) {
        console.warn(`Failed to remove client route: ${routeRemoveResult.error}`);
      }
    }
    
    // Remove VXLAN interface
    const vxlanDeleteResult = await deleteVXLANInterface(tunnel.vni);
    if (!vxlanDeleteResult.success) {
      console.warn(`Failed to delete VXLAN interface: ${vxlanDeleteResult.error}`);
    }
    
    // Step 2: Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Start tunnel components again
    console.log('Starting tunnel components...');
    
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

// POST - Restart tunnel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await readTunnels();
    const tunnelIndex = data.tunnels.findIndex(t => t.id === id);
    
    if (tunnelIndex === -1) {
      return NextResponse.json(
        { error: 'Tunnel not found' },
        { status: 404 }
      );
    }
    
    const tunnel = data.tunnels[tunnelIndex];
    
    // Restart the tunnel (works regardless of current status)
    const result = await restartTunnel(tunnel);
    
    if (result.success) {
      data.tunnels[tunnelIndex].status = 'active';
      data.tunnels[tunnelIndex].last_active = new Date().toISOString();
      data.tunnels[tunnelIndex].error_message = undefined;
      
      // Initialize with zero stats (will be updated by monitoring)
      data.tunnels[tunnelIndex].bandwidth_usage = 0;
      data.tunnels[tunnelIndex].connection_count = 0;
      
      await writeTunnels(data);
      
      return NextResponse.json({
        message: 'Tunnel restarted successfully',
        tunnel: data.tunnels[tunnelIndex]
      });
    } else {
      // Update tunnel status to error
      data.tunnels[tunnelIndex].status = 'error';
      data.tunnels[tunnelIndex].error_message = result.error;
      await writeTunnels(data);
      
      return NextResponse.json(
        { error: result.error || 'Failed to restart tunnel' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error restarting tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to restart tunnel: ' + error.message },
      { status: 500 }
    );
  }
}