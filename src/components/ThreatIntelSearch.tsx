import React, { useState } from 'react';
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Filter, 
  Plus, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Globe, 
  Phone, 
  MessageSquare, 
  Hash, 
  Layers 
} from 'lucide-react';
import { ThreatIndicator, IndicatorType, ReviewStatus } from '../types.ts';

interface ThreatIntelSearchProps {
  indicators: ThreatIndicator[];
  onAddIndicator: (ioc: Partial<ThreatIndicator>) => void;
  onOpenScannerWithText?: (text: string) => void;
}

export const ThreatIntelSearch: React.FC<ThreatIntelSearchProps> = ({
  indicators,
  onAddIndicator,
  onOpenScannerWithText
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Indicator Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState<IndicatorType>('Phone Number');
  const [newValue, setNewValue] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCarrier, setNewCarrier] = useState('MTN Uganda');

  const filtered = indicators.filter((ioc) => {
    const matchesSearch = 
      !searchTerm ||
      ioc.normalizedValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ioc.originalValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ioc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ioc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'All' || ioc.indicatorType === typeFilter;
    const matchesStatus = statusFilter === 'All' || ioc.reviewStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateIndicator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    onAddIndicator({
      indicatorType: newType,
      originalValue: newValue.trim(),
      normalizedValue: newValue.trim(),
      telecomOrProvider: newCarrier,
      description: newDescription.trim() || 'Reported via threat intelligence search portal.',
      reviewStatus: 'Suspicious',
      confidence: 0.75,
      tags: ['Citizen-Submission']
    });

    setNewValue('');
    setNewDescription('');
    setIsModalOpen(false);
  };

  const getTypeIcon = (type: IndicatorType) => {
    switch (type) {
      case 'Phone Number': return <Phone className="w-4 h-4 text-cyan-400" />;
      case 'URL / Domain': return <Globe className="w-4 h-4 text-blue-400" />;
      case 'SMS Sender ID': return <MessageSquare className="w-4 h-4 text-amber-400" />;
      default: return <Hash className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-md shrink-0 hidden sm:block">
              <img 
                src="/assets/aistudio/ASSOCIATIOON_BUD_DON_E_8a09b5f8.jpg" 
                alt="CyberTrin Badge" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase tracking-wider">
                  CyberTrin Uganda IOC Database
                </span>
                <span className="text-xs text-slate-400">National Threat Telemetry Repository</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Threat Intelligence & Scammer Indicator Search
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Cross-check suspicious phone numbers (+256...), phishing websites, fake SACCO portals, or SMS sender IDs against Uganda&apos;s verified cyber threat database.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950 transition flex items-center gap-2 self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Suspect Indicator</span>
          </button>
        </div>

        {/* Quick Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search phone number (+25677...), domain (ura-etax...), or scammer keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Indicator Types</option>
              <option value="Phone Number">Phone Numbers</option>
              <option value="URL / Domain">URLs & Domains</option>
              <option value="SMS Sender ID">SMS Sender IDs</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Statuses</option>
              <option value="Verified Malicious">Verified Malicious</option>
              <option value="Suspicious">Suspicious</option>
              <option value="Cleared / Safe">Cleared / Safe</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Popular Queries:</span>
          {['+256 772 491 820', 'ura-etax', 'UG-MOMO-ALERT', 'sacco-wealth'].map((q) => (
            <button
              key={q}
              onClick={() => setSearchTerm(q)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
            >
              {q}
            </button>
          ))}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-red-400 hover:text-red-300 ml-2"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Indexed Indicators</div>
          <div className="text-xl font-black text-white mt-0.5">{indicators.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Verified Malicious</div>
          <div className="text-xl font-black text-red-400 mt-0.5">
            {indicators.filter(i => i.reviewStatus === 'Verified Malicious').length}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Active Phishing Domains</div>
          <div className="text-xl font-black text-cyan-400 mt-0.5">
            {indicators.filter(i => i.indicatorType === 'URL / Domain').length}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Citizen Fraud Reports</div>
          <div className="text-xl font-black text-amber-400 mt-0.5">
            {indicators.reduce((acc, curr) => acc + curr.reportedCount, 0)}
          </div>
        </div>
      </div>

      {/* Indicator Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Indicators Matched &quot;{searchTerm}&quot;</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              This indicator has not yet been recorded as malicious in UG-CERT&apos;s verified repository. However, treat unsolicited contacts requesting money or PINs with caution.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
            >
              Report &quot;{searchTerm}&quot; as Suspicious
            </button>
          </div>
        ) : (
          filtered.map((ioc) => (
            <div
              key={ioc.id}
              className="p-4 sm:p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    {getTypeIcon(ioc.indicatorType)}
                  </div>
                  <span className="font-mono text-base font-bold text-white tracking-wide">
                    {ioc.originalValue}
                  </span>
                  
                  {/* Status Badge */}
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    ioc.reviewStatus === 'Verified Malicious'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : ioc.reviewStatus === 'Suspicious'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {ioc.reviewStatus}
                  </span>

                  {ioc.telecomOrProvider && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {ioc.telecomOrProvider}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {ioc.description}
                </p>

                {/* Metadata Tags & Associated Incidents */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {ioc.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      #{t}
                    </span>
                  ))}
                  {ioc.associatedIncidents && ioc.associatedIncidents.map((ref, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900 font-mono">
                      Ref: {ref}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right column stats & actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 gap-2 shrink-0">
                <div className="text-left sm:text-right">
                  <div className="text-xs font-semibold text-slate-400">
                    Reported: <strong className="text-white">{ioc.reportedCount} times</strong>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Last active: {ioc.lastActive}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(ioc.id, ioc.originalValue)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Copy IOC"
                  >
                    {copiedId === ioc.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {onOpenScannerWithText && (
                    <button
                      onClick={() => onOpenScannerWithText(ioc.originalValue)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Scan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Submit New Threat Indicator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                Submit Suspect Indicator of Compromise
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIndicator} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Indicator Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as IndicatorType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="Phone Number">Phone Number (+256...)</option>
                  <option value="URL / Domain">URL / Domain</option>
                  <option value="SMS Sender ID">SMS Sender ID</option>
                  <option value="Bank / MoMo Account">Bank / MoMo Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Indicator Value *</label>
                <input
                  type="text"
                  required
                  placeholder={newType === 'Phone Number' ? '+256 7...' : 'https://...'}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Carrier / Host</label>
                <input
                  type="text"
                  placeholder="e.g. MTN Uganda, Airtel Uganda, Cloudflare, etc."
                  value={newCarrier}
                  onChange={(e) => setNewCarrier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observed Scam Behavior</label>
                <textarea
                  rows={3}
                  placeholder="Describe what this number or link did..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
