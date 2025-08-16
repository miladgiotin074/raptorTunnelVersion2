'use client';

import { SettingsIcon, UserIcon, ShieldIcon, BellIcon, PaletteIcon, DatabaseIcon, KeyIcon, GlobeIcon, MonitorIcon, WifiIcon, ServerIcon, LockIcon, EyeIcon, EyeOffIcon, SaveIcon, RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  // Dummy data for settings
  const [settings, setSettings] = useState({
    general: {
      serverName: 'Raptor Server',
      description: 'High-performance tunnel management system',
      timezone: 'UTC+0',
      language: 'English'
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5
    },
    network: {
      maxConnections: 1000,
      bandwidth: '1 Gbps',
      encryption: 'AES-256',
      protocol: 'TCP/UDP'
    },
    notifications: {
      emailAlerts: true,
      systemAlerts: true,
      maintenanceMode: false,
      logLevel: 'INFO'
    }
  });

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-gray-100">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your tunnel management system</p>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* General Settings */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30 p-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-4 bg-gradient-to-br from-teal-500/30 to-cyan-500/20 rounded-2xl mr-5 group-hover:from-teal-500/40 group-hover:to-cyan-500/30 transition-all duration-300">
                <SettingsIcon className="h-8 w-8 text-teal-300 group-hover:text-teal-200 transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">General Settings</h2>
                <p className="text-gray-400 mt-1">Basic system configuration</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-teal-500/10 hover:to-cyan-500/10 border border-gray-600/20 hover:border-teal-400/30 transition-all duration-300">
              <label className="block text-sm font-medium text-gray-300 mb-3">Server Name</label>
              <input 
                type="text" 
                value={settings.general.serverName}
                onChange={(e) => setSettings({...settings, general: {...settings.general, serverName: e.target.value}})}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all duration-300"
              />
            </div>
            
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-teal-500/10 hover:to-cyan-500/10 border border-gray-600/20 hover:border-teal-400/30 transition-all duration-300">
              <label className="block text-sm font-medium text-gray-300 mb-3">Description</label>
              <textarea 
                value={settings.general.description}
                onChange={(e) => setSettings({...settings, general: {...settings.general, description: e.target.value}})}
                rows={3}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all duration-300 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-teal-500/10 hover:to-cyan-500/10 border border-gray-600/20 hover:border-teal-400/30 transition-all duration-300">
                <label className="block text-sm font-medium text-gray-300 mb-3">Timezone</label>
                <select className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all duration-300">
                  <option value="UTC+0">UTC+0</option>
                  <option value="UTC+1">UTC+1</option>
                  <option value="UTC-5">UTC-5</option>
                </select>
              </div>
              
              <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-teal-500/10 hover:to-cyan-500/10 border border-gray-600/20 hover:border-teal-400/30 transition-all duration-300">
                <label className="block text-sm font-medium text-gray-300 mb-3">Language</label>
                <select className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all duration-300">
                  <option value="English">English</option>
                  <option value="Persian">Persian</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30 p-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-4 bg-gradient-to-br from-red-500/30 to-orange-500/20 rounded-2xl mr-5 group-hover:from-red-500/40 group-hover:to-orange-500/30 transition-all duration-300">
                <ShieldIcon className="h-8 w-8 text-red-300 group-hover:text-red-200 transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-300 to-orange-300 bg-clip-text text-transparent">Security Settings</h2>
                <p className="text-gray-400 mt-1">Authentication & access control</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
          </div>
          
          <div className="space-y-6">
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-red-500/10 hover:to-orange-500/10 border border-gray-600/20 hover:border-red-400/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-1">Two-Factor Authentication</h3>
                  <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) => setSettings({...settings, security: {...settings.security, twoFactorAuth: e.target.checked}})}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.security.twoFactorAuth ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-0.5'} translate-y-0.5`}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-red-500/10 hover:to-orange-500/10 border border-gray-600/20 hover:border-red-400/30 transition-all duration-300">
                <label className="block text-sm font-medium text-gray-300 mb-3">Session Timeout (min)</label>
                <input 
                  type="number" 
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings({...settings, security: {...settings.security, sessionTimeout: parseInt(e.target.value)}})}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all duration-300"
                />
              </div>
              
              <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-red-500/10 hover:to-orange-500/10 border border-gray-600/20 hover:border-red-400/30 transition-all duration-300">
                <label className="block text-sm font-medium text-gray-300 mb-3">Max Login Attempts</label>
                <input 
                  type="number" 
                  value={settings.security.loginAttempts}
                  onChange={(e) => setSettings({...settings, security: {...settings.security, loginAttempts: parseInt(e.target.value)}})}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Network Settings */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30 p-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-4 bg-gradient-to-br from-blue-500/30 to-indigo-500/20 rounded-2xl mr-5 group-hover:from-blue-500/40 group-hover:to-indigo-500/30 transition-all duration-300">
                <WifiIcon className="h-8 w-8 text-blue-300 group-hover:text-blue-200 transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">Network Settings</h2>
                <p className="text-gray-400 mt-1">Connection & bandwidth configuration</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-blue-500/10 hover:to-indigo-500/10 border border-gray-600/20 hover:border-blue-400/30 transition-all duration-300">
                <label className="block text-sm font-medium text-gray-300 mb-3">Max Connections</label>
                <input 
                  type="number" 
                  value={settings.network.maxConnections}
                  onChange={(e) => setSettings({...settings, network: {...settings.network, maxConnections: parseInt(e.target.value)}})}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                />
              </div>
              
              <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-blue-500/10 hover:to-indigo-500/10 border border-gray-600/20 hover:border-blue-400/30 transition-all duration-300">
                <label className="block text-sm font-medium text-gray-300 mb-3">Bandwidth Limit</label>
                <select className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300">
                  <option value="1 Gbps">1 Gbps</option>
                  <option value="500 Mbps">500 Mbps</option>
                  <option value="100 Mbps">100 Mbps</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-blue-500/10 hover:to-indigo-500/10 border border-gray-600/20 hover:border-blue-400/30 transition-all duration-300">
                <label className="block text-sm font-medium text-gray-300 mb-3">Encryption</label>
                <select className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300">
                  <option value="AES-256">AES-256</option>
                  <option value="AES-128">AES-128</option>
                  <option value="ChaCha20">ChaCha20</option>
                </select>
              </div>
              
              <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-blue-500/10 hover:to-indigo-500/10 border border-gray-600/20 hover:border-blue-400/30 transition-all duration-300">
                <label className="block text-sm font-medium text-gray-300 mb-3">Protocol</label>
                <select className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300">
                  <option value="TCP/UDP">TCP/UDP</option>
                  <option value="TCP">TCP Only</option>
                  <option value="UDP">UDP Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30 p-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-4 bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-2xl mr-5 group-hover:from-purple-500/40 group-hover:to-pink-500/30 transition-all duration-300">
                <BellIcon className="h-8 w-8 text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Notifications</h2>
                <p className="text-gray-400 mt-1">Alert preferences & logging</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-purple-500/10 hover:to-pink-500/10 border border-gray-600/20 hover:border-purple-400/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-1">Email Alerts</h3>
                  <p className="text-gray-400 text-sm">Receive notifications via email</p>
                </div>
                <div className="relative">
                  <div className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.notifications.emailAlerts ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifications.emailAlerts ? 'translate-x-6' : 'translate-x-0.5'} translate-y-0.5`}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-purple-500/10 hover:to-pink-500/10 border border-gray-600/20 hover:border-purple-400/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-1">System Alerts</h3>
                  <p className="text-gray-400 text-sm">Critical system notifications</p>
                </div>
                <div className="relative">
                  <div className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.notifications.systemAlerts ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifications.systemAlerts ? 'translate-x-6' : 'translate-x-0.5'} translate-y-0.5`}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group/item p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/30 rounded-xl hover:from-purple-500/10 hover:to-pink-500/10 border border-gray-600/20 hover:border-purple-400/30 transition-all duration-300">
              <label className="block text-sm font-medium text-gray-300 mb-3">Log Level</label>
              <select className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300">
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        <button className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2">
          <RefreshCwIcon className="h-5 w-5" />
          <span>Reset</span>
        </button>
        <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 shadow-lg shadow-teal-500/25">
          <SaveIcon className="h-5 w-5" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}