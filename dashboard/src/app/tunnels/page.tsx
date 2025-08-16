'use client';

import { WifiIcon, GlobeIcon, ActivityIcon, ServerIcon, TrendingUpIcon, NetworkIcon, ClockIcon, ShieldIcon, ZapIcon, BarChart3Icon, Users2Icon, MapPinIcon, RefreshCwIcon } from 'lucide-react';

export default function Tunnels() {
  // Dummy data for tunnels
  const tunnels = [
    {
      id: 1,
      name: 'Main Server Tunnel',
      status: 'active',
      protocol: 'OpenVPN',
      location: 'Tehran, Iran',
      ip: '192.168.1.100',
      port: 1194,
      clients: 15,
      uptime: '12 days',
      traffic: { up: '2.4 GB', down: '8.7 GB' },
      bandwidth: '100 Mbps',
      ping: '12ms'
    },
    {
      id: 2,
      name: 'Backup Tunnel',
      status: 'active',
      protocol: 'WireGuard',
      location: 'Isfahan, Iran',
      ip: '192.168.1.101',
      port: 51820,
      clients: 8,
      uptime: '5 days',
      traffic: { up: '1.2 GB', down: '4.3 GB' },
      bandwidth: '50 Mbps',
      ping: '18ms'
    },
    {
      id: 3,
      name: 'Development Tunnel',
      status: 'inactive',
      protocol: 'IKEv2',
      location: 'Shiraz, Iran',
      ip: '192.168.1.102',
      port: 500,
      clients: 0,
      uptime: '0 days',
      traffic: { up: '0 GB', down: '0 GB' },
      bandwidth: '25 Mbps',
      ping: 'N/A'
    }
  ];

  const totalClients = tunnels.reduce((sum, tunnel) => sum + tunnel.clients, 0);
  const activeTunnels = tunnels.filter(tunnel => tunnel.status === 'active').length;
  const totalTrafficUp = tunnels.reduce((sum, tunnel) => sum + parseFloat(tunnel.traffic.up), 0);
  const totalTrafficDown = tunnels.reduce((sum, tunnel) => sum + parseFloat(tunnel.traffic.down), 0);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-gray-100">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Tunnels</h1>
            <p className="text-gray-400 mt-1">Manage and monitor VPN tunnels</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-400/30 hover:border-blue-400/50 rounded-xl transition-all duration-300 group"
            title="Refresh Tunnels"
          >
            <RefreshCwIcon className="h-5 w-5 text-blue-400 group-hover:text-blue-300 group-hover:rotate-180 transition-all duration-500" />
            <span className="text-blue-400 group-hover:text-blue-300 font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Tunnels */}
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
            <p className="text-sm text-gray-400 mb-2 font-medium">Active Tunnels</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-4xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">{activeTunnels}</p>
              <span className="text-green-400 text-sm font-semibold">of {tunnels.length}</span>
            </div>
            <div className="mt-3 flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-teal-400 rounded-full mr-2"></div>
              <span>All online</span>
            </div>
          </div>
        </div>

        {/* Total Clients */}
        <div className="relative bg-gradient-to-br from-blue-500/10 via-gray-800/60 to-indigo-500/10 backdrop-blur-sm border border-blue-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.05] hover:border-blue-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/30 to-indigo-500/20 rounded-xl group-hover:from-blue-500/40 group-hover:to-indigo-500/30 group-hover:scale-110 transition-all duration-300">
                <Users2Icon className="h-7 w-7 text-blue-300 group-hover:text-blue-200" />
              </div>
              <div className="text-xs px-3 py-1.5 rounded-full font-semibold border bg-blue-500/20 text-blue-300 border-blue-400/30 shadow-blue-500/20">
                LIVE
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-medium">Connected Users</p>
            <div className="flex items-baseline space-x-2 mb-3">
              <p className="text-4xl font-bold text-blue-300">{totalClients}</p>
              <span className="text-gray-500 text-sm">users</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Max: 50</span>
              <span>Avg: 18</span>
            </div>
          </div>
        </div>

        {/* Upload Traffic */}
        <div className="relative bg-gradient-to-br from-purple-500/10 via-gray-800/60 to-pink-500/10 backdrop-blur-sm border border-purple-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.05] hover:border-purple-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-xl group-hover:from-purple-500/40 group-hover:to-pink-500/30 group-hover:scale-110 transition-all duration-300">
                <TrendingUpIcon className="h-7 w-7 text-purple-300 group-hover:text-purple-200" />
              </div>
              <div className="text-xs px-3 py-1.5 rounded-full font-semibold border bg-purple-500/20 text-purple-300 border-purple-400/30 shadow-purple-500/20">
                UP
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-medium">Upload Traffic</p>
            <div className="flex items-baseline space-x-2 mb-3">
              <p className="text-4xl font-bold text-purple-300">{totalTrafficUp.toFixed(1)}</p>
              <span className="text-gray-500 text-sm">GB</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Today: 1.2GB</span>
              <span>Speed: 45MB/s</span>
            </div>
          </div>
        </div>

        {/* Download Traffic */}
        <div className="relative bg-gradient-to-br from-green-500/10 via-gray-800/60 to-emerald-500/10 backdrop-blur-sm border border-green-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-green-500/20 hover:scale-[1.05] hover:border-green-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-xl group-hover:from-green-500/40 group-hover:to-emerald-500/30 group-hover:scale-110 transition-all duration-300">
                <BarChart3Icon className="h-7 w-7 text-green-300 group-hover:text-green-200" />
              </div>
              <div className="text-xs px-3 py-1.5 rounded-full font-semibold border bg-green-500/20 text-green-300 border-green-400/30 shadow-green-500/20">
                DOWN
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-medium">Download Traffic</p>
            <div className="flex items-baseline space-x-2 mb-3">
              <p className="text-4xl font-bold text-green-300">{totalTrafficDown.toFixed(1)}</p>
              <span className="text-gray-500 text-sm">GB</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Today: 4.8GB</span>
              <span>Speed: 125MB/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tunnels List */}
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30 p-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.01] transition-all duration-500">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="p-4 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-2xl mr-5">
              <ServerIcon className="h-8 w-8 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Tunnel List</h2>
              <p className="text-gray-400 mt-1">Manage and control VPN tunnels</p>
            </div>
          </div>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
        </div>

        <div className="space-y-6">
          {tunnels.map((tunnel) => (
            <div key={tunnel.id} className="group/tunnel bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-2xl border border-gray-600/20 hover:border-teal-400/30 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      tunnel.status === 'active' 
                        ? 'bg-green-500/20 group-hover/tunnel:bg-green-500/30' 
                        : 'bg-red-500/20 group-hover/tunnel:bg-red-500/30'
                    } group-hover/tunnel:scale-110 transition-all duration-300`}>
                      <WifiIcon className={`h-6 w-6 ${
                        tunnel.status === 'active' ? 'text-green-400' : 'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-100">{tunnel.name}</h3>
                      <p className="text-gray-400 text-sm">{tunnel.protocol} • {tunnel.location}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    tunnel.status === 'active'
                      ? 'bg-green-500/20 text-green-300 border-green-400/30'
                      : 'bg-red-500/20 text-red-300 border-red-400/30'
                  }`}>
                    {tunnel.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {/* IP Address */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <GlobeIcon className="h-4 w-4 text-teal-400" />
                      <span className="text-gray-400 text-sm">IP Address</span>
                    </div>
                    <p className="text-teal-400 font-semibold">{tunnel.ip}</p>
                    <p className="text-gray-500 text-xs">Port: {tunnel.port}</p>
                  </div>

                  {/* Clients */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users2Icon className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400 text-sm">Clients</span>
                    </div>
                    <p className="text-blue-400 font-semibold">{tunnel.clients}</p>
                    <p className="text-gray-500 text-xs">connected</p>
                  </div>

                  {/* Uptime */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400 text-sm">Uptime</span>
                    </div>
                    <p className="text-green-400 font-semibold">{tunnel.uptime}</p>
                    <p className="text-gray-500 text-xs">continuous</p>
                  </div>

                  {/* Traffic Up */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUpIcon className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-400 text-sm">Upload</span>
                    </div>
                    <p className="text-purple-400 font-semibold">{tunnel.traffic.up}</p>
                    <p className="text-gray-500 text-xs">total</p>
                  </div>

                  {/* Traffic Down */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <BarChart3Icon className="h-4 w-4 text-cyan-400" />
                      <span className="text-gray-400 text-sm">Download</span>
                    </div>
                    <p className="text-cyan-400 font-semibold">{tunnel.traffic.down}</p>
                    <p className="text-gray-500 text-xs">total</p>
                  </div>

                  {/* Bandwidth & Ping */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <ZapIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-400 text-sm">Performance</span>
                    </div>
                    <p className="text-yellow-400 font-semibold">{tunnel.bandwidth}</p>
                    <p className="text-gray-500 text-xs">Ping: {tunnel.ping}</p>
                  </div>
                </div>

                {/* Progress Bar for Traffic */}
                {tunnel.status === 'active' && (
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Bandwidth Usage</span>
                      <span>75% of capacity</span>
                    </div>
                    <div className="w-full bg-gray-600/50 rounded-full h-2">
                      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full w-3/4 transition-all duration-1000"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
              <span className="text-green-400 font-semibold">System Status: Healthy & Active</span>
            </div>
            <span className="text-gray-400 text-sm">Last updated: 1 minute ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}