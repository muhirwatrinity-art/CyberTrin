import React, { useState } from 'react';
import { 
  BellRing, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Share2, 
  Download, 
  Phone, 
  Mail, 
  Building, 
  ExternalLink, 
  Copy, 
  Check 
} from 'lucide-react';
import { SecurityAdvisory, IncidentSeverity } from '../types.ts';

interface AdvisoriesSectionProps {
  advisories: SecurityAdvisory[];
  onOpenReportWithIndicator?: (ioc: string) => void;
}

export const AdvisoriesSection: React.FC<AdvisoriesSectionProps> = ({
  advisories,
  onOpenReportWithIndicator
}) => {
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = advisories.filter(a => 
    sectorFilter === 'All' || a.targetSector === sectorFilter
  );

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(`CyberGuard Uganda Advisory: ${code}`);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl overflow-hidden border border-red-500/40 bg-slate-950 shadow-md shrink-0 hidden sm:block">
              <img 
                src="/assets/aistudio/ASSOCIATIOON_BUD_DON_E_8a09b5f8.jpg" 
                alt="CyberTrin Badge" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 font-bold uppercase tracking-wider">
                  CyberTrin Uganda National Security Bulletins
                </span>
                <span className="text-xs text-slate-400">Threat Alerts & Defensive Guides</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Verified Cybersecurity Advisories
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Official threat advisories, ongoing smishing campaigns, and mitigation procedures published by CyberTrin Uganda and UG-CERT.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {['All', 'Citizens', 'SMEs', 'Financial & Fintech', 'SACCOs', 'Government'].map((sec) => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition ${
                  sectorFilter === sec
                    ? 'bg-blue-600 text-white font-bold border-blue-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advisory Cards List */}
      <div className="space-y-4">
        {filtered.map((adv) => (
          <div
            key={adv.id}
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4 hover:border-slate-700 transition"
          >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  adv.severity === 'Critical'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {adv.severity} Severity
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                  {adv.referenceCode}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900 font-semibold">
                  Sector: {adv.targetSector}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Published: {adv.publishedDate}</span>
                <button
                  onClick={() => handleCopyLink(adv.referenceCode)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Share bulletin"
                >
                  {copiedId === adv.referenceCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Advisory Title & Summary */}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5">
                {adv.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {adv.summary}
              </p>
            </div>

            {/* Vector & Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block uppercase text-[10px] font-bold mb-1">
                  Observed Attack Vector
                </span>
                <span className="text-slate-200">{adv.attackVector}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block uppercase text-[10px] font-bold mb-1">
                  Active Malicious Indicators
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {adv.indicators.map((ioc, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700 font-mono text-[11px]"
                    >
                      {ioc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Concrete Action & Remediation Steps */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Mandatory Protective Measures & Remediation:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {adv.remediationSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Official Emergency Contact Directory */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building className="w-4 h-4 text-amber-400" />
          Uganda National Cyber Incident Hotlines & Statutory Contacts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-amber-900/60 space-y-1">
            <span className="font-bold text-amber-300 block">CyberTrin Emergency Line</span>
            <p className="text-slate-400">24/7 National Emergency Hotline</p>
            <div className="pt-1 text-amber-300 font-mono font-bold">+256 772590517</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white block">UG-CERT Incident Desk</span>
            <p className="text-slate-400">National IT Authority Uganda (NITA-U)</p>
            <div className="pt-1 text-cyan-400 font-mono">0800 200 035 / cert@cert.ug</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white block">Police Cyber Unit (CID)</span>
            <p className="text-slate-400">CID Headquarters Kibuli, Kampala</p>
            <div className="pt-1 text-cyan-400 font-mono">+256 414 500 000</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white block">Bank of Uganda (FinTech)</span>
            <p className="text-slate-400">Consumer Financial Protection</p>
            <div className="pt-1 text-cyan-400 font-mono">info@bou.or.ug</div>
          </div>
        </div>
      </div>

    </div>
  );
};
