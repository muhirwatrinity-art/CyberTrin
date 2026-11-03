import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Sparkles, 
  FileText, 
  Send, 
  UserCheck, 
  Clock, 
  ArrowUpRight, 
  Share2, 
  BadgeAlert, 
  Scale, 
  FileCheck2, 
  DollarSign 
} from 'lucide-react';
import { IncidentReport, IncidentSeverity, IncidentStatus, ThreatIndicator } from '../types.ts';

interface AnalystWorkbenchProps {
  incidents: IncidentReport[];
  onUpdateIncident: (id: string, updates: Partial<IncidentReport> & { analystNote?: string }) => void;
  onPublishIOC: (ioc: Partial<ThreatIndicator>) => void;
}

export const AnalystWorkbench: React.FC<AnalystWorkbenchProps> = ({
  incidents,
  onUpdateIncident,
  onPublishIOC
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [assignedAnalyst, setAssignedAnalyst] = useState<string>('Capt. Jude Okello (UG-CERT)');

  const filteredIncidents = incidents.filter((inc) => {
    const matchesStatus = statusFilter === 'All' || inc.status === statusFilter;
    const matchesSeverity = severityFilter === 'All' || inc.severity === severityFilter;
    const matchesSearch = 
      !searchQuery ||
      inc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.affectedPlatform.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const activeIncident = incidents.find(i => i.id === selectedIncidentId) || filteredIncidents[0];

  const handleStatusChange = (newStatus: IncidentStatus) => {
    if (!activeIncident) return;
    onUpdateIncident(activeIncident.id, {
      status: newStatus,
      analystNote: `Status updated to "${newStatus}" by ${assignedAnalyst}`
    });
  };

  const handleSeverityChange = (newSeverity: IncidentSeverity) => {
    if (!activeIncident) return;
    onUpdateIncident(activeIncident.id, {
      severity: newSeverity,
      analystNote: `Severity re-evaluated to "${newSeverity}" by ${assignedAnalyst}`
    });
  };

  const handleReferralChange = (agency: any) => {
    if (!activeIncident) return;
    onUpdateIncident(activeIncident.id, {
      referredToAuthority: agency,
      analystNote: `Formal referral packet transferred to ${agency} under Computer Misuse Act protocol.`
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !activeIncident) return;

    onUpdateIncident(activeIncident.id, {
      analystNote: noteInput.trim(),
      assignedAnalyst
    });

    setNoteInput('');
  };

  const handlePublishIndicator = (identifier: string) => {
    if (!activeIncident) return;
    onPublishIOC({
      originalValue: identifier,
      normalizedValue: identifier,
      indicatorType: identifier.includes('http') || identifier.includes('.') ? 'URL / Domain' : 'Phone Number',
      threatCategory: activeIncident.incidentCategory,
      reviewStatus: 'Verified Malicious',
      confidence: 0.95,
      description: `Verified malicious indicator extracted from incident ${activeIncident.referenceNumber}: ${activeIncident.title}`,
      tags: ['Analyst-Verified', activeIncident.district, 'UG-CERT-Publish'],
      associatedIncidents: [activeIncident.referenceNumber]
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl overflow-hidden border border-amber-500/40 bg-slate-950 shadow-md shrink-0 hidden sm:block">
              <img 
                src="/assets/aistudio/ASSOCIATIOON_BUD_DON_E_8a09b5f8.jpg" 
                alt="CyberTrin Badge" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase tracking-wider">
                  CyberTrin Uganda Triage Operations
                </span>
                <span className="text-xs text-slate-400">National Cyber Threat Response Workbench</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Incident Triage & Forensic Analysis Workbench
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Examine live citizen reports, inspect automated Gemini AI forensic ratings, assign triage severity, coordinate referral with Uganda Police Cyber Unit, and publish IOCs.
              </p>
            </div>
          </div>

          {/* Active Analyst Selector */}
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3 shrink-0">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Acting CERT Analyst</div>
              <select
                value={assignedAnalyst}
                onChange={(e) => setAssignedAnalyst(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="Capt. Jude Okello (UG-CERT)">Capt. Jude Okello (UG-CERT)</option>
                <option value="Brenda Ainembabazi (Threat Intel Lead)">Brenda Ainembabazi (Threat Intel Lead)</option>
                <option value="Emmanuel Otim (Forensic Engineer)">Emmanuel Otim (Forensic Engineer)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference (CGU-2026-...), title, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted (New)</option>
              <option value="Under Review">Under Review</option>
              <option value="Active Investigation">Active Investigation</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue on Left, Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Incidents Queue */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[800px] overflow-y-auto pr-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Triage Pipeline ({filteredIncidents.length})</span>
            <span className="text-[11px] text-amber-400">
              {filteredIncidents.filter(i => i.status === 'Submitted' || i.status === 'Under Review').length} Pending
            </span>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No incident reports match current filters.
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isSelected = activeIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition relative ${
                    isSelected
                      ? 'bg-slate-850 border-amber-500 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {inc.referenceNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inc.severity === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800' :
                      inc.severity === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      inc.severity === 'Medium' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">
                    {inc.title}
                  </h3>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                    {inc.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/80">
                    <span className="text-slate-400">
                      {inc.district} • {inc.affectedPlatform}
                    </span>
                    <span className={`font-semibold ${
                      inc.status === 'Active Investigation' ? 'text-amber-400' :
                      inc.status === 'Mitigated' || inc.status === 'Resolved' ? 'text-emerald-400' :
                      'text-slate-300'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Incident Forensic Details */}
        <div className="lg:col-span-7 space-y-5">
          {activeIncident ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-cyan-400">
                      {activeIncident.referenceNumber}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      activeIncident.severity === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800' :
                      activeIncident.severity === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {activeIncident.severity} Severity
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                      {activeIncident.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">
                    {activeIncident.title}
                  </h2>
                </div>

                {/* Workflow Status Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={activeIncident.status}
                    onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-amber-400 focus:outline-none"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Active Investigation">Active Investigation</option>
                    <option value="Mitigated">Mitigated</option>
                    <option value="Resolved">Resolved</option>
                    <option value="False Positive">False Positive</option>
                  </select>
                </div>
              </div>

              {/* Fast Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-slate-200">{activeIncident.incidentCategory}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">District / Region</span>
                  <span className="font-semibold text-slate-200">{activeIncident.district} ({activeIncident.region})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Financial Loss</span>
                  <span className="font-bold text-amber-400">
                    UGX {activeIncident.estimatedFinancialLossUGX.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Legal Referral</span>
                  <span className="font-semibold text-cyan-300">{activeIncident.referredToAuthority || 'None'}</span>
                </div>
              </div>

              {/* Citizen Narrative */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Citizen Narrative & Description
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  {activeIncident.description}
                </div>
                <div className="mt-1.5 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>
                    Privacy Status: {activeIncident.isAnonymous ? '🔒 Anonymous Submission (Protected by DPPA 2019)' : `Contact Provided: ${activeIncident.reporter?.contact || 'Included in secure dossier'}`}
                  </span>
                  <span>Reported: {activeIncident.reportedAt}</span>
                </div>
              </div>

              {/* AI Forensic Triage Analysis */}
              {activeIncident.aiTriageAnalysis && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        Gemini AI Automated Forensic Assessment
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                      Score: {activeIncident.aiTriageAnalysis.threatScore}/100
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    {activeIncident.aiTriageAnalysis.summary}
                  </p>

                  {/* TTPs */}
                  {activeIncident.aiTriageAnalysis.detectedTTPs && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        MITRE ATT&CK & Ugandan Threat Signatures:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeIncident.aiTriageAnalysis.detectedTTPs.map((ttp, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono">
                            {ttp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Suspect Identifiers & IOC Promotion */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Suspect Indicators of Compromise (IOCs)
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Click to publish directly to public blocklist
                  </span>
                </div>

                <div className="space-y-2">
                  {activeIncident.suspectIdentifiers && activeIncident.suspectIdentifiers.length > 0 ? (
                    activeIncident.suspectIdentifiers.map((idVal, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                      >
                        <span className="font-mono text-cyan-300 font-bold">{idVal}</span>
                        <button
                          onClick={() => handlePublishIndicator(idVal)}
                          className="px-3 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-semibold rounded-lg transition flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Publish to Threat Blocklist</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-950 rounded-xl text-slate-500 text-xs italic">
                      No discrete suspect phone numbers or URLs extracted.
                    </div>
                  )}
                </div>
              </div>

              {/* Referral to Ugandan State Authority */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-300">
                    Formal Legal Referral:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Uganda Police Cyber Unit',
                    'NITA-U CERT',
                    'Bank of Uganda',
                    'UCC',
                    'None'
                  ].map((agency) => (
                    <button
                      key={agency}
                      onClick={() => handleReferralChange(agency as any)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        activeIncident.referredToAuthority === agency
                          ? 'bg-amber-600 text-white font-bold border-amber-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {agency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyst Case Notes & Audit Trail */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Case Activity Log & Analyst Notes
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeIncident.analystNotes && activeIncident.analystNotes.length > 0 ? (
                    activeIncident.analystNotes.map((note, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span className="font-bold text-amber-400">{note.author}</span>
                          <span>{note.timestamp}</span>
                        </div>
                        <p className="text-slate-300">{note.note}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-xs italic py-1">
                      No analyst notes logged yet.
                    </div>
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add an internal triage note or investigative update..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log Note</span>
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              Select an incident from the triage pipeline to view forensic analysis.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
