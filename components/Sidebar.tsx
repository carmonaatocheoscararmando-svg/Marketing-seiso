import React from 'react';
import { LayoutDashboard, Image, Film, Calendar, ShoppingBag, Database, Aperture } from 'lucide-react';
import { ViewState } from '../types';
import { getDatabase, downloadJSON } from '../services/persistence';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: 'ads' as ViewState, label: 'Generador Ads', icon: LayoutDashboard },
    { id: 'carousel' as ViewState, label: 'Creador Carruseles', icon: Image },
    { id: 'video' as ViewState, label: 'Video Viral Architect', icon: Film },
    { id: 'studio' as ViewState, label: 'Magic Studio', icon: Aperture },
    { id: 'planner' as ViewState, label: 'Planner & Genius', icon: Calendar },
  ];

  const handleDownloadBackup = () => {
    const db = getDatabase();
    downloadJSON(db, `Seiso_Backup_${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 z-20 shadow-xl">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
            <h1 className="font-bold text-xl tracking-tight">SEISO</h1>
            <p className="text-xs text-slate-400">Marketing Suite</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-3">
        <button 
          onClick={handleDownloadBackup}
          className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg"
        >
          <Database size={14} /> Descargar BD Completa
        </button>

        <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
          <p className="font-semibold text-slate-200 mb-1">Estado del Sistema</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div> Gemini: Online
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div> Grok AI: Online
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div> Suno AI: Online
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;