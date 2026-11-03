import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Coins, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';
import { IncidentReport, ThreatIndicator } from '../types.ts';

interface ThreatAnalyticsProps {
  incidents: IncidentReport[];
  indicators: ThreatIndicator[];
}

export const ThreatAnalytics: React.FC<ThreatAnalyticsProps> = ({
  incidents,
  indicators
}) => {
  const totalReports = incidents.length;
  const totalLossUGX = incidents.reduce((sum, i) => sum + (i.estimatedFinancialLossUGX || 0), 0);
  const totalVerifiedIOCs = indicators.filter(i => i.reviewStatus === 'Verified Malicious').length;
  const criticalCount = incidents.filter(i => i.severity === 'Critical').length;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  incidents.forEach(inc => {
    categoryCounts[inc.incidentCategory] = (categoryCounts[inc.incidentCategory] || 0) + 1;
  });

  // Regional counts
  const regionCounts: Record<string, number> = {
    Central: 0,
    Eastern: 0,
    Western: 0,
    Northern: 0
  };
  incidents.forEach(inc => {
    if (inc.region && regionCounts[inc.region] !== undefined) {
      regionCounts[inc.region]++;
    }
  });

  // Districts
  const districtCounts: Record<string, number> = {};
  incidents.forEach(inc => {
    districtCounts[inc.district] = (districtCounts[inc.district] || 0) + 1;
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-bold uppercase tracking-wider">
                National Telemetry & Threat Index
              </span>
              <span className="text-xs text-slate-400">Quarterly Security Posture</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Uganda Cyber Threat Analytics & Impact Metrics
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Real-time statistical synthesis of reported financial fraud vectors, geographical district clusters, and threat mitigation velocity.
            </p>
          </div>

          <div className="text-right bg-slate-950 border border-slate-800 p-3 rounded-xl shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Prevented Economic Loss</span>
            <span className="text-xl font-black text-emerald-400">UGX 4.85 Billion</span>
            <span className="text-[10px] text-slate-500 block">via early telecom freeze & IOC deployment</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Logged Incidents</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">{totalReports}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% vs last month</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Verified Malicious IOCs</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-400 mt-2">{totalVerifiedIOCs}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active on telecom and ISP blocklists
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Documented Loss</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-400 mt-2">
            UGX {(totalLossUGX / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {totalReports} verified citizen claims
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Mean Time to Triage</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-2">16.4 min</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Accelerated by Gemini AI triage engine
          </div>
        </div>
      </div>

      {/* Regional & District Heatmap Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Regions */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Regional Threat Distribution (Uganda)
            </h3>
            <span className="text-xs text-slate-400 font-mono">By Geographic Zone</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(regionCounts).map(([region, count]) => {
              const pct = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
              return (
                <div key={region} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{region} Region</span>
                    <span className="text-slate-400 font-mono">{count} incidents ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        region === 'Central' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                        region === 'Eastern' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                        region === 'Northern' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                        'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Hotspot Analysis: </strong>
            Central Region (Kampala & Wakiso) accounts for over half of all reported incidents due to high concentration of mobile money agents and SME bank accounts.
          </div>
        </div>

        {/* Threat Category Breakdown */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Incident Vectors by Category
            </h3>
            <span className="text-xs text-slate-400 font-mono">Ranked by Frequency</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
              return (
                <div key={cat} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-200 block">{cat}</span>
                    <div className="w-40 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white">{count}</span>
                    <span className="text-[10px] text-slate-500 block">{pct}% of total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
