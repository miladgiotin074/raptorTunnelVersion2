'use client';

import { useState, useEffect } from 'react';
import { RefreshCwIcon, WifiIcon, TrendingUpIcon, Users2Icon, BarChart3Icon, GlobeIcon, ClockIcon, ZapIcon, PlusIcon, PlayIcon, Square, RotateCcwIcon, TrashIcon, CopyIcon, SettingsIcon, ServerIcon, EditIcon, CheckCircleIcon } from 'lucide-react';

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

interface CreateTunnelData {
  name: string;
  type: 'iran' | 'foreign';
  foreign_ip?: string;
  iran_ip?: string;
  vxlan_port?: number;
  socks_port?: number;
  connection_code?: string;
  manual_setup?: {
    vni: number;
    iran_vxlan_ip: string;
    foreign_vxlan_ip: string;
  };
}

export default function TunnelsPage() {
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState<Tunnel | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionCode, setConnectionCode] = useState('');
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize lastUpdate on client side only
  useEffect(() => {
    setLastUpdate(new Date());
  }, []);

  // Function for automatic refresh (without loading state)
  const fetchTunnelsAuto = async () => {
    try {
      setError(null);
      const response = await fetch('/api/tunnels');
      if (!response.ok) throw new Error('Failed to fetch tunnels');
      const data = await response.json();
      setTunnels(data.tunnels || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load tunnels');
      console.error('Error fetching tunnels:', err);
    }
  };

  // Function for manual refresh (with loading state)
  const fetchTunnelsManual = async (isInitial = false) => {
    try {
      if (isInitial || !tunnels.length) {
        setLoading(true);
      }
      setError(null);
      const response = await fetch('/api/tunnels');
      if (!response.ok) throw new Error('Failed to fetch tunnels');
      const data = await response.json();
      setTunnels(data.tunnels || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load tunnels');
      console.error('Error fetching tunnels:', err);
    } finally {
      if (isInitial || !tunnels.length) {
        setLoading(false);
      }
    }
  };

  // Auto-refresh every 3 seconds
  useEffect(() => {
    // Initial load with loading state
    fetchTunnelsManual(true);
    // Auto refresh every 3 seconds without loading state
    const interval = setInterval(fetchTunnelsAuto, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle tunnel operations
  async function handleTunnelOperation(tunnelId: string, operation: 'start' | 'stop' | 'restart' | 'delete' | 'edit') {
    try {
      setOperationLoading(tunnelId);
      setError(null);
      
      if (operation === 'edit') {
        // Find the tunnel to edit
        const tunnelToEdit = tunnels.find(t => t.id === tunnelId);
        if (tunnelToEdit) {
          setEditingTunnel(tunnelToEdit);
          setShowEditModal(true);
        }
        return;
      }
      
      const url = operation === 'delete' ? `/api/tunnels/${tunnelId}` : `/api/tunnels/${tunnelId}/${operation}`;
      const response = await fetch(url, {
        method: operation === 'delete' ? 'DELETE' : 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${operation} tunnel`);
      }
      
      const data = await response.json();
      setSuccess(data.message || `Tunnel ${operation}ed successfully`);
      
      // Refresh tunnels list
      await fetchTunnelsAuto();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || `Failed to ${operation} tunnel`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setOperationLoading(null);
    }
  }

  // Test connection function
  const testConnection = async (tunnelId: string) => {
    setTestingConnection(tunnelId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/tunnels/${tunnelId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to test connection');
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Connection test successful! Tunnel is working properly.');
      } else {
        setError(data.message || 'Connection test failed');
      }

      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to test connection');
      setTimeout(() => setError(null), 5000);
    } finally {
      setTestingConnection(null);
    }
  };

  // Calculate stats
  const totalConnections = tunnels.reduce((sum, tunnel) => sum + tunnel.connection_count, 0);
  const activeTunnels = tunnels.filter(tunnel => tunnel.status === 'active').length;
  const iranTunnels = tunnels.filter(tunnel => tunnel.type === 'iran').length;
  const foreignTunnels = tunnels.filter(tunnel => tunnel.type === 'foreign').length;

  const handleRefresh = () => {
    fetchTunnelsManual();
  };

  // Show loading screen for initial load
  if (loading && tunnels.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-gray-100 flex items-center justify-center relative overflow-hidden">
        {/* Background animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center relative z-10">
          {/* Enhanced loading spinner with icon */}
          <div className="relative mb-8 inline-block">
            {/* Outer spinning ring only */}
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-blue-400 border-r-indigo-400" style={{animationDuration: '1s'}}></div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <WifiIcon className="h-8 w-8 text-blue-300 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent mb-2">
            VXLAN Tunnels
          </h1>
          <p className="text-gray-400">
            Manage your VXLAN tunnels between Iran and Foreign servers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-400/30 hover:border-blue-400/50 rounded-xl transition-all duration-300 group text-blue-400 hover:text-blue-300"
          >
            <PlusIcon className="w-4 h-4" />
            Create Tunnel
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-400/30 hover:border-blue-400/50 rounded-xl transition-all duration-300 group disabled:opacity-50 text-blue-400 hover:text-blue-300"
          >
            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-all duration-500`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-red-400 font-medium">Error: {error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-400/30 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Tunnels Card */}
        <div className="relative bg-gradient-to-br from-blue-500/10 via-gray-800/60 to-blue-600/10 backdrop-blur-sm border border-blue-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.05] hover:border-blue-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-xl group-hover:from-blue-500/40 group-hover:to-blue-600/30 group-hover:scale-110 transition-all duration-300">
                <WifiIcon className="h-7 w-7 text-blue-300 group-hover:text-blue-200" />
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUpIcon className="h-4 w-4 text-green-400 animate-pulse" />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-medium">Active Tunnels</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent">{activeTunnels}</p>
              <span className="text-blue-400 text-sm font-semibold">online</span>
            </div>
            <div className="mt-3 flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span>All systems operational</span>
            </div>
          </div>
        </div>

        {/* Total Connections Card */}
        <div className="relative bg-gradient-to-br from-green-500/10 via-gray-800/60 to-emerald-500/10 backdrop-blur-sm border border-green-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-green-500/20 hover:scale-[1.05] hover:border-green-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-xl group-hover:from-green-500/40 group-hover:to-emerald-500/30 group-hover:scale-110 transition-all duration-300">
                <Users2Icon className="h-7 w-7 text-green-300 group-hover:text-green-200" />
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3Icon className="h-4 w-4 text-green-400 animate-pulse" />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-medium">Total Connections</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-4xl font-bold text-green-300">{totalConnections}</p>
              <span className="text-gray-500 text-sm">active</span>
            </div>
            <div className="mt-3 flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Real-time connections</span>
            </div>
          </div>
        </div>

        {/* Iran Servers Card */}
        <div className="relative bg-gradient-to-br from-purple-500/10 via-gray-800/60 to-pink-500/10 backdrop-blur-sm border border-purple-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.05] hover:border-purple-400/40 transition-all duration-500 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-xl group-hover:from-purple-500/40 group-hover:to-pink-500/30 group-hover:scale-110 transition-all duration-300">
                <ServerIcon className="h-7 w-7 text-purple-300 group-hover:text-purple-200" />
              </div>
              <div className="text-xs px-3 py-1.5 rounded-full font-semibold border bg-purple-500/20 text-purple-300 border-purple-400/30">
                IRAN
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
               <p className="text-4xl font-bold text-purple-300">{iranTunnels}</p>
               <span className="text-gray-500 text-sm">servers</span>
             </div>
             <div className="mt-3 flex items-center text-xs text-gray-500">
               <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
               <span>Domestic infrastructure</span>
             </div>
           </div>
         </div>

         {/* Foreign Servers Card */}
         <div className="relative bg-gradient-to-br from-orange-500/10 via-gray-800/60 to-red-500/10 backdrop-blur-sm border border-orange-400/20 p-6 rounded-2xl shadow-2xl hover:shadow-orange-500/20 hover:scale-[1.05] hover:border-orange-400/40 transition-all duration-500 group overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
           <div className="relative z-10">
             <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-gradient-to-br from-orange-500/30 to-red-500/20 rounded-xl group-hover:from-orange-500/40 group-hover:to-red-500/30 group-hover:scale-110 transition-all duration-300">
                 <GlobeIcon className="h-7 w-7 text-orange-300 group-hover:text-orange-200" />
               </div>
               <div className="text-xs px-3 py-1.5 rounded-full font-semibold border bg-orange-500/20 text-orange-300 border-orange-400/30">
                 GLOBAL
               </div>
             </div>
             <p className="text-sm text-gray-400 mb-2 font-medium">Foreign Servers</p>
             <div className="flex items-baseline space-x-2">
               <p className="text-4xl font-bold text-orange-300">{foreignTunnels}</p>
               <span className="text-gray-500 text-sm">servers</span>
             </div>
             <div className="mt-3 flex items-center text-xs text-gray-500">
               <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
               <span>International network</span>
             </div>
           </div>
         </div>
       </div>

      {/* Tunnels List */}
      <div className="space-y-8">
        
        {loading && tunnels.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-transparent border-t-teal-400 border-r-cyan-400"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <WifiIcon className="h-4 w-4 text-teal-300 animate-pulse" />
              </div>
            </div>
            <span className="ml-4 text-gray-400">Loading tunnels...</span>
          </div>
        ) : tunnels.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30 rounded-2xl">
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <WifiIcon className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-100 mb-2">No tunnels found</h3>
            <p className="text-gray-400 mb-6">Create your first VXLAN tunnel to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-400/30 hover:border-blue-400/50 rounded-xl transition-all duration-300 text-blue-400 hover:text-blue-300"
            >
              <PlusIcon className="w-4 h-4" />
              Create Tunnel
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            
            <div className="grid gap-6">
              {tunnels
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((tunnel) => (
                <TunnelCard 
                  key={tunnel.id} 
                  tunnel={tunnel} 
                  onOperation={handleTunnelOperation}
                  operationLoading={operationLoading}
                  testingConnection={testingConnection}
                  testConnection={testConnection}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTunnelModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(message) => {
            setSuccess(message);
            fetchTunnelsAuto();
            setTimeout(() => setSuccess(null), 5000);
          }}
          onError={(message) => {
            setError(message);
            setTimeout(() => setError(null), 5000);
          }}
        />
      )}

      {showConnectionModal && (
        <ConnectionCodeModal
          code={connectionCode}
          onClose={() => {
            setShowConnectionModal(false);
            setConnectionCode('');
          }}
        />
      )}

      {showEditModal && editingTunnel && (
        <EditTunnelModal
          tunnel={editingTunnel}
          onClose={() => {
            setShowEditModal(false);
            setEditingTunnel(null);
          }}
          onSuccess={(message) => {
            setSuccess(message);
            fetchTunnelsAuto();
            setTimeout(() => setSuccess(null), 5000);
          }}
          onError={(message) => {
            setError(message);
            setTimeout(() => setError(null), 5000);
          }}
        />
      )}
    </div>
  );
}

// Edit Tunnel Modal Component
function EditTunnelModal({ 
  tunnel,
  onClose, 
  onSuccess, 
  onError 
}: { 
  tunnel: Tunnel;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tunnel.name,
    iran_ip: tunnel.iran_ip || '',
    foreign_ip: tunnel.foreign_ip || '',
    vxlan_port: tunnel.vxlan_port || 4789,
    socks_port: tunnel.socks_port || 1080,
    vni: tunnel.vni || 0,
    iran_vxlan_ip: tunnel.iran_vxlan_ip || '',
    foreign_vxlan_ip: tunnel.foreign_vxlan_ip || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/tunnels/${tunnel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tunnel');
      }
      
      const data = await response.json();
      onSuccess(data.message || 'Tunnel updated successfully');
      onClose();
    } catch (err: any) {
      onError(err.message || 'Failed to update tunnel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Edit Tunnel</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-xl transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tunnel Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
              placeholder="Enter tunnel name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Iran IP</label>
              <input
                type="text"
                value={formData.iran_ip}
                onChange={(e) => setFormData({ ...formData, iran_ip: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                placeholder="Iran server IP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Foreign IP</label>
              <input
                type="text"
                value={formData.foreign_ip}
                onChange={(e) => setFormData({ ...formData, foreign_ip: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                placeholder="Foreign server IP"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">VXLAN Port</label>
              <input
                type="number"
                value={formData.vxlan_port}
                onChange={(e) => setFormData({ ...formData, vxlan_port: parseInt(e.target.value) || 4789 })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                placeholder="4789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SOCKS Port</label>
              <input
                type="number"
                value={formData.socks_port}
                onChange={(e) => setFormData({ ...formData, socks_port: parseInt(e.target.value) || 1080 })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                placeholder="1080"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/50 hover:border-gray-600/70 rounded-xl text-gray-300 hover:text-gray-100 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-400/30 hover:border-yellow-400/50 rounded-xl text-yellow-400 hover:text-yellow-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Tunnel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Tunnel Card Component
function TunnelCard({ 
  tunnel, 
  onOperation, 
  operationLoading,
  testingConnection,
  testConnection
}: { 
  tunnel: Tunnel; 
  onOperation: (id: string, operation: 'start' | 'stop' | 'restart' | 'delete' | 'edit') => void;
  operationLoading: string | null;
  testingConnection: string | null;
  testConnection: (tunnelId: string) => void;
}) {
  const [showConnectionCode, setShowConnectionCode] = useState(false);
  
  const isLoading = operationLoading === tunnel.id;
  
  const generateConnectionCode = () => {
    const connectionData = {
      type: 'tunnel_config',
      foreign_ip: tunnel.foreign_ip,
      iran_ip: tunnel.iran_ip,
      vxlan_port: tunnel.vxlan_port,
      socks_port: tunnel.socks_port,
      vni: tunnel.vni,
      iran_vxlan_ip: tunnel.iran_vxlan_ip,
      foreign_vxlan_ip: tunnel.foreign_vxlan_ip
    };
    return Buffer.from(JSON.stringify(connectionData), 'utf8').toString('base64');
  };
  
  const copyConnectionCode = async () => {
    try {
      const code = generateConnectionCode();
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        // You could add a toast notification here
        console.log('Connection code copied to clipboard');
      } else {
        // Fallback for older browsers or server-side
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('Connection code copied to clipboard (fallback)');
      }
    } catch (error) {
      console.error('Failed to copy connection code:', error);
    }
  };
  
  return (
    <div className="relative bg-gradient-to-br from-gray-800/60 via-gray-900/50 to-gray-800/60 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 shadow-2xl hover:shadow-3xl hover:border-gray-600/40 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 group animate-fade-in-up overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all duration-300 ${
            tunnel.status === 'active' 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30' 
              : 'bg-gradient-to-br from-gray-700/50 to-gray-600/50 border border-gray-600/30'
          }`}>
            <ServerIcon className={`w-6 h-6 transition-colors duration-300 ${
              tunnel.status === 'active'
                ? 'text-green-400'
                : 'text-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100 group-hover:text-white transition-colors duration-300">{tunnel.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${
                tunnel.type === 'foreign'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-400/30'
                  : 'bg-purple-500/10 text-purple-400 border-purple-400/30'
              }`}>
                {tunnel.type === 'foreign' ? 'Foreign Server' : 'Iran Server'}
              </span>
              <span className="text-gray-600">•</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${
                tunnel.status === 'active'
                  ? 'bg-green-500/10 text-green-400 border-green-400/30'
                  : tunnel.status === 'error'
                  ? 'bg-red-500/10 text-red-400 border-red-400/30'
                  : 'bg-gray-500/10 text-gray-400 border-gray-400/30'
              }`}>
                {tunnel.status === 'active' ? 'Active' : tunnel.status === 'error' ? 'Error' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {tunnel.type === 'foreign' && (
            <button 
              onClick={copyConnectionCode}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-400/30 border border-transparent rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group/btn"
              title="Copy Connection Code"
            >
              <CopyIcon className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
            </button>
          )}
          
          {tunnel.type === 'iran' && (
            <button 
              onClick={() => testConnection(tunnel.id)}
              disabled={testingConnection === tunnel.id}
              className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400/30 border border-transparent rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-110 active:scale-95 group/test"
              title="Test Connection"
            >
              {testingConnection === tunnel.id ? (
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 group-hover/test:scale-125 transition-transform duration-300" />
              )}
            </button>
          )}
          
          {tunnel.status === 'inactive' ? (
            <button 
              onClick={() => onOperation(tunnel.id, 'start')}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 hover:border-green-400/30 border border-transparent rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-110 active:scale-95 group/start"
              title="Start Tunnel"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlayIcon className="w-4 h-4 group-hover/start:scale-125 transition-transform duration-300" />
              )}
            </button>
          ) : (
            <button 
              onClick={() => onOperation(tunnel.id, 'stop')}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-400/30 border border-transparent rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-110 active:scale-95 group/stop"
              title="Stop Tunnel"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Square className="w-4 h-4 group-hover/stop:scale-125 transition-transform duration-300" />
              )}
            </button>
          )}
          
          <button 
            onClick={() => onOperation(tunnel.id, 'edit')}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400/30 border border-transparent rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-110 active:scale-95 group/edit"
            title="Edit Tunnel"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <EditIcon className="w-4 h-4 group-hover/edit:rotate-12 transition-transform duration-300" />
            )}
          </button>
          
          <button 
            onClick={() => onOperation(tunnel.id, 'restart')}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400/30 border border-transparent rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-110 active:scale-95 group/restart"
            title="Restart Tunnel"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCcwIcon className="w-4 h-4 group-hover/restart:rotate-180 transition-transform duration-500" />
            )}
          </button>
          
          <button 
            onClick={() => onOperation(tunnel.id, 'delete')}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-400/30 border border-transparent rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-110 active:scale-95 group/delete"
            title="Delete Tunnel"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TrashIcon className="w-4 h-4 group-hover/delete:scale-125 group-hover/delete:text-red-300 transition-all duration-300" />
            )}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-800/30 to-gray-700/30 rounded-xl border border-gray-600/20 hover:border-gray-500/30 hover:scale-105 hover:shadow-lg transition-all duration-300 group/card">
          <ServerIcon className="w-4 h-4 text-teal-400 group-hover/card:scale-110 transition-transform duration-300" />
          <div>
            <p className="text-xs text-gray-400">Iran IP</p>
            <p className="text-sm font-medium text-gray-100">{tunnel.iran_ip}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-800/30 to-gray-700/30 rounded-xl border border-gray-600/20 hover:border-gray-500/30 hover:scale-105 hover:shadow-lg transition-all duration-300 group/card">
          <GlobeIcon className="w-4 h-4 text-blue-400 group-hover/card:scale-110 transition-transform duration-300" />
          <div>
            <p className="text-xs text-gray-400">Foreign IP</p>
            <p className="text-sm font-medium text-gray-100">{tunnel.foreign_ip}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-800/30 to-gray-700/30 rounded-xl border border-gray-600/20 hover:border-gray-500/30 hover:scale-105 hover:shadow-lg transition-all duration-300 group/card">
          <ZapIcon className="w-4 h-4 text-yellow-400 group-hover/card:scale-110 group-hover/card:rotate-12 transition-all duration-300" />
          <div>
            <p className="text-xs text-gray-400">VXLAN Port</p>
            <p className="text-sm font-medium text-gray-100">{tunnel.vxlan_port}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-800/30 to-gray-700/30 rounded-xl border border-gray-600/20 hover:border-gray-500/30 hover:scale-105 hover:shadow-lg transition-all duration-300 group/card">
          <SettingsIcon className="w-4 h-4 text-purple-400 group-hover/card:scale-110 group-hover/card:rotate-90 transition-all duration-300" />
          <div>
            <p className="text-xs text-gray-400">SOCKS Port</p>
            <p className="text-sm font-medium text-gray-100">{tunnel.socks_port}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-800/30 to-gray-700/30 rounded-xl border border-gray-600/20 hover:border-gray-500/30 hover:scale-105 hover:shadow-lg transition-all duration-300 group/card">
          <Users2Icon className="w-4 h-4 text-green-400 group-hover/card:scale-110 transition-transform duration-300" />
          <div>
            <p className="text-xs text-gray-400">Connections</p>
            <p className="text-sm font-medium text-gray-100">{tunnel.connection_count}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-800/30 to-gray-700/30 rounded-xl border border-gray-600/20 hover:border-gray-500/30 hover:scale-105 hover:shadow-lg transition-all duration-300 group/card">
          <BarChart3Icon className="w-4 h-4 text-cyan-400 group-hover/card:scale-110 group-hover/card:animate-pulse transition-all duration-300" />
          <div>
            <p className="text-xs text-gray-400">Bandwidth</p>
            <p className="text-sm font-medium text-gray-100">
              {tunnel.bandwidth_usage > 0 ? `${tunnel.bandwidth_usage} MB/s` : '0 MB/s'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-600/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-gradient-to-br from-gray-800/20 to-gray-700/20 rounded-xl border border-gray-600/20">
            <p className="text-gray-400 text-xs mb-1">VNI</p>
            <p className="font-medium text-gray-100">{tunnel.vni}</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-gray-800/20 to-gray-700/20 rounded-xl border border-gray-600/20">
            <p className="text-gray-400 text-xs mb-1">Iran VXLAN IP</p>
            <p className="font-medium text-gray-100">{tunnel.iran_vxlan_ip}</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-gray-800/20 to-gray-700/20 rounded-xl border border-gray-600/20">
            <p className="text-gray-400 text-xs mb-1">Foreign VXLAN IP</p>
            <p className="font-medium text-gray-100">{tunnel.foreign_vxlan_ip}</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-gray-800/20 to-gray-700/20 rounded-xl border border-gray-600/20">
            <p className="text-gray-400 text-xs mb-1">Last Active</p>
            <p className="font-medium text-gray-100">
              {tunnel.last_active ? new Date(tunnel.last_active).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
        
        {/* Error Message */}
        {tunnel.status === 'error' && tunnel.error_message && (
          <div className="mt-4 p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-400/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <p className="text-sm text-red-400">
                <span className="font-medium">Error:</span> {tunnel.error_message}
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// Create Tunnel Modal Component
function CreateTunnelModal({ 
  onClose, 
  onSuccess, 
  onError 
}: { 
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [step, setStep] = useState<'type' | 'foreign' | 'iran'>('type');
  const [tunnelType, setTunnelType] = useState<'foreign' | 'iran'>('foreign');
  const [setupMode, setSetupMode] = useState<'code' | 'manual'>('code');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    iran_ip: '',
    foreign_ip: '',
    vxlan_port: 4789,
    socks_port: 1080,
    connection_code: '',
    vni: 0,
    iran_vxlan_ip: '',
    foreign_vxlan_ip: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload: CreateTunnelData = {
        name: formData.name,
        type: tunnelType
      };
      
      if (tunnelType === 'foreign') {
        payload.foreign_ip = formData.foreign_ip;
        payload.iran_ip = formData.iran_ip;
        payload.vxlan_port = formData.vxlan_port;
        payload.socks_port = formData.socks_port;
      } else {
        if (setupMode === 'code') {
          payload.connection_code = formData.connection_code;
        } else {
          payload.foreign_ip = formData.foreign_ip;
          payload.iran_ip = formData.iran_ip;
          payload.vxlan_port = formData.vxlan_port;
          payload.socks_port = formData.socks_port;
          payload.vni = formData.vni;
          payload.iran_vxlan_ip = formData.iran_vxlan_ip;
          payload.foreign_vxlan_ip = formData.foreign_vxlan_ip;
        }
      }
      
      const response = await fetch('/api/tunnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tunnel');
      }
      
      const data = await response.json();
      onSuccess(data.message || 'Tunnel created successfully');
      onClose();
    } catch (err: any) {
      onError(err.message || 'Failed to create tunnel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Create New Tunnel</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-xl transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {step === 'type' && (
          <div className="space-y-6">
            <p className="text-gray-300 text-center">Select server type to continue:</p>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setTunnelType('foreign');
                  setStep('foreign');
                }}
                className="w-full p-6 text-left bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-2xl hover:from-blue-500/20 hover:to-cyan-500/20 hover:border-blue-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-400/30 group-hover:border-blue-400/50 transition-all duration-300">
                    <GlobeIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors duration-300">Foreign Server</h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Create tunnel on foreign server</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setTunnelType('iran');
                  setStep('iran');
                }}
                className="w-full p-6 text-left bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-2xl hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30 group-hover:border-purple-400/50 transition-all duration-300">
                    <ServerIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors duration-300">Iran Server</h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Connect to foreign server</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
        
        {step === 'foreign' && (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Tunnel Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter tunnel name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Iran Server IP
                </label>
                <input
                  type="text"
                  value={formData.iran_ip}
                  onChange={(e) => setFormData({ ...formData, iran_ip: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                  placeholder="1.2.3.4"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Foreign Server IP
                </label>
                <input
                  type="text"
                  value={formData.foreign_ip}
                  onChange={(e) => setFormData({ ...formData, foreign_ip: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                  placeholder="5.6.7.8"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    VXLAN Port
                  </label>
                  <input
                    type="number"
                    value={formData.vxlan_port}
                    onChange={(e) => setFormData({ ...formData, vxlan_port: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                    placeholder="VXLAN port"
                    min="1"
                    max="65535"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    SOCKS Port
                  </label>
                  <input
                    type="number"
                    value={formData.socks_port}
                    onChange={(e) => setFormData({ ...formData, socks_port: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                    placeholder="SOCKS port"
                    min="1"
                    max="65535"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setStep('type')}
                  className="flex-1 px-6 py-3 bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-600/50 hover:border-gray-500/50 hover:text-gray-200 transition-all duration-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Tunnel'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {step === 'iran' && (
          <div className="space-y-6">
            <p className="text-gray-300 text-center">Choose setup method:</p>
            
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setSetupMode('code')}
                className={`flex-1 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  setupMode === 'code'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500/50 hover:text-gray-200'
                }`}
              >
                Connection Code
              </button>
              <button
                onClick={() => setSetupMode('manual')}
                className={`flex-1 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  setupMode === 'manual'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500/50 hover:text-gray-200'
                }`}
              >
                Manual Setup
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Tunnel Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter tunnel name"
                  required
                />
              </div>
              
              {setupMode === 'code' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Connection Code
                  </label>
                  <textarea
                    value={formData.connection_code}
                    onChange={(e) => setFormData({ ...formData, connection_code: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300 resize-none"
                    rows={4}
                    placeholder="Paste connection code from foreign server"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Foreign Server IP
                    </label>
                    <input
                      type="text"
                      value={formData.foreign_ip}
                      onChange={(e) => setFormData({ ...formData, foreign_ip: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                      placeholder="1.2.3.4"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-3">
                        VXLAN Port
                      </label>
                      <input
                        type="number"
                        value={formData.vxlan_port}
                        onChange={(e) => setFormData({ ...formData, vxlan_port: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                        placeholder="VXLAN port"
                        min="1"
                        max="65535"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-3">
                        VNI
                      </label>
                      <input
                        type="number"
                        value={formData.vni}
                        onChange={(e) => setFormData({ ...formData, vni: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                        placeholder="VNI"
                        min="1"
                        max="16777215"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-3">
                        Iran VXLAN IP
                      </label>
                      <input
                        type="text"
                        value={formData.iran_vxlan_ip}
                        onChange={(e) => setFormData({ ...formData, iran_vxlan_ip: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                        placeholder="10.100.1.2"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-3">
                        Foreign VXLAN IP
                      </label>
                      <input
                        type="text"
                        value={formData.foreign_vxlan_ip}
                        onChange={(e) => setFormData({ ...formData, foreign_vxlan_ip: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 text-gray-100 placeholder-gray-400 transition-all duration-300"
                        placeholder="10.100.1.1"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setStep('type')}
                  className="flex-1 px-6 py-3 bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-600/50 hover:border-gray-500/50 hover:text-gray-200 transition-all duration-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Tunnel'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Connection Code Modal Component
function ConnectionCodeModal({ 
  code, 
  onClose 
}: { 
  code: string;
  onClose: () => void;
}) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Connection Code</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-xl transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          <p className="text-gray-300 text-center">
            Copy this code and use it on your Iran server to establish the connection:
          </p>
          
          <div className="relative">
            <textarea
              value={code}
              readOnly
              className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 transition-all duration-300"
              rows={5}
            />
            <button
              onClick={copyToClipboard}
              className="absolute top-3 right-3 p-2 text-gray-400 hover:text-teal-400 hover:bg-gray-700/50 rounded-lg transition-all duration-300 group"
              title="Copy to clipboard"
            >
              <CopyIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}