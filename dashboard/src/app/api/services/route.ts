import { NextRequest, NextResponse } from 'next/server';
import {
  getAllXrayServices,
  cleanupOrphanedServices,
  getXrayServicesResourceUsage,
  restartAllXrayServices,
  healthCheckAllServices,
  getServiceLogs
} from '../../../utils/serviceManager';
import fs from 'fs';
import path from 'path';

const TUNNELS_FILE = path.join(process.cwd(), 'data', 'tunnels.json');

// Read tunnels data
function readTunnels() {
  try {
    if (!fs.existsSync(TUNNELS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(TUNNELS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tunnels:', error);
    return [];
  }
}

// GET /api/services - Get all services information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tunnelId = searchParams.get('tunnelId');
    const lines = searchParams.get('lines');

    switch (action) {
      case 'list':
        const servicesResult = await getAllXrayServices();
        if (!servicesResult.success) {
          return NextResponse.json(
            { error: servicesResult.error },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          services: servicesResult.services
        });

      case 'resource-usage':
        const usageResult = await getXrayServicesResourceUsage();
        if (!usageResult.success) {
          return NextResponse.json(
            { error: usageResult.error },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          usage: usageResult.usage
        });

      case 'health-check':
        const healthResult = await healthCheckAllServices();
        if (!healthResult.success) {
          return NextResponse.json(
            { error: healthResult.error },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          healthStatus: healthResult.healthStatus
        });

      case 'logs':
        if (!tunnelId) {
          return NextResponse.json(
            { error: 'tunnelId parameter is required for logs' },
            { status: 400 }
          );
        }
        const logLines = lines ? parseInt(lines) : 50;
        const logsResult = await getServiceLogs(tunnelId, logLines);
        if (!logsResult.success) {
          return NextResponse.json(
            { error: logsResult.error },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          logs: logsResult.logs
        });

      default:
        // Default: return services list
        const defaultResult = await getAllXrayServices();
        if (!defaultResult.success) {
          return NextResponse.json(
            { error: defaultResult.error },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          services: defaultResult.services
        });
    }
  } catch (error: any) {
    console.error('Error in services GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/services - Perform service management actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'cleanup-orphaned':
        // Get active tunnel IDs
        const tunnels = readTunnels();
        const activeTunnelIds = tunnels.map((tunnel: any) => tunnel.id);
        
        const cleanupResult = await cleanupOrphanedServices(activeTunnelIds);
        if (!cleanupResult.success) {
          return NextResponse.json(
            { error: cleanupResult.error },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${cleanupResult.cleanedServices?.length || 0} orphaned services`,
          cleanedServices: cleanupResult.cleanedServices
        });

      case 'restart-all':
        const restartResult = await restartAllXrayServices();
        if (!restartResult.success) {
          return NextResponse.json(
            { error: restartResult.error },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: `Restarted ${restartResult.restarted?.length || 0} services`,
          restarted: restartResult.restarted,
          failed: restartResult.failed
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in services POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/services - Clean up all services (emergency cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');
    
    if (confirm !== 'true') {
      return NextResponse.json(
        { error: 'Confirmation required. Add ?confirm=true to proceed.' },
        { status: 400 }
      );
    }

    // Get all services and force cleanup
    const servicesResult = await getAllXrayServices();
    if (!servicesResult.success) {
      return NextResponse.json(
        { error: servicesResult.error },
        { status: 500 }
      );
    }

    const cleanupResult = await cleanupOrphanedServices([]);
    if (!cleanupResult.success) {
      return NextResponse.json(
        { error: cleanupResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Emergency cleanup completed. Removed ${cleanupResult.cleanedServices?.length || 0} services`,
      cleanedServices: cleanupResult.cleanedServices
    });
  } catch (error: any) {
    console.error('Error in services DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}