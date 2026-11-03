import React from 'react';
import { 
  FileText, 
  Search, 
  Layers, 
  BellRing, 
  BarChart3, 
  BookOpen, 
  Sparkles, 
  Phone, 
  ExternalLink,
  MapPin,
  Briefcase
} from 'lucide-react';
import { UgandaFlag } from './UgandaFlag.tsx';

export type ActiveTab = 
  | 'report' 
  | 'indicators' 
  | 'workbench' 
  | 'maps'
  | 'workspace'
  | 'advisories' 
  | 'analytics' 
  | 'research';

export type UserRole = 'citizen' | 'analyst' | 'lead';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  onOpenScanner: () => void;
  pendingTriageCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  onOpenScanner,
  pendingTriageCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      
      {/* Top National Alert & Emergency Hotline Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Partnership & Real Uganda Flag */}
          <div className="flex items-center gap-2.5 text-slate-400">
            <UgandaFlag className="w-6 h-4 shadow-sm" />
            <span className="font-bold text-white tracking-wide">Republic of Uganda</span>
            <span className="text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-300">
              National Cyber Security Operations (UG-CERT / NITA-U)
            </span>
          </div>

          {/* Emergency Telephone Number */}
          <div className="flex items-center gap-3">
            <a 
              href="tel:+256772590517"
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/80 transition"
              title="Call National Emergency Cyber Desk"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Emergency Hotline: +256 772590517</span>
            </a>

            {/* Role Switcher */}
            <div className="flex items-center gap-1 text-xs bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-medium hidden md:inline">Mode:</span>
              <button
                onClick={() => setUserRole('citizen')}
                className={`px-2 py-0.5 rounded transition ${
                  userRole === 'citizen' 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Citizen
              </button>
              <button
                onClick={() => setUserRole('analyst')}
                className={`px-2 py-0.5 rounded transition ${
                  userRole === 'analyst' 
                    ? 'bg-amber-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Analyst
              </button>
              <button
                onClick={() => setUserRole('lead')}
                className={`px-2 py-0.5 rounded transition ${
                  userRole === 'lead' 
                    ? 'bg-red-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lead Officer
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo Brand with Uploaded VUCDSA Badge Photo & Uganda Flag */}
          <div 
            onClick={() => setActiveTab('report')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            {/* Uploaded VUCDSA badge */}
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-blue-400/40 bg-slate-900 shadow-lg shadow-blue-950/80 group-hover:border-blue-400 group-hover:scale-105 transition-all">
              <img 
                src="/assets/aistudio/ASSOCIATIOON_BUD_DON_E_8a09b5f8.jpg" 
                alt="CyberTrin Uganda Official VUCDSA Badge" 
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  CyberTrin <span className="text-amber-400">Uganda</span>
                </span>
                <UgandaFlag className="w-5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  VUCDSA • CERT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                National Cyber Threat Reporting & Intelligence System
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'report'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Report Incident</span>
            </button>

            <button
              onClick={() => setActiveTab('indicators')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'indicators'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Threat Intel Search</span>
            </button>

            <button
              onClick={() => setActiveTab('workbench')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition relative ${
                activeTab === 'workbench'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Analyst Workbench</span>
              {pendingTriageCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                  {pendingTriageCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('maps')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'maps'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Incident Map</span>
            </button>

            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'workspace'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Workspace Suite</span>
            </button>

            <button
              onClick={() => setActiveTab('advisories')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'advisories'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <BellRing className="w-4 h-4" />
              <span>Advisories</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>National Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('research')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'research'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Data Dictionary</span>
            </button>
          </nav>

          {/* Right Action: AI Scanner Launcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/60 transition group border border-cyan-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">AI Scam Scanner</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </div>

        </div>

        {/* Mobile Submenu Navigation */}
        <div className="lg:hidden flex items-center overflow-x-auto py-2 border-t border-slate-800 gap-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'report' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300'}`}
          >
            Report
          </button>
          <button
            onClick={() => setActiveTab('indicators')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'indicators' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300'}`}
          >
            Intel Search
          </button>
          <button
            onClick={() => setActiveTab('workbench')}
            className={`px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 ${activeTab === 'workbench' ? 'bg-amber-600 text-white font-bold' : 'text-slate-300'}`}
          >
            Workbench
            {pendingTriageCount > 0 && <span className="px-1.5 py-0.2 bg-red-600 rounded-full text-[10px]">{pendingTriageCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab('maps')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'maps' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300'}`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'workspace' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300'}`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('advisories')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'advisories' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300'}`}
          >
            Advisories
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'analytics' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300'}`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('research')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'research' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300'}`}
          >
            Data Dictionary
          </button>
        </div>

      </div>
    </header>
  );
};
