'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, WifiIcon, SettingsIcon, ActivityIcon, UserIcon } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm border-r border-gray-700/50 text-gray-100 p-6 shadow-2xl">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg mr-3">
            <ActivityIcon className="h-6 w-6 text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Raptor Dashboard</h1>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
      </div>
      <nav>
        <ul className="space-y-3">
          <li>
            <Link href="/" className={`group flex items-center py-4 px-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              pathname === '/' 
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-400' 
                : 'bg-gray-800/30 hover:bg-gray-700/50 border-gray-700/30 hover:border-teal-500/30'
            }`}>
              <div className={`p-2 rounded-lg mr-4 transition-colors duration-300 ${
                pathname === '/' 
                  ? 'bg-teal-500/30' 
                  : 'bg-teal-500/20 group-hover:bg-teal-500/30'
              }`}>
                <HomeIcon className="h-5 w-5 text-teal-400" />
              </div>
              <span className={`font-medium transition-colors duration-300 ${
                pathname === '/' 
                  ? 'text-teal-400' 
                  : 'group-hover:text-teal-400'
              }`}>Overview</span>
            </Link>
          </li>
          <li>
            <Link href="/tunnels" className={`group flex items-center py-4 px-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              pathname === '/tunnels' 
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                : 'bg-gray-800/30 hover:bg-gray-700/50 border-gray-700/30 hover:border-blue-500/30'
            }`}>
              <div className={`p-2 rounded-lg mr-4 transition-colors duration-300 ${
                pathname === '/tunnels' 
                  ? 'bg-blue-500/30' 
                  : 'bg-blue-500/20 group-hover:bg-blue-500/30'
              }`}>
                <WifiIcon className="h-5 w-5 text-blue-400" />
              </div>
              <span className={`font-medium transition-colors duration-300 ${
                pathname === '/tunnels' 
                  ? 'text-blue-400' 
                  : 'group-hover:text-blue-400'
              }`}>Tunnels</span>
            </Link>
          </li>
          <li>
            <Link href="/settings" className={`group flex items-center py-4 px-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              pathname === '/settings' 
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
                : 'bg-gray-800/30 hover:bg-gray-700/50 border-gray-700/30 hover:border-purple-500/30'
            }`}>
              <div className={`p-2 rounded-lg mr-4 transition-colors duration-300 ${
                pathname === '/settings' 
                  ? 'bg-purple-500/30' 
                  : 'bg-purple-500/20 group-hover:bg-purple-500/30'
              }`}>
                <SettingsIcon className="h-5 w-5 text-purple-400" />
              </div>
              <span className={`font-medium transition-colors duration-300 ${
                pathname === '/settings' 
                  ? 'text-purple-400' 
                  : 'group-hover:text-purple-400'
              }`}>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="absolute bottom-6 left-6 right-6">
        <div className="p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center mr-3">
              <UserIcon className="h-5 w-5 text-gray-900" />
            </div>
            <div className="flex-1">
              <p className="text-gray-100 font-medium">Admin User</p>
              <p className="text-gray-400 text-sm">admin@raptor.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}