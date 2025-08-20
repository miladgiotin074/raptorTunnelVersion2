import { executeCommand, isLinux, vxlanInterfaceExists, isRoot } from './system';

interface VXLANConfig {
  vni: number;
  localIP: string;
  remoteIP: string;
  port: number;
  vxlanIP: string;
}

// Create VXLAN interface
export async function createVXLANInterface(config: VXLANConfig): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'VXLAN is only supported on Linux systems' };
  }

  const isRootUser = await isRoot();
  if (!isRootUser) {
    return { success: false, error: 'Root privileges required to create VXLAN interface' };
  }

  try {
    const interfaceName = `vxlan${config.vni}`;
    
    // Check if interface already exists
    const exists = await vxlanInterfaceExists(config.vni);
    if (exists) {
      return { success: false, error: `VXLAN interface ${interfaceName} already exists` };
    }

    // Create VXLAN interface
    const createCmd = `ip link add ${interfaceName} type vxlan id ${config.vni} remote ${config.remoteIP} dstport ${config.port} dev $(ip route get ${config.remoteIP} | grep -oP 'dev \\K\\S+')`;
    const createResult = await executeCommand(createCmd);
    
    if (!createResult.success) {
      return { success: false, error: `Failed to create VXLAN interface: ${createResult.error}` };
    }

    // Set IP address
    const setIPCmd = `ip addr add ${config.vxlanIP}/24 dev ${interfaceName}`;
    const setIPResult = await executeCommand(setIPCmd);
    
    if (!setIPResult.success) {
      // Cleanup on failure
      await executeCommand(`ip link delete ${interfaceName}`);
      return { success: false, error: `Failed to set IP address: ${setIPResult.error}` };
    }

    // Bring interface up
    const upCmd = `ip link set ${interfaceName} up`;
    const upResult = await executeCommand(upCmd);
    
    if (!upResult.success) {
      // Cleanup on failure
      await executeCommand(`ip link delete ${interfaceName}`);
      return { success: false, error: `Failed to bring interface up: ${upResult.error}` };
    }

    // Add route for VXLAN network
    const routeCmd = `ip route add ${config.vxlanIP.split('.').slice(0, 3).join('.')}.0/24 dev ${interfaceName}`;
    await executeCommand(routeCmd); // Don't fail if route already exists

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Setup client-side routing to foreign server
export async function setupClientRouting(config: { foreignVxlanIP: string; socksPort: number }): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'Client routing is only supported on Linux systems' };
  }

  const isRootUser = await isRoot();
  if (!isRootUser) {
    return { success: false, error: 'Root privileges required to setup client routing' };
  }

  try {
    // Setup route to foreign SOCKS5 server through VXLAN
    const routeCmd = `ip route add ${config.foreignVxlanIP}/32 dev $(ip route | grep 'vxlan.*scope link' | head -1 | awk '{print $3}')`;
    const routeResult = await executeCommand(routeCmd);
    
    if (!routeResult.success) {
      return { success: false, error: `Failed to setup route to foreign server: ${routeResult.error}` };
    }

    // Test connectivity to foreign SOCKS5 server
    const testCmd = `timeout 5 nc -z ${config.foreignVxlanIP} ${config.socksPort}`;
    const testResult = await executeCommand(testCmd);
    
    if (!testResult.success) {
      console.warn(`Warning: Cannot connect to SOCKS5 server at ${config.foreignVxlanIP}:${config.socksPort}`);
      // Don't fail here as the server might not be ready yet
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete VXLAN interface
export async function deleteVXLANInterface(vni: number): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'VXLAN is only supported on Linux systems' };
  }

  const isRootUser = await isRoot();
  if (!isRootUser) {
    return { success: false, error: 'Root privileges required to delete VXLAN interface' };
  }

  try {
    const interfaceName = `vxlan${vni}`;
    
    // Check if interface exists
    const exists = await vxlanInterfaceExists(vni);
    if (!exists) {
      return { success: true }; // Already deleted
    }

    // Delete VXLAN interface
    const deleteCmd = `ip link delete ${interfaceName}`;
    const result = await executeCommand(deleteCmd);
    
    if (!result.success) {
      return { success: false, error: `Failed to delete VXLAN interface: ${result.error}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Check VXLAN interface status
export async function getVXLANStatus(vni: number): Promise<{ exists: boolean; isUp: boolean; ip?: string }> {
  if (!isLinux()) {
    return { exists: false, isUp: false };
  }

  try {
    const interfaceName = `vxlan${vni}`;
    
    // Check if interface exists
    const exists = await vxlanInterfaceExists(vni);
    if (!exists) {
      return { exists: false, isUp: false };
    }

    // Check if interface is up
    const statusResult = await executeCommand(`ip link show ${interfaceName}`);
    const isUp = statusResult.success && statusResult.output.includes('state UP');

    // Get IP address
    let ip: string | undefined;
    if (isUp) {
      const ipResult = await executeCommand(`ip addr show ${interfaceName} | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1`);
      if (ipResult.success && ipResult.output) {
        ip = ipResult.output;
      }
    }

    return { exists: true, isUp, ip };
  } catch {
    return { exists: false, isUp: false };
  }
}

// Setup NAT rules for foreign server
export async function setupNATRules(vxlanIP: string): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'NAT rules are only supported on Linux systems' };
  }

  const isRootUser = await isRoot();
  if (!isRootUser) {
    return { success: false, error: 'Root privileges required to setup NAT rules' };
  }

  try {
    // Enable IP forwarding
    await executeCommand('echo 1 > /proc/sys/net/ipv4/ip_forward');
    
    // Get default interface
    const defaultIfaceResult = await executeCommand("ip route | grep default | awk '{print $5}' | head -1");
    if (!defaultIfaceResult.success || !defaultIfaceResult.output) {
      return { success: false, error: 'Could not determine default network interface' };
    }
    
    const defaultIface = defaultIfaceResult.output;
    const vxlanNetwork = vxlanIP.split('.').slice(0, 3).join('.') + '.0/24';
    
    // Add MASQUERADE rule
    const masqueradeCmd = `iptables -t nat -A POSTROUTING -s ${vxlanNetwork} -o ${defaultIface} -j MASQUERADE`;
    const masqueradeResult = await executeCommand(masqueradeCmd);
    
    if (!masqueradeResult.success) {
      return { success: false, error: `Failed to add MASQUERADE rule: ${masqueradeResult.error}` };
    }
    
    // Add FORWARD rules
    const forwardCmd1 = `iptables -A FORWARD -i ${defaultIface} -o vxlan* -m state --state RELATED,ESTABLISHED -j ACCEPT`;
    const forwardCmd2 = `iptables -A FORWARD -i vxlan* -o ${defaultIface} -j ACCEPT`;
    
    await executeCommand(forwardCmd1);
    await executeCommand(forwardCmd2);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Remove NAT rules
export async function removeNATRules(vxlanIP: string): Promise<{ success: boolean; error?: string }> {
  if (!isLinux()) {
    return { success: false, error: 'NAT rules are only supported on Linux systems' };
  }

  const isRootUser = await isRoot();
  if (!isRootUser) {
    return { success: false, error: 'Root privileges required to remove NAT rules' };
  }

  try {
    // Get default interface
    const defaultIfaceResult = await executeCommand("ip route | grep default | awk '{print $5}' | head -1");
    if (!defaultIfaceResult.success || !defaultIfaceResult.output) {
      return { success: true }; // If we can't get interface, assume cleanup is not needed
    }
    
    const defaultIface = defaultIfaceResult.output;
    const vxlanNetwork = vxlanIP.split('.').slice(0, 3).join('.') + '.0/24';
    
    // Remove MASQUERADE rule
    const masqueradeCmd = `iptables -t nat -D POSTROUTING -s ${vxlanNetwork} -o ${defaultIface} -j MASQUERADE`;
    await executeCommand(masqueradeCmd); // Don't fail if rule doesn't exist
    
    // Remove FORWARD rules
    const forwardCmd1 = `iptables -D FORWARD -i ${defaultIface} -o vxlan* -m state --state RELATED,ESTABLISHED -j ACCEPT`;
    const forwardCmd2 = `iptables -D FORWARD -i vxlan* -o ${defaultIface} -j ACCEPT`;
    
    await executeCommand(forwardCmd1);
    await executeCommand(forwardCmd2);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}