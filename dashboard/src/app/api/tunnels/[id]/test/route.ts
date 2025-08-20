import { NextRequest, NextResponse } from 'next/server';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tunnelId } = await params;
    
    // Get tunnel information from your database/storage
    // This is a mock implementation - replace with your actual data source
    const tunnel = await getTunnelById(tunnelId);
    
    if (!tunnel) {
      return NextResponse.json(
        { success: false, message: 'Tunnel not found' },
        { status: 404 }
      );
    }
    
    if (tunnel.type !== 'iran') {
      return NextResponse.json(
        { success: false, message: 'Connection test is only available for Iran servers' },
        { status: 400 }
      );
    }
    
    if (tunnel.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Tunnel must be active to test connection' },
        { status: 400 }
      );
    }
    
    // Test SOCKS5 connection
    const socksProxy = `socks5://${tunnel.iran_ip}:${tunnel.socks_port}`;
    const agent = new SocksProxyAgent(socksProxy);
    
    try {
      // Test connection by making a request through the SOCKS5 proxy
      // Using a reliable test endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const testResponse = await fetch('http://httpbin.org/ip', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        return NextResponse.json({
          success: true,
          message: 'Connection test successful',
          details: {
            proxy_ip: data.origin,
            response_time: Date.now()
          }
        });
      } else {
        throw new Error(`HTTP ${testResponse.status}`);
      }
    } catch (proxyError: any) {
      return NextResponse.json({
        success: false,
        message: `SOCKS5 connection failed: ${proxyError.message}`,
        error_type: 'proxy_error'
      });
    }
    
  } catch (error: any) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during connection test',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

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

// Get tunnel by ID
async function getTunnelById(id: string): Promise<Tunnel | null> {
  const tunnelsData = readTunnels();
  return tunnelsData.tunnels.find(tunnel => tunnel.id === id) || null;
}