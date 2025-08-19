import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Check if running on Linux (Ubuntu)
export function isLinux(): boolean {
  return os.platform() === 'linux';
}

// Check if running on Windows
export function isWindows(): boolean {
  return os.platform() === 'win32';
}

// Execute shell command with error handling
export async function executeCommand(command: string): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const { stdout, stderr } = await execAsync(command);
    return {
      success: true,
      output: stdout.trim(),
      error: stderr.trim() || undefined
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message
    };
  }
}

// Check if command exists
export async function commandExists(command: string): Promise<boolean> {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

// Check if running as root
export async function isRoot(): Promise<boolean> {
  if (!isLinux()) return false;
  
  try {
    const { stdout } = await execAsync('id -u');
    return stdout.trim() === '0';
  } catch {
    return false;
  }
}

// Get network interfaces
export async function getNetworkInterfaces(): Promise<string[]> {
  if (!isLinux()) return [];
  
  try {
    const { stdout } = await execAsync('ip link show | grep -E "^[0-9]+:" | cut -d: -f2 | tr -d " "');
    return stdout.split('\n').filter(iface => iface && !iface.startsWith('lo'));
  } catch {
    return [];
  }
}

// Check if VXLAN interface exists
export async function vxlanInterfaceExists(vni: number): Promise<boolean> {
  if (!isLinux()) return false;
  
  try {
    await execAsync(`ip link show vxlan${vni}`);
    return true;
  } catch {
    return false;
  }
}

// Check if process is running
export async function isProcessRunning(processName: string): Promise<boolean> {
  if (!isLinux()) return false;
  
  try {
    const { stdout } = await execAsync(`pgrep -f "${processName}"`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

// Get process PID
export async function getProcessPid(processName: string): Promise<number | null> {
  if (!isLinux()) return null;
  
  try {
    const { stdout } = await execAsync(`pgrep -f "${processName}"`);
    const pid = parseInt(stdout.trim().split('\n')[0]);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

// Kill process by PID
export async function killProcess(pid: number): Promise<boolean> {
  if (!isLinux()) return false;
  
  try {
    await execAsync(`kill -9 ${pid}`);
    return true;
  } catch {
    return false;
  }
}

// Check if port is in use
export async function isPortInUse(port: number): Promise<boolean> {
  if (!isLinux()) return false;
  
  try {
    const { stdout } = await execAsync(`netstat -tuln | grep :${port}`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}