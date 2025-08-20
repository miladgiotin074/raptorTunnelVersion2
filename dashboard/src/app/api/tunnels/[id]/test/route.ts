import { NextRequest, NextResponse } from 'next/server';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tunnelId = params.id;
    
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
    
    // Test SOCKS5 connection using localhost (same as curl command)
    // This tests the actual SOCKS5 proxy that's running on the Iran server
    const socksProxy = `socks5://127.0.0.1:${tunnel.socks_port}`;
    const agent = new SocksProxyAgent(socksProxy);
    
    const startTime = Date.now();
    
    try {
      // Test connection by making a request through the SOCKS5 proxy
      // Using the same endpoint as the user's curl command
      const testResponse = await fetch('http://api.ipify.org?format=json', {
        agent,
        timeout: 15000, // 15 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        
        // Verify that the response comes from foreign server IP
        const isFromForeignServer = data.ip === tunnel.foreign_ip;
        
        return NextResponse.json({
          success: true,
          message: isFromForeignServer 
            ? 'SOCKS5 connection test successful - traffic routing through foreign server' 
            : 'SOCKS5 connection successful but may not be routing through expected foreign server',
          details: {
            proxy_ip: data.ip,
            expected_foreign_ip: tunnel.foreign_ip,
            routing_correct: isFromForeignServer,
            response_time_ms: responseTime,
            tested_via: `127.0.0.1:${tunnel.socks_port}`
          }
        });
      } else {
        throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
      }
    } catch (proxyError: any) {
      const responseTime = Date.now() - startTime;
      
      // Provide more detailed error information
       let errorMessage = 'SOCKS5 connection failed';
       let errorDetails = proxyError.message;
       
       if (proxyError.code === 'ECONNREFUSED') {
         errorMessage = 'SOCKS5 proxy not accessible - check if proxy is running on the specified port';
       } else if (proxyError.code === 'ETIMEDOUT') {
         errorMessage = 'Connection timeout - proxy may be down or network issues';
       } else if (proxyError.code === 'ENOTFOUND') {
         errorMessage = 'Cannot resolve target - check network configuration';
       }
       
       return NextResponse.json({
         success: false,
         message: errorMessage,
         error_type: 'socks_proxy_error',
         details: {
           error_code: proxyError.code,
           error_details: errorDetails,
           response_time_ms: responseTime,
           tested_via: `127.0.0.1:${tunnel.socks_port}`,
           troubleshooting: {
             check_proxy: 'Verify SOCKS5 proxy is running on the Iran server',
             check_port: `Ensure port ${tunnel.socks_port} is open and accessible`,
             check_tunnel: 'Verify tunnel connection between Iran and foreign servers'
           }
         }
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