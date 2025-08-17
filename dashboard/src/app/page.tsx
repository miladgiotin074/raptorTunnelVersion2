'use client';

import { RadialChart } from '@/components/DashboardCharts';
import { CpuIcon, MemoryStickIcon, ClockIcon, HardDriveIcon, NetworkIcon, GlobeIcon, ActivityIcon, ServerIcon, TrendingUpIcon, WifiIcon, MapPinIcon, RefreshCwIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SystemInfo {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    speed: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  uptime: string;
  network: {
    publicIp: string;
    localIp: string;
    hostname: string;
    platform: string;
    arch: string;
  };
  activeTunnels: number;
  timestamp: string;
}

export default function Home() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function for automatic refresh (without loading state)
  const fetchSystemInfoAuto = async () => {
    try {
      setError(null);
      const response = await fetch('/api/system-info');
      if (!response.ok) {
        throw new Error('Failed to fetch system information');
      }
      const data = await response.json();
      setSystemInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching system info:', err);
    }
  };
  
  // Function for manual refresh (with loading state)
  const fetchSystemInfoManual = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/system-info');
      if (!response.ok) {
        throw new Error('Failed to fetch system information');
      }
      const data = await response.json();
      setSystemInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching system info:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Initial load with loading state
    fetchSystemInfoManual();
    // Auto refresh every 3 seconds without loading state
    const interval = setInterval(fetchSystemInfoAuto, 3000);
    return () => clearInterval(interval);
  }, []);

  // Use real data or fallback to dummy data
  const cpuUsage = systemInfo?.cpu.usage ?? 45;
  const ramUsage = systemInfo?.memory.usage ?? 60;
  const uptime = systemInfo?.system.uptime ?? '5 days';
  const diskSpace = systemInfo?.storage.totalSize ? `${systemInfo.storage.totalSize} GB total` : '120 GB total';
  const activeTunnels = systemInfo?.activeTunnels ?? 3;
  const publicIp = systemInfo?.network.primaryInterface?.ip ?? '192.168.1.100';

  

  

  const handleRefresh = () => {
    fetchSystemInfoManual();
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-gray-100">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-400">Real-time system monitoring and analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 border border-teal-400/30 hover:border-teal-400/50 rounded-xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh Dashboard"
        >
          <RefreshCwIcon className={`h-5 w-5 text-teal-400 group-hover:text-teal-300 transition-all duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          <span className="text-teal-400 group-hover:text-teal-300 font-medium">{loading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>
      
      {/* Error Notification */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-red-400 font-medium">Error: {error}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Tunnels Card */}
        <div className="relative bg-gradient-to-br from-teal-500/10 via-gray-800/60 to-cyan-500/10 backdrop-blur-sm border border-teal-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-teal-500/20 hover:scale-[1.05] hover:border-teal-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-teal-500/30 to-cyan-500/20 rounded-xl group-hover:from-teal-500/40 group-hover:to-cyan-500/30 group-hover:scale-110 transition-all duration-300">
                <WifiIcon className="h-7 w-7 text-teal-300 group-hover:text-teal-200" />
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUpIcon className="h-4 w-4 text-green-400 animate-pulse" />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-medium">Total Tunnels</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-4xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">{activeTunnels}</p>
              <span className="text-green-400 text-sm font-semibold">+2 today</span>
            </div>
            <div className="mt-3 flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-teal-400 rounded-full mr-2"></div>
              <span>All active</span>
            </div>
          </div>
        </div>

        {/* CPU Usage Card */}
        <div className="relative bg-gradient-to-br from-blue-500/10 via-gray-800/60 to-indigo-500/10 backdrop-blur-sm border border-blue-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.05] hover:border-blue-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/30 to-indigo-500/20 rounded-xl group-hover:from-blue-500/40 group-hover:to-indigo-500/30 group-hover:scale-110 transition-all duration-300">
                <CpuIcon className="h-7 w-7 text-blue-300 group-hover:text-blue-200" />
              </div>
              <div className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all duration-300 ${
                cpuUsage > 70 
                  ? 'bg-red-500/20 text-red-300 border-red-400/30 shadow-red-500/20' 
                  : cpuUsage > 50 
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30 shadow-yellow-500/20' 
                  : 'bg-green-500/20 text-green-300 border-green-400/30 shadow-green-500/20'
              }`}>
                {cpuUsage > 70 ? 'High' : cpuUsage > 50 ? 'Medium' : 'Low'}
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-medium">CPU Usage</p>
            <div className="flex items-baseline space-x-2 mb-3">
              <p className="text-4xl font-bold text-blue-300">{cpuUsage}%</p>
              <span className="text-gray-500 text-sm">of {systemInfo?.cpu.cores ?? 4} cores</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2.5 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{width: `${cpuUsage}%`}}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{systemInfo?.cpu.speed ? `${(systemInfo.cpu.speed / 1000).toFixed(1)} GHz` : '2.4 GHz'}</span>
              <span>Temp: 65°C</span>
            </div>
          </div>
        </div>

        {/* RAM Usage Card */}
        <div className="relative bg-gradient-to-br from-purple-500/10 via-gray-800/60 to-pink-500/10 backdrop-blur-sm border border-purple-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.05] hover:border-purple-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-xl group-hover:from-purple-500/40 group-hover:to-pink-500/30 group-hover:scale-110 transition-all duration-300">
                <MemoryStickIcon className="h-7 w-7 text-purple-300 group-hover:text-purple-200" />
              </div>
              <div className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all duration-300 ${
                ramUsage > 70 
                  ? 'bg-red-500/20 text-red-300 border-red-400/30 shadow-red-500/20' 
                  : ramUsage > 50 
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30 shadow-yellow-500/20' 
                  : 'bg-green-500/20 text-green-300 border-green-400/30 shadow-green-500/20'
              }`}>
                {ramUsage > 70 ? 'High' : ramUsage > 50 ? 'Medium' : 'Low'}
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-medium">RAM Usage</p>
            <div className="flex items-baseline space-x-2 mb-3">
              <p className="text-4xl font-bold text-purple-300">{ramUsage}%</p>
              <span className="text-gray-500 text-sm">of {systemInfo?.memory.total ?? 16}GB</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2.5 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{width: `${ramUsage}%`}}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{systemInfo?.memory.used ?? 9.6}GB used</span>
              <span>{systemInfo?.memory.free ?? 6.4}GB free</span>
            </div>
          </div>
        </div>

        {/* Uptime Card */}
        <div className="relative bg-gradient-to-br from-green-500/10 via-gray-800/60 to-emerald-500/10 backdrop-blur-sm border border-green-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-green-500/20 hover:scale-[1.05] hover:border-green-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-xl group-hover:from-green-500/40 group-hover:to-emerald-500/30 group-hover:scale-110 transition-all duration-300">
                <ClockIcon className="h-7 w-7 text-green-300 group-hover:text-green-200" />
              </div>
              <div className="flex items-center space-x-2">
                <ActivityIcon className="h-4 w-4 text-green-400 animate-pulse" />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-medium">System Uptime</p>
            <div className="flex items-baseline space-x-2 mb-3">
              <p className="text-4xl font-bold text-green-300">{uptime}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Availability</span>
                <span className="text-green-400 font-semibold">99.98%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Last restart</span>
                <span className="text-gray-500">5 days ago</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30 p-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-4 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-2xl mr-5 group-hover:from-indigo-500/40 group-hover:to-purple-500/30 transition-all duration-300">
                <ServerIcon className="h-8 w-8 text-indigo-300 group-hover:text-indigo-200 transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Server Info</h2>
                <p className="text-gray-400 mt-1">System information & status</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IP Address */}
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-teal-500/10 hover:to-cyan-500/10 border border-gray-600/20 hover:border-teal-400/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-500/20 rounded-xl group-hover/item:bg-teal-500/30 group-hover/item:scale-110 transition-all duration-300">
                   <GlobeIcon className="h-6 w-6 text-teal-400 group-hover/item:text-teal-300" />
                </div>
                <div className="text-teal-400 text-xs font-semibold px-2 py-1 bg-teal-500/20 rounded-full">
                  PUBLIC
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">IP Address</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">IPv4</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-teal-400 font-bold">{publicIp}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(publicIp)}
                      className="p-1 hover:bg-teal-500/20 rounded transition-colors duration-200 group"
                      title="Copy IP Address"
                    >
                      <svg className="h-4 w-4 text-gray-400 group-hover:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Protocol</span>
                  <span className="text-cyan-400 font-semibold">TCP/IP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className="text-green-400 font-semibold">Online</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>Last check: </span>
                  <span className="text-gray-300">2 minutes ago</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-blue-500/10 hover:to-indigo-500/10 border border-gray-600/20 hover:border-blue-400/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover/item:bg-blue-500/30 group-hover/item:scale-110 transition-all duration-300">
                   <MapPinIcon className="h-6 w-6 text-blue-400 group-hover/item:text-blue-300" />
                </div>
                <div className="text-blue-400 text-xs font-semibold px-2 py-1 bg-blue-500/20 rounded-full">
                  ACTIVE
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Location</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Country</span>
                  <span className="text-blue-400 font-bold">{systemInfo?.network.hostname ? 'Server Location' : 'Iran'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Region</span>
                  <span className="text-indigo-400 font-semibold">Middle East</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Timezone</span>
                  <span className="text-purple-400 font-semibold">UTC+3:30</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>Latency: </span>
                  <span className="text-gray-300">12ms average</span>
                </div>
              </div>
            </div>

            {/* Storage */}
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-purple-500/10 hover:to-pink-500/10 border border-gray-600/20 hover:border-purple-400/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover/item:bg-purple-500/30 group-hover/item:scale-110 transition-all duration-300">
                  <HardDriveIcon className="h-6 w-6 text-purple-400 group-hover/item:text-purple-300" />
                </div>
                <div className="text-purple-400 text-xs font-semibold px-2 py-1 bg-purple-500/20 rounded-full">
                  60%
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Storage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Used</span>
                  <span className="text-purple-400 font-semibold">120 GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Free</span>
                  <span className="text-green-400 font-semibold">80 GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total</span>
                  <span className="text-blue-400 font-semibold">200 GB</span>
                </div>
                <div className="w-full bg-gray-600/50 rounded-full h-2 mt-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-3/5 transition-all duration-500"></div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>Type: </span>
                  <span className="text-gray-300">NVMe SSD</span>
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-green-500/10 hover:to-emerald-500/10 border border-gray-600/20 hover:border-green-400/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl group-hover/item:bg-green-500/30 group-hover/item:scale-110 transition-all duration-300">
                  <ClockIcon className="h-6 w-6 text-green-400 group-hover/item:text-green-300" />
                </div>
                <div className="text-green-400 text-xs font-semibold px-2 py-1 bg-green-500/20 rounded-full">
                  99.9%
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Uptime</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current</span>
                  <span className="text-green-400 font-semibold">{uptime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Availability</span>
                  <span className="text-emerald-400 font-semibold">99.9%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last Boot</span>
                  <span className="text-cyan-400 font-semibold">5 days ago</span>
                </div>
                <div className="w-full bg-gray-600/50 rounded-full h-2 mt-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full w-full transition-all duration-500"></div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>Status: </span>
                  <span className="text-gray-300">Stable & Healthy</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                <span className="text-green-400 font-semibold">System Status: Healthy</span>
              </div>
              <span className="text-gray-400 text-sm">Last updated: 2 min ago</span>
            </div>
          </div>
        </div>
        {/* System Performance Overview */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30 p-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-4 bg-gradient-to-br from-orange-500/30 to-red-500/20 rounded-2xl mr-5 group-hover:from-orange-500/40 group-hover:to-red-500/30 transition-all duration-300">
                <ActivityIcon className="h-8 w-8 text-orange-300 group-hover:text-orange-200 transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">System Performance</h2>
                <p className="text-gray-400 mt-1">Real-time monitoring & analytics</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Network Traffic */}
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-cyan-500/10 hover:to-blue-500/10 border border-gray-600/20 hover:border-cyan-400/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-xl group-hover/item:bg-cyan-500/30 group-hover/item:scale-110 transition-all duration-300">
                  <NetworkIcon className="h-6 w-6 text-cyan-400 group-hover/item:text-cyan-300" />
                </div>
                <div className="text-cyan-400 text-xs font-semibold px-2 py-1 bg-cyan-500/20 rounded-full">
                  LIVE
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Network Traffic</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Download</span>
                  <span className="text-cyan-400 font-bold">125.4 MB/s</span>
                </div>
                <div className="w-full bg-gray-600/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full w-3/4 transition-all duration-500"></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Upload</span>
                  <span className="text-blue-400 font-bold">45.2 MB/s</span>
                </div>
                <div className="w-full bg-gray-600/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-1/2 transition-all duration-500"></div>
                </div>
              </div>
            </div>

            {/* System Load */}
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-yellow-500/10 hover:to-orange-500/10 border border-gray-600/20 hover:border-yellow-400/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl group-hover/item:bg-yellow-500/30 group-hover/item:scale-110 transition-all duration-300">
                  <CpuIcon className="h-6 w-6 text-yellow-400 group-hover/item:text-yellow-300" />
                </div>
                <div className="text-yellow-400 text-xs font-semibold px-2 py-1 bg-yellow-500/20 rounded-full">
                  NORMAL
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">System Load</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">1 min avg</span>
                  <span className="text-yellow-400 font-bold">1.25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">5 min avg</span>
                  <span className="text-orange-400 font-bold">1.48</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">15 min avg</span>
                  <span className="text-red-400 font-bold">1.62</span>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <span>Processes: </span>
                  <span className="text-gray-300">142 running, 3 sleeping</span>
                </div>
              </div>
            </div>

            {/* Memory Details */}
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-purple-500/10 hover:to-pink-500/10 border border-gray-600/20 hover:border-purple-400/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover/item:bg-purple-500/30 group-hover/item:scale-110 transition-all duration-300">
                  <MemoryStickIcon className="h-6 w-6 text-purple-400 group-hover/item:text-purple-300" />
                </div>
                <div className="text-purple-400 text-xs font-semibold px-2 py-1 bg-purple-500/20 rounded-full">
                  60%
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Memory Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Used</span>
                  <span className="text-purple-400 font-semibold">9.6 GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Free</span>
                  <span className="text-green-400 font-semibold">6.4 GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cached</span>
                  <span className="text-blue-400 font-semibold">2.1 GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Buffers</span>
                  <span className="text-yellow-400 font-semibold">512 MB</span>
                </div>
                <div className="w-full bg-gray-600/50 rounded-full h-2 mt-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-3/5 transition-all duration-500"></div>
                </div>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-green-500/10 hover:to-emerald-500/10 border border-gray-600/20 hover:border-green-400/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl group-hover/item:bg-green-500/30 group-hover/item:scale-110 transition-all duration-300">
                  <HardDriveIcon className="h-6 w-6 text-green-400 group-hover/item:text-green-300" />
                </div>
                <div className="text-green-400 text-xs font-semibold px-2 py-1 bg-green-500/20 rounded-full">
                  HEALTHY
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Storage Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Root (/)</span>
                  <span className="text-green-400 font-semibold">45% (120GB free)</span>
                </div>
                <div className="w-full bg-gray-600/50 rounded-full h-1.5 mb-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full w-2/5"></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Home (/home)</span>
                  <span className="text-yellow-400 font-semibold">72% (28GB free)</span>
                </div>
                <div className="w-full bg-gray-600/50 rounded-full h-1.5 mb-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1.5 rounded-full w-3/4"></div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>I/O: </span>
                  <span className="text-gray-300">Read 45MB/s, Write 23MB/s</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse mr-3"></div>
                <span className="text-orange-400 font-semibold">Performance Status: Optimal</span>
              </div>
              <span className="text-gray-400 text-sm">Monitoring active</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
