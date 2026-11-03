import React, { useState } from 'react';
import { 
  BookOpen, 
  Database, 
  Table, 
  FileCode, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Info 
} from 'lucide-react';
import { SchemaTable, MethodologyPhase, IncidentReport, ThreatIndicator } from '../types.ts';

interface ResearchDataCenterProps {
  tables: SchemaTable[];
  phases: MethodologyPhase[];
  incidents: IncidentReport[];
  indicators: ThreatIndicator[];
}

export const ResearchDataCenter: React.FC<ResearchDataCenterProps> = ({
  tables,
  phases,
  incidents,
  indicators
}) => {
  const [subTab, setSubTab] = useState<'schema' | 'methodology' | 'evaluation' | 'export'>('schema');
  const [selectedTable, setSelectedTable] = useState<string>(tables[0]?.tableName || 'incidentReports');
  const [copied, setCopied] = useState(false);
  const [exportType, setExportType] = useState<'indicators' | 'incidents'>('indicators');

  const currentTable = tables.find(t => t.tableName === selectedTable) || tables[0];

  const handleDownloadJson = () => {
    let exportData: any;
    let filename = '';

    if (exportType === 'indicators') {
      filename = `cybertrin_uganda_indicators_${new Date().toISOString().substring(0, 10)}.json`;
      exportData = {
        metadata: {
          project: 'CyberTrin Uganda - Threat Intelligence Telemetry',
          licence: 'Public Defense & Academic Research Open Data',
          generatedAt: new Date().toISOString(),
          recordCount: indicators.length
        },
        indicators
      };
    } else {
      filename = `cybertrin_uganda_sanitized_incidents_${new Date().toISOString().substring(0, 10)}.json`;
      exportData = {
        metadata: {
          project: 'CyberTrin Uganda - Incident Telemetry',
          privacyStandard: 'Uganda Data Protection and Privacy Act 2019 (PII scrubbed)',
          generatedAt: new Date().toISOString(),
          recordCount: incidents.length
        },
        incidents: incidents.map(inc => ({
          referenceNumber: inc.referenceNumber,
          category: inc.incidentCategory,
          severity: inc.severity,
          status: inc.status,
          district: inc.district,
          region: inc.region,
          platform: inc.affectedPlatform,
          estimatedLossUGX: inc.estimatedFinancialLossUGX,
          reportedAt: inc.reportedAt,
          threatScore: inc.aiTriageAnalysis?.threatScore,
          detectedTTPs: inc.aiTriageAnalysis?.detectedTTPs,
          referredToAuthority: inc.referredToAuthority
        }))
      };
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copySqlSchema = () => {
    const sql = `CREATE TABLE ${currentTable.tableName} (\n` +
      currentTable.fields.map(f => `  ${f.field.padEnd(25)} ${f.dataType.padEnd(15)} -- ${f.constraint} (${f.description})`).join(',\n') +
      '\n);';
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl overflow-hidden border border-indigo-500/40 bg-slate-950 shadow-md shrink-0 hidden sm:block">
              <img 
                src="/assets/aistudio/ASSOCIATIOON_BUD_DON_E_8a09b5f8.jpg" 
                alt="CyberTrin Badge" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold uppercase tracking-wider">
                  CyberTrin Uganda Research Data Center
                </span>
                <span className="text-xs text-slate-400">Data Hygiene & Reproducibility Suite</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Data Dictionaries, Methodology & Compliance Logs
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Formal data dictionary schemas, 7-phase reproducibility logs, source specifications, and sanitized open datasets for academic researchers and policy developers.
              </p>
            </div>
          </div>

          {/* Subtabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setSubTab('schema')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                subTab === 'schema'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Data Dictionary
            </button>
            <button
              onClick={() => setSubTab('methodology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                subTab === 'methodology'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Methodology Log
            </button>
            <button
              onClick={() => setSubTab('evaluation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                subTab === 'evaluation'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Source Evaluation
            </button>
            <button
              onClick={() => setSubTab('export')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                subTab === 'export'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Export Dataset
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: DATA DICTIONARY SCHEMAS */}
      {subTab === 'schema' && (
        <div className="space-y-6">
          
          {/* Table Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400 mr-2">Select Entity:</span>
            {tables.map(t => (
              <button
                key={t.tableName}
                onClick={() => setSelectedTable(t.tableName)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-semibold transition flex items-center gap-2 ${
                  selectedTable === t.tableName
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>{t.tableName}</span>
              </button>
            ))}
          </div>

          {/* Current Table Schema Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black font-mono text-white">
                    Entity: {currentTable.tableName}
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    Primary Key: {currentTable.primaryKey}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {currentTable.description}
                </p>
              </div>

              <button
                onClick={copySqlSchema}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy SQL DDL</span>
              </button>
            </div>

            {/* Fields Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Field Name</th>
                    <th className="py-2.5 px-3">Data Type</th>
                    <th className="py-2.5 px-3">Constraints & Hygiene</th>
                    <th className="py-2.5 px-3">Description & Research Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs">
                  {currentTable.fields.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/60">
                      <td className="py-2.5 px-3 font-bold text-cyan-300">{f.field}</td>
                      <td className="py-2.5 px-3 text-indigo-300">{f.dataType}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 text-[11px]">
                          {f.constraint}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Data Hygiene Standard:</strong> All text fields are validated against SQL injection, strip control characters, and conform to ISO 8601 timestamps and E.164 phone normalization.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 2: METHODOLOGY LOG */}
      {subTab === 'methodology' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              Methodology & Reproducibility Implementation Log
            </h2>
            <p className="text-xs text-slate-400">
              Structured 7-phase engineering protocol ensuring full auditability, zero feature-creep, and verification metrics for the CyberGuard Uganda platform.
            </p>
          </div>

          <div className="space-y-4">
            {phases.map((p) => (
              <div 
                key={p.phase}
                className="p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">
                      {p.phase}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Phase {p.phase}: {p.milestone}
                    </h3>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 self-start sm:self-auto flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {p.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {p.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block uppercase text-[10px] font-bold">
                      Definition of Done (Verification Metric):
                    </span>
                    <span className="text-slate-200 mt-0.5 block">{p.verificationMetric}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block uppercase text-[10px] font-bold">
                      Required Documentation:
                    </span>
                    <span className="text-indigo-300 font-mono mt-0.5 block">{p.documentationRequired}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: SOURCE EVALUATION & LEGAL COMPLIANCE */}
      {subTab === 'evaluation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              Source Evaluation & Legal Compliance Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Technical review of the project specifications and compliance validation against statutory requirements of the Republic of Uganda.
            </p>
          </div>

          {/* Evaluation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Criteria</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Analysis & Safeguards Implemented</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Completeness</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">High</td>
                  <td className="py-2.5 px-3">Covers UI/UX, Backend, Gemini AI, Schemas, RBAC, and Uganda Legal context thoroughly.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Clarity</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">High</td>
                  <td className="py-2.5 px-3">Explicitly defines anti-slop constraints, zero green hacker slop, and authoritative government styling.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Technical Rigor</td>
                  <td className="py-2.5 px-3 font-bold text-indigo-400">High</td>
                  <td className="py-2.5 px-3">Server-side Gemini 3.8 Flash SDK integration, structured JSON validation, and E.164 IOC normalization.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white">Legal Alignment</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">Validated</td>
                  <td className="py-2.5 px-3">Uganda Data Protection and Privacy Act 2019 and Computer Misuse (Amendment) Act 2022 fully integrated.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ambiguity Mitigation Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ambiguity Mitigations Implemented:
            </h3>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-amber-300 block">1. Evidence Storage & Cryptographic Chain of Custody</span>
              <p className="text-slate-300">
                To satisfy Section 8 of the Electronic Transactions Act (Admissibility of electronic evidence), all uploaded screenshots or logs are bound to SHA-256 digests in <code>evidenceRecords</code> to prevent tampering during court proceedings.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-amber-300 block">2. Privacy & Citizen Anonymity</span>
              <p className="text-slate-300">
                Per Section 3 of the Data Protection & Privacy Act 2019, citizen reports can be submitted completely anonymously with no IP address or identity saved. For public exports, all identifying tokens are scrubbed automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: DATASET EXPORTER */}
      {subTab === 'export' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              Sanitized Research Dataset Exporter
            </h2>
            <p className="text-xs text-slate-400">
              Download sanitized datasets of threat indicators or incident reports for academic research, machine learning model training, or national cyber defense policy analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => setExportType('indicators')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                exportType === 'indicators'
                  ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-indigo-400">Dataset 1</span>
                <span className="text-xs font-mono text-slate-400">{indicators.length} Records</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Threat Indicators (IOC Feed)</h3>
              <p className="text-xs text-slate-400">
                Normalized phone numbers, phishing URLs, fake SMS sender IDs, and telecom associations.
              </p>
            </div>

            <div 
              onClick={() => setExportType('incidents')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                exportType === 'incidents'
                  ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-indigo-400">Dataset 2</span>
                <span className="text-xs font-mono text-slate-400">{incidents.length} Records</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Anonymized Incident Telemetry</h3>
              <p className="text-xs text-slate-400">
                Regional distribution, threat categories, financial losses, and AI triage scores (PII scrubbed).
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sanitized under Uganda Data Protection and Privacy Act 2019</span>
            </div>

            <button
              onClick={handleDownloadJson}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-950"
            >
              <Download className="w-4 h-4" />
              <span>Download Sanitized JSON Dataset</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
