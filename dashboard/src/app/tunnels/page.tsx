'use client';

import { useState, useEffect } from 'react';
import { RefreshCwIcon, WifiIcon, TrendingUpIcon, Users2Icon, BarChart3Icon, GlobeIcon, ClockIcon, ZapIcon, PlusIcon, PlayIcon, Square, RotateCcwIcon, TrashIcon, CopyIcon, SettingsIcon, ServerIcon } from 'lucide-react';

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
  bandwidth_usage: string;
  connection_count: number;
  created_at: string;
  last_active: string;
}

interface CreateTunnelData {
  name: string;
  type: 'foreign' | 'iran';
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
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionCode, setConnectionCode] = useState('');
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize lastUpdate on client side only
  useEffect(() => {
    setLastUpdate(new Date());
  }, []);

  // Fetch tunnels from API
  const fetchTunnels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tunnels');
      if (!response.ok) throw new Error('Failed to fetch tunnels');
      const data = await response.json();
      setTunnels(data.tunnels || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load tunnels');
      console.error('Error fetching tunnels:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 3 seconds
  useEffect(() => {
    fetchTunnels();
    const interval = setInterval(fetchTunnels, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle tunnel operations
  async function handleTunnelOperation(tunnelId: string, operation: 'start' | 'stop' | 'restart' | 'delete') {
    try {
      setOperationLoading(tunnelId);
      setError(null);
      
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
      await fetchTunnels();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || `Failed to ${operation} tunnel`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setOperationLoading(null);
    }
  }

  // Calculate stats
  const totalConnections = tunnels.reduce((sum, tunnel) => sum + tunnel.connection_count, 0);
  const activeTunnels = tunnels.filter(tunnel => tunnel.status === 'active').length;
  const iranTunnels = tunnels.filter(tunnel => tunnel.type === 'iran').length;
  const foreignTunnels = tunnels.filter(tunnel => tunnel.type === 'foreign').length;

  const handleRefresh = () => {
    fetchTunnels();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">VXLAN Tunnels</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your VXLAN tunnels between Iran and Foreign servers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Create Tunnel
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tunnels</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTunnels}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <WifiIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Connections</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalConnections}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users2Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Iran Servers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{iranTunnels}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <ServerIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Foreign Servers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{foreignTunnels}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <GlobeIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tunnels List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tunnel List</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}
          </p>
        </div>
        
        {loading && tunnels.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading tunnels...</span>
          </div>
        ) : tunnels.length === 0 ? (
          <div className="text-center py-12">
            <WifiIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tunnels found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first VXLAN tunnel to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create Tunnel
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {tunnels.map((tunnel) => (
              <TunnelCard 
                key={tunnel.id} 
                tunnel={tunnel} 
                onOperation={handleTunnelOperation}
                operationLoading={operationLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTunnelModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(message) => {
            setSuccess(message);
            fetchTunnels();
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
    </div>
  );
}

// Tunnel Card Component
function TunnelCard({ 
  tunnel, 
  onOperation, 
  operationLoading 
}: { 
  tunnel: Tunnel; 
  onOperation: (id: string, operation: 'start' | 'stop' | 'restart' | 'delete') => void;
  operationLoading: string | null;
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
      foreign_vxlan_ip: tunnel.foreign_vxlan_ip,
      tunnel_name: tunnel.name
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${
            tunnel.status === 'active' 
              ? 'bg-green-100 dark:bg-green-900/20' 
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <ServerIcon className={`w-6 h-6 ${
              tunnel.status === 'active'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tunnel.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                tunnel.type === 'foreign'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
              }`}>
                {tunnel.type === 'foreign' ? 'Foreign Server' : 'Iran Server'}
              </span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                tunnel.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {tunnel.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {tunnel.type === 'foreign' && (
            <button 
              onClick={copyConnectionCode}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Copy Connection Code"
            >
              <CopyIcon className="w-4 h-4" />
            </button>
          )}
          
          {tunnel.status === 'inactive' ? (
            <button 
              onClick={() => onOperation(tunnel.id, 'start')}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Start Tunnel"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
            </button>
          ) : (
            <button 
              onClick={() => onOperation(tunnel.id, 'stop')}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Stop Tunnel"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          )}
          
          <button 
            onClick={() => onOperation(tunnel.id, 'restart')}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
            title="Restart Tunnel"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCcwIcon className="w-4 h-4" />
            )}
          </button>
          
          <button 
            onClick={() => onOperation(tunnel.id, 'delete')}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            title="Delete Tunnel"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TrashIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="flex items-center gap-2">
          <GlobeIcon className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Foreign IP</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{tunnel.foreign_ip}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ServerIcon className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Iran IP</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{tunnel.iran_ip}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ZapIcon className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">VXLAN Port</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{tunnel.vxlan_port}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">SOCKS Port</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{tunnel.socks_port}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Users2Icon className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Connections</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{tunnel.connection_count}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <BarChart3Icon className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Bandwidth</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{tunnel.bandwidth_usage}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">VNI</p>
            <p className="font-medium text-gray-900 dark:text-white">{tunnel.vni}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Iran VXLAN IP</p>
            <p className="font-medium text-gray-900 dark:text-white">{tunnel.iran_vxlan_ip}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Foreign VXLAN IP</p>
            <p className="font-medium text-gray-900 dark:text-white">{tunnel.foreign_vxlan_ip}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Last Active</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {tunnel.last_active ? new Date(tunnel.last_active).toLocaleString() : 'Never'}
            </p>
          </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Tunnel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
        
        {step === 'type' && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">Select server type:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setTunnelType('foreign');
                  setStep('foreign');
                }}
                className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GlobeIcon className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Foreign Server</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create tunnel on foreign server</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setTunnelType('iran');
                  setStep('iran');
                }}
                className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ServerIcon className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Iran Server</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Connect to foreign server</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
        
        {step === 'foreign' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tunnel Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foreign Server IP
              </label>
              <input
                type="text"
                value={formData.foreign_ip}
                onChange={(e) => setFormData({ ...formData, foreign_ip: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="5.6.7.8"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Iran Server IP
              </label>
              <input
                type="text"
                value={formData.iran_ip}
                onChange={(e) => setFormData({ ...formData, iran_ip: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="1.2.3.4"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  VXLAN Port
                </label>
                <input
                  type="number"
                  value={formData.vxlan_port}
                  onChange={(e) => setFormData({ ...formData, vxlan_port: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="1"
                  max="65535"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SOCKS Port
                </label>
                <input
                  type="number"
                  value={formData.socks_port}
                  onChange={(e) => setFormData({ ...formData, socks_port: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="1"
                  max="65535"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('type')}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Tunnel'}
              </button>
            </div>
          </form>
        )}
        
        {step === 'iran' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSetupMode('code')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  setupMode === 'code'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Connection Code
              </button>
              <button
                onClick={() => setSetupMode('manual')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  setupMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Manual Setup
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tunnel Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              {setupMode === 'code' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Connection Code
                  </label>
                  <textarea
                    value={formData.connection_code}
                    onChange={(e) => setFormData({ ...formData, connection_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Paste connection code from foreign server"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foreign Server IP
                    </label>
                    <input
                      type="text"
                      value={formData.foreign_ip}
                      onChange={(e) => setFormData({ ...formData, foreign_ip: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="1.2.3.4"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      VXLAN Port
                    </label>
                    <input
                      type="number"
                      value={formData.vxlan_port}
                      onChange={(e) => setFormData({ ...formData, vxlan_port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="1"
                      max="65535"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      VNI
                    </label>
                    <input
                      type="number"
                      value={formData.vni}
                      onChange={(e) => setFormData({ ...formData, vni: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="1"
                      max="16777215"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Iran VXLAN IP
                      </label>
                      <input
                        type="text"
                        value={formData.iran_vxlan_ip}
                        onChange={(e) => setFormData({ ...formData, iran_vxlan_ip: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="10.100.1.2"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Foreign VXLAN IP
                      </label>
                      <input
                        type="text"
                        value={formData.foreign_vxlan_ip}
                        onChange={(e) => setFormData({ ...formData, foreign_vxlan_ip: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="10.100.1.1"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('type')}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Tunnel'}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connection Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Copy this code and use it on your Iran server to establish the connection:
          </p>
          
          <div className="relative">
            <textarea
              value={code}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              rows={4}
            />
            <button
              onClick={copyToClipboard}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Copy to clipboard"
            >
              <CopyIcon className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}