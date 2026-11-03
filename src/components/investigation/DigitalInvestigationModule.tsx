import React, { useState, useEffect } from 'react';
import { 
  InvestigationCase, 
  EvidenceRecord, 
  ThreatInfrastructureGraph, 
  IpTraceResult, 
  DigitalArtifactType, 
  InfrastructureNode, 
  IncidentReport,
  ThreatIndicator 
} from '../../types.ts';
import { 
  INITIAL_INVESTIGATION_CASES, 
  INITIAL_EVIDENCE_RECORDS, 
  INITIAL_INFRASTRUCTURE_GRAPH 
} from '../../data/seedData.ts';
import { 
  Shield, 
  Search, 
  Terminal, 
  Network, 
  FileCheck2, 
  MapPin, 
  FileText, 
  Globe, 
  Server, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Plus, 
  Eye, 
  Download, 
  Fingerprint, 
  Building2, 
  Radio, 
  Info,
  Clock,
  UserCheck,
  Scale,
  RefreshCw,
  Send,
  Zap,
  Check
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import firebaseConfig from '../../../firebase-applet-config.json';
import { UgandaFlag } from '../UgandaFlag.tsx';
import { ForensicLeafletMap } from './ForensicLeafletMap.tsx';

interface DigitalInvestigationModuleProps {
  incidents: IncidentReport[];
  indicators: ThreatIndicator[];
  onOpenReportWithIndicator?: (ioc: string) => void;
}

type InvestigationSubTab = 
  | 'ip-tracer' 
  | 'artifact-examiner' 
  | 'threat-graph' 
  | 'evidence-locker' 
  | 'investigation-map' 
  | 'court-report';

export const DigitalInvestigationModule: React.FC<DigitalInvestigationModuleProps> = ({
  incidents,
  indicators
}) => {
  const [subTab, setSubTab] = useState<InvestigationSubTab>('ip-tracer');
  
  // Data states
  const [cases, setCases] = useState<InvestigationCase[]>(INITIAL_INVESTIGATION_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case-001');
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>(INITIAL_EVIDENCE_RECORDS);
  const [graphData, setGraphData] = useState<ThreatInfrastructureGraph>(INITIAL_INFRASTRUCTURE_GRAPH);
  
  // IP Tracer State
  const [ipQuery, setIpQuery] = useState<string>('102.134.42.19');
  const [isTracingIp, setIsTracingIp] = useState<boolean>(false);
  const [ipResult, setIpResult] = useState<IpTraceResult | null>(null);

  // Artifact Examiner State
  const [artifactType, setArtifactType] = useState<DigitalArtifactType>('Email Header');
  const [rawArtifactInput, setRawArtifactInput] = useState<string>(
`Delivered-To: victim.sacco@finance.ug
Received: by 2002:a05:6e02:18c4:b0:38f:7612:9182 with SMTP id k4csp48249ilv;
    Mon, 28 Oct 2026 09:12:34 -0700 (PDT)
Received: from mail-relay-ug.net (mail-relay-ug.net. [185.220.101.4])
    by mx.google.com with ESMTPS id o18-20020a05620a235200b007a216c59b6fsi6524177qka.121
    for <victim.sacco@finance.ug>;
Received: from 102.134.42.19 (EHLO uxp-internal.co.ug) (102.134.42.19)
    by mail-relay-ug.net with ESMTP; 28 Oct 2026 10:14:12 +0300
Authentication-Results: mx.google.com;
    dkim=fail header.i=@ura-tax.ug;
    spf=softfail (google.com: domain of transition does not designate 185.220.101.4 as permitted sender);
    dmarc=fail (p=REJECT sp=REJECT dis=NONE) header.from=ura-tax.ug
From: "Uganda Revenue Authority Notices" <refunds@ura-tax.ug>
To: victim.sacco@finance.ug
Subject: URGENT: TIN Assessment Rebate - Claim UGX 1,850,000 Before Expiry
Date: Mon, 28 Oct 2026 10:14:10 +0300
Content-Type: text/html

<p>Click here to verify your mobile money credentials: http://ura-etax-uganda-portal.net/login</p>`
  );
  const [isAnalyzingArtifact, setIsAnalyzingArtifact] = useState<boolean>(false);
  const [artifactAnalysisResult, setArtifactAnalysisResult] = useState<any | null>(null);

  // Graph Inspection State
  const [selectedGraphNode, setSelectedGraphNode] = useState<InfrastructureNode | null>(null);
  const [graphFilterConfirmedOnly, setGraphFilterConfirmedOnly] = useState<boolean>(false);

  // Evidence Locker Modal
  const [isAddEvidenceModalOpen, setIsAddEvidenceModalOpen] = useState<boolean>(false);
  const [newEvidenceTitle, setNewEvidenceTitle] = useState<string>('');
  const [newEvidenceType, setNewEvidenceType] = useState<DigitalArtifactType>('IP Address');
  const [newEvidenceValue, setNewEvidenceValue] = useState<string>('');
  const [newEvidenceAuth, setNewEvidenceAuth] = useState<string>('Section 28 Computer Misuse Act 2022');
  const [selectedEvidenceForCustody, setSelectedEvidenceForCustody] = useState<EvidenceRecord | null>(null);

  // Report Generator State
  const [reportAgency, setReportAgency] = useState<string>('Uganda Police Cybercrime CID');
  const [reportNotes, setReportNotes] = useState<string>('All digital evidence collected under strict hash verification. Section 28 Production Orders recommended for telecom subscriber records.');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<{ caseNumber: string; generatedAt: string; reportMarkdown: string } | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const activeCase = cases.find(c => c.id === selectedCaseId || c.caseNumber === selectedCaseId) || cases[0];
  const caseEvidence = evidenceList.filter(e => e.caseId === activeCase.id || e.caseId === activeCase.caseNumber);

  const envMapsKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string)?.trim() || '';
  const [customApiKey] = useState<string>(() => localStorage.getItem('CYBERTRIN_GMP_KEY') || '');
  const apiKey = customApiKey || envMapsKey;
  const [mapError, setMapError] = useState<boolean>(false);

  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('Digital Investigation: Google Maps auth/activation failure (ApiNotActivatedMapError). Falling back to Forensic Tactical Vector Grid.');
      setMapError(true);
      if (typeof prevAuthFailure === 'function') {
        try { prevAuthFailure(); } catch {}
      }
    };

    const handleWindowError = (e: ErrorEvent) => {
      if (e.message && (e.message.includes('ApiNotActivatedMapError') || e.message.includes('Google Maps JavaScript API error'))) {
        setMapError(true);
      }
    };
    window.addEventListener('error', handleWindowError);

    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  // Initial Load & Automatic IP Trace on mount
  useEffect(() => {
    handleTraceIp('102.134.42.19');
  }, []);

  // IP Trace Execution
  const handleTraceIp = async (targetIp: string) => {
    if (!targetIp.trim()) return;
    setIsTracingIp(true);
    try {
      const res = await fetch('/api/investigation/trace-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIp.trim() })
      });
      if (res.ok) {
        const data: IpTraceResult = await res.json();
        setIpResult(data);
      }
    } catch (err) {
      console.warn('IP trace request failed:', err);
    } finally {
      setIsTracingIp(false);
    }
  };

  // AI Trace Examination
  const handleAnalyzeArtifact = async () => {
    if (!rawArtifactInput.trim()) return;
    setIsAnalyzingArtifact(true);
    try {
      const res = await fetch('/api/investigation/ai-trace-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType,
          rawData: rawArtifactInput,
          caseContext: `Active Case: ${activeCase.caseNumber} - ${activeCase.title}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setArtifactAnalysisResult(data);
      }
    } catch (err) {
      console.error('Artifact analysis error:', err);
    } finally {
      setIsAnalyzingArtifact(false);
    }
  };

  // Add evidence to case locker
  const handleSaveEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceValue.trim()) return;

    try {
      const res = await fetch('/api/investigation/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: activeCase.id,
          title: newEvidenceTitle || `Evidence Exhibit: ${newEvidenceType}`,
          artifactType: newEvidenceType,
          rawValue: newEvidenceValue,
          collectedBy: 'Authorized Forensics Examiner',
          legalAuthorization: newEvidenceAuth
        })
      });

      if (res.ok) {
        const created: EvidenceRecord = await res.json();
        setEvidenceList(prev => [created, ...prev]);
        setIsAddEvidenceModalOpen(false);
        setNewEvidenceTitle('');
        setNewEvidenceValue('');
      }
    } catch (err) {
      console.warn('Failed to record evidence:', err);
    }
  };

  // Save current IP trace result as evidence
  const handleSaveIpAsEvidence = async () => {
    if (!ipResult) return;
    try {
      const res = await fetch('/api/investigation/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: activeCase.id,
          title: `IP Trace Intelligence Record: ${ipResult.ip} (${ipResult.isp})`,
          artifactType: 'IP Address',
          rawValue: JSON.stringify(ipResult, null, 2),
          collectedBy: activeCase.leadInvestigator,
          legalAuthorization: activeCase.statutoryBasis
        })
      });
      if (res.ok) {
        const created = await res.json();
        setEvidenceList(prev => [created, ...prev]);
        alert(`Exhibit saved! Cryptographic Hash: ${created.sha256Hash.substring(0, 16)}...`);
      }
    } catch (err) {
      console.warn('Failed to save IP trace:', err);
    }
  };

  // Generate Court Report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/investigation/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: activeCase.id,
          investigatorNotes: reportNotes,
          requestedAgency: reportAgency
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedReport(data);
      }
    } catch (err) {
      console.warn('Report generation failed:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">

      {/* Top Header & Legal Investigation Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-900/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-indigo-900/90 text-indigo-200 border border-indigo-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                UG-CERT & Uganda Police CID
              </span>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                Computer Misuse Act 2022 • Electronic Evidence Standards
              </span>
              <UgandaFlag className="w-5 h-3.5 shadow-sm" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Fingerprint className="w-7 h-7 text-indigo-400" />
              Cybercrime Digital Tracing & Forensics Module
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Authorized digital forensics workbench for analyzing IP addresses, resolving hosting infrastructure, 
              correlating threat actor indicators, and cryptographically preserving court-admissible electronic evidence.
            </p>
          </div>

          {/* Active Case Selector Card */}
          <div className="bg-slate-950/90 border border-indigo-800/80 rounded-2xl p-4 shrink-0 min-w-[280px] shadow-xl">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block mb-1">
              Active Case Assignment:
            </span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 mb-2"
            >
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.title.substring(0, 30)}...
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div><strong>Lead:</strong> {activeCase.leadInvestigator}</div>
              <div><strong>Warrant:</strong> <span className="text-emerald-400 font-semibold">{activeCase.legalWarrantStatus}</span></div>
            </div>
          </div>
        </div>

        {/* Mandatory Forensic Disclaimer Bar */}
        <div className="mt-5 p-3 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="leading-relaxed">
            <strong className="text-amber-300 font-bold">CRITICAL FORENSIC LIMITATION NOTICE:</strong> Digital IP addresses and hosting infrastructure locations represent network transit facilities, data centers, and internet service providers. Under Uganda law (Computer Misuse Act 2022 & Evidence Act), an IP location must <strong>never</strong> be presented as a suspect's physical location. Exact subscriber attribution requires a formal <strong>Section 28 Court Production Order</strong> served upon telecommunications carriers.
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setSubTab('ip-tracer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition shrink-0 ${
            subTab === 'ip-tracer'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>IP Geolocation & Tracer</span>
        </button>

        <button
          onClick={() => setSubTab('artifact-examiner')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition shrink-0 ${
            subTab === 'artifact-examiner'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Artifact & Header Examiner</span>
        </button>

        <button
          onClick={() => setSubTab('threat-graph')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition shrink-0 ${
            subTab === 'threat-graph'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Network className="w-4 h-4 text-emerald-400" />
          <span>Threat Actor Infrastructure Graph</span>
        </button>

        <button
          onClick={() => setSubTab('evidence-locker')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition shrink-0 ${
            subTab === 'evidence-locker'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Lock className="w-4 h-4 text-rose-400" />
          <span>Evidence Locker (SHA-256)</span>
          <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">
            {caseEvidence.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('investigation-map')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition shrink-0 ${
            subTab === 'investigation-map'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>Investigation Map</span>
        </button>

        <button
          onClick={() => setSubTab('court-report')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition shrink-0 ${
            subTab === 'court-report'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Court Report Generator</span>
        </button>
      </div>

      {/* SUBTAB 1: IP GEOLOCATION & INFRASTRUCTURE TRACER */}
      {subTab === 'ip-tracer' && (
        <div className="space-y-6">
          {/* Query Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              IP Address Deep Forensics & BGP Routing Trace
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter any IPv4 or IPv6 address observed in cybercrime telemetry to resolve autonomous systems, hosting data centers, and reputation.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
              <input
                type="text"
                value={ipQuery}
                onChange={(e) => setIpQuery(e.target.value)}
                placeholder="e.g. 102.134.42.19 or 197.239.8.5"
                className="w-full sm:flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleTraceIp(ipQuery)}
                disabled={isTracingIp}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-cyan-950/60 transition flex items-center justify-center gap-2 text-xs"
              >
                <Zap className={`w-4 h-4 ${isTracingIp ? 'animate-spin' : ''}`} />
                <span>{isTracingIp ? 'Tracing Infrastructure...' : 'Trace Digital Route'}</span>
              </button>
            </div>

            {/* Quick suspect IP presets from case files */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Suspect Traces in Active Cases:</span>
              {['102.134.42.19', '197.239.8.5', '45.142.182.11', '185.220.101.4'].map(ip => (
                <button
                  key={ip}
                  onClick={() => {
                    setIpQuery(ip);
                    handleTraceIp(ip);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono hover:bg-slate-800 transition"
                >
                  {ip}
                </button>
              ))}
            </div>
          </div>

          {/* Trace Results Display */}
          {ipResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Key Forensic Metadata */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Target Digital Indicator
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {ipResult.ip}
                    </span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                      {ipResult.ipVersion}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                      ipResult.reputationScore > 80 
                        ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse' 
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    }`}>
                      {ipResult.reputationCategory}
                    </span>
                    <button
                      onClick={handleSaveIpAsEvidence}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Seal as Exhibit</span>
                    </button>
                  </div>
                </div>

                {/* Infrastructure Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-semibold block">Autonomous System (ASN):</span>
                    <span className="text-sm font-bold text-white font-mono">{ipResult.asn}</span>
                    <p className="text-slate-400 text-[11px]">{ipResult.asOrg}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-semibold block">ISP / Upstream Carrier:</span>
                    <span className="text-sm font-bold text-white">{ipResult.isp}</span>
                    <p className="text-slate-400 text-[11px]">BGP Route Carrier</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-semibold block">Geographical Node:</span>
                    <span className="text-sm font-bold text-white">{ipResult.city}, {ipResult.country}</span>
                    <p className="text-slate-400 text-[11px]">Region: {ipResult.region} ({ipResult.countryCode})</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-semibold block">Coordinates (Approximate Facility):</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {ipResult.approxLat.toFixed(4)}, {ipResult.approxLng.toFixed(4)}
                    </span>
                    <p className="text-slate-500 text-[10px]">Server hosting facility estimate only</p>
                  </div>
                </div>

                {/* Threat Indicators & Cloaking Checks */}
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    Anonymization & Proxy Infrastructure Checks:
                  </span>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
                      ipResult.isTorExitNode ? 'bg-red-950/60 border-red-800 text-red-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <span className="font-bold">Tor Exit Node</span>
                      <span className="text-[11px] font-semibold">{ipResult.isTorExitNode ? 'DETECTED' : 'Not Detected'}</span>
                    </div>

                    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
                      ipResult.isVpnOrProxy ? 'bg-amber-950/60 border-amber-800 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <span className="font-bold">VPN / Proxy Cloak</span>
                      <span className="text-[11px] font-semibold">{ipResult.isVpnOrProxy ? 'DETECTED' : 'Not Detected'}</span>
                    </div>

                    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
                      ipResult.isDataCenterOrHosting ? 'bg-purple-950/60 border-purple-800 text-purple-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <span className="font-bold">Hosting / VPS</span>
                      <span className="text-[11px] font-semibold">{ipResult.isDataCenterOrHosting ? 'Data Center' : 'Residential/Transit'}</span>
                    </div>
                  </div>
                </div>

                {/* Associated Domains */}
                {ipResult.associatedDomains.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-300 block mb-2">
                      Associated Domains Observed on this IP:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ipResult.associatedDomains.map((dom, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300">
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Reputation & Forensic Disclaimer */}
              <div className="space-y-6">
                
                {/* Threat Score Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-center space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Infrastructure Risk Score
                  </span>
                  
                  <div className="relative inline-flex items-center justify-center">
                    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${
                      ipResult.reputationScore > 80 
                        ? 'border-red-500 bg-red-950/40 text-red-400' 
                        : 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                    }`}>
                      <span className="text-3xl font-black">{ipResult.reputationScore}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Observed in <strong>{ipResult.historicalThreatCount}</strong> prior threat reports and telemetry probes.
                  </p>
                </div>

                {/* Lawful Process Guidance Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-amber-400">
                    <Scale className="w-4 h-4" />
                    Required Lawful Next Step
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    To transition from digital server telemetry to physical suspect attribution:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                    <li>Submit formal requisition to Chief Magistrate for a Section 28 Production Order under the Computer Misuse Act 2022.</li>
                    <li>Serve production order on <strong>{ipResult.isp}</strong> requesting subscriber DHCP assignment logs for timestamp of incident.</li>
                    <li>Verify IMSI / SIM card bindings with telecommunications carriers.</li>
                  </ol>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ARTIFACT & HEADER EXAMINER */}
      {subTab === 'artifact-examiner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Input Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Digital Artifact & Protocol Examiner
                </h3>
                <p className="text-xs text-slate-400">
                  Analyze raw email headers, network packet dumps, WHOIS records, or malware hashes.
                </p>
              </div>

              <select
                value={artifactType}
                onChange={(e) => setArtifactType(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
              >
                <option value="Email Header">Email Header</option>
                <option value="Network Log">Network Log</option>
                <option value="URL">Malicious URL / Domain</option>
                <option value="File Hash">File Hash (SHA-256/MD5)</option>
                <option value="WHOIS Entry">WHOIS / DNS Record</option>
              </select>
            </div>

            <textarea
              rows={14}
              value={rawArtifactInput}
              onChange={(e) => setRawArtifactInput(e.target.value)}
              placeholder="Paste raw email headers, network logs, or hashes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                {rawArtifactInput.length} bytes
              </span>

              <button
                onClick={handleAnalyzeArtifact}
                disabled={isAnalyzingArtifact || !rawArtifactInput.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-amber-950/60 transition flex items-center gap-2 text-xs"
              >
                <Sparkles className={`w-4 h-4 ${isAnalyzingArtifact ? 'animate-spin' : ''}`} />
                <span>{isAnalyzingArtifact ? 'Conducting Forensics...' : 'Run Forensic Examination'}</span>
              </button>
            </div>
          </div>

          {/* Right: AI Forensic Examination Report */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-indigo-400" />
              Forensic Examination Findings
            </h3>

            {isAnalyzingArtifact && (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-xs">Correlating header hops, evaluating SPF/DKIM, and mapping MITRE techniques...</p>
              </div>
            )}

            {!isAnalyzingArtifact && !artifactAnalysisResult && (
              <div className="p-12 text-center text-slate-500 text-xs">
                Click &ldquo;Run Forensic Examination&rdquo; to parse digital traces, extract originating IPs, detect forgery, and recommend lawful next steps.
              </div>
            )}

            {!isAnalyzingArtifact && artifactAnalysisResult && (
              <div className="space-y-4 text-xs">
                
                {/* Summary */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">Forensic Summary</span>
                  <p className="text-slate-200 leading-relaxed">
                    {artifactAnalysisResult.forensicSummary}
                  </p>
                </div>

                {/* Email Header Specific Checks */}
                {artifactAnalysisResult.emailHeaderAnalysis && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">
                      Authentication & Header Validation
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">SPF Status:</span>
                        <strong className={artifactAnalysisResult.emailHeaderAnalysis.spfResult === 'Pass' ? 'text-emerald-400' : 'text-red-400'}>
                          {artifactAnalysisResult.emailHeaderAnalysis.spfResult}
                        </strong>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">DKIM Status:</span>
                        <strong className={artifactAnalysisResult.emailHeaderAnalysis.dkimResult === 'Pass' ? 'text-emerald-400' : 'text-red-400'}>
                          {artifactAnalysisResult.emailHeaderAnalysis.dkimResult}
                        </strong>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">DMARC:</span>
                        <strong className={artifactAnalysisResult.emailHeaderAnalysis.dmarcResult === 'Pass' ? 'text-emerald-400' : 'text-red-400'}>
                          {artifactAnalysisResult.emailHeaderAnalysis.dmarcResult}
                        </strong>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">Header Forgery:</span>
                        <strong className={artifactAnalysisResult.emailHeaderAnalysis.isForged ? 'text-red-400' : 'text-emerald-400'}>
                          {artifactAnalysisResult.emailHeaderAnalysis.isForged ? 'DETECTED' : 'Clean'}
                        </strong>
                      </div>
                    </div>

                    {artifactAnalysisResult.emailHeaderAnalysis.originatingIp && (
                      <div className="pt-2 text-slate-300">
                        <strong>True Originating IP:</strong>{' '}
                        <button
                          onClick={() => {
                            setIpQuery(artifactAnalysisResult.emailHeaderAnalysis.originatingIp);
                            setSubTab('ip-tracer');
                            handleTraceIp(artifactAnalysisResult.emailHeaderAnalysis.originatingIp);
                          }}
                          className="font-mono text-cyan-300 underline hover:text-cyan-200"
                        >
                          {artifactAnalysisResult.emailHeaderAnalysis.originatingIp} (Click to Trace)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Indicators */}
                {artifactAnalysisResult.extractedIndicators?.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-300 block mb-2">Extracted Digital Traces:</span>
                    <div className="space-y-1.5">
                      {artifactAnalysisResult.extractedIndicators.map((ind: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <div>
                            <span className="font-mono text-cyan-300 font-bold mr-2">{ind.value}</span>
                            <span className="text-[10px] text-slate-400">{ind.role}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {ind.indicatorType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hypothesis */}
                {artifactAnalysisResult.forensicHypothesis && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                      Forensic Working Hypothesis
                    </span>
                    <p className="text-slate-300 italic">
                      &ldquo;{artifactAnalysisResult.forensicHypothesis}&rdquo;
                    </p>
                  </div>
                )}

                {/* Recommended Next Steps under Uganda Law */}
                {artifactAnalysisResult.recommendedLawfulSteps?.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-300 block mb-1.5">
                      Recommended Lawful Actions (Computer Misuse Act 2022):
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                      {artifactAnalysisResult.recommendedLawfulSteps.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}

      {/* SUBTAB 3: THREAT ACTOR INFRASTRUCTURE GRAPH */}
      {subTab === 'threat-graph' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-emerald-400" />
                  Interactive Threat Actor Infrastructure & Relationship Graph
                </h3>
                <p className="text-xs text-slate-400">
                  Visual correlation connecting IPs, domains, hosting providers, malware hashes, and incidents.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={graphFilterConfirmedOnly}
                    onChange={(e) => setGraphFilterConfirmedOnly(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Show Confirmed Links Only</span>
                </label>
              </div>
            </div>

            {/* Visual Node-Link Canvas Container */}
            <div className="relative w-full h-[520px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-6">
              
              {/* Background Radar Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

              {/* Node Matrix Rendering */}
              <div className="relative z-10 w-full h-full flex flex-col justify-between">
                
                {/* Top Row: Threat Actor & Incidents */}
                <div className="flex justify-around items-center gap-4">
                  {graphData.nodes.filter(n => n.nodeType === 'Threat Actor' || n.nodeType === 'Incident').map(node => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedGraphNode(node)}
                      className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 max-w-[200px] shadow-xl ${
                        selectedGraphNode?.id === node.id 
                          ? 'border-white scale-105 ring-4 ring-indigo-500/50' 
                          : node.nodeType === 'Threat Actor' 
                            ? 'bg-rose-950/80 border-rose-600 text-rose-200' 
                            : 'bg-blue-950/80 border-blue-600 text-blue-200'
                      }`}
                    >
                      <Fingerprint className="w-5 h-5" />
                      <span className="text-xs font-black text-center">{node.label}</span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400">{node.nodeType}</span>
                    </button>
                  ))}
                </div>

                {/* Middle Row: Domains & Hashes */}
                <div className="flex justify-around items-center gap-4 py-6">
                  {graphData.nodes.filter(n => n.nodeType === 'Domain' || n.nodeType === 'Malware Hash').map(node => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedGraphNode(node)}
                      className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 max-w-[220px] shadow-xl ${
                        selectedGraphNode?.id === node.id 
                          ? 'border-white scale-105 ring-4 ring-indigo-500/50' 
                          : node.nodeType === 'Domain'
                            ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                            : 'bg-purple-950/80 border-purple-600 text-purple-200'
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                      <span className="text-xs font-bold text-center truncate w-full">{node.label}</span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400">{node.nodeType}</span>
                    </button>
                  ))}
                </div>

                {/* Bottom Row: IP Addresses & Hosting ASNs */}
                <div className="flex justify-around items-center gap-4">
                  {graphData.nodes.filter(n => n.nodeType === 'IP' || n.nodeType === 'Hosting / ASN').map(node => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedGraphNode(node)}
                      className={`p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 max-w-[190px] shadow-xl ${
                        selectedGraphNode?.id === node.id 
                          ? 'border-white scale-105 ring-4 ring-indigo-500/50' 
                          : node.nodeType === 'IP'
                            ? 'bg-cyan-950/80 border-cyan-600 text-cyan-200'
                            : 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                      }`}
                    >
                      <Server className="w-4 h-4" />
                      <span className="text-xs font-mono font-bold text-center">{node.label}</span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400">{node.nodeType}</span>
                    </button>
                  ))}
                </div>

              </div>

              {/* Node Inspector Overlay Card */}
              {selectedGraphNode && (
                <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 rounded-2xl p-4 max-w-xs shadow-2xl backdrop-blur-md z-20 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">
                      {selectedGraphNode.nodeType} Inspection
                    </span>
                    <button
                      onClick={() => setSelectedGraphNode(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{selectedGraphNode.label}</h4>
                  <p className="text-slate-300 text-xs mb-2">{selectedGraphNode.details}</p>
                  
                  {selectedGraphNode.reputation && (
                    <div className="mb-2">
                      <span className="text-[10px] text-slate-500 uppercase block">Reputation:</span>
                      <span className="font-bold text-amber-400">{selectedGraphNode.reputation}</span>
                    </div>
                  )}

                  {selectedGraphNode.nodeType === 'IP' && (
                    <button
                      onClick={() => {
                        setIpQuery(selectedGraphNode.label);
                        setSubTab('ip-tracer');
                        handleTraceIp(selectedGraphNode.label);
                      }}
                      className="w-full mt-2 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition"
                    >
                      Run Deep IP Geolocation
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* Relationship Legend & Status */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-300">Relationship Classification:</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-0.5 bg-emerald-500" /> Confirmed Link (Verified Forensic Handshake)
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-0.5 bg-amber-500 border-dashed border-b" /> Suspected Link (Intelligence Correlation)
                </span>
              </div>

              <span>Total Nodes: {graphData.nodes.length} • Total Correlated Links: {graphData.links.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: EVIDENCE LOCKER (SHA-256 INTEGRITY) */}
      {subTab === 'evidence-locker' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-400" />
                  Digital Evidence Locker & Cryptographic Chain of Custody
                </h3>
                <p className="text-xs text-slate-400">
                  Cryptographically verified exhibits preserved under Section 28 of the Uganda Computer Misuse Act 2022.
                </p>
              </div>

              <button
                onClick={() => setIsAddEvidenceModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Deposit Evidence Exhibit</span>
              </button>
            </div>

            {/* Evidence Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Exhibit Title</th>
                    <th className="py-3 px-3">Artifact Type</th>
                    <th className="py-3 px-3 font-mono">SHA-256 Integrity Hash</th>
                    <th className="py-3 px-3">Collected Date</th>
                    <th className="py-3 px-3">Legal Basis</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {caseEvidence.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-950/50 transition">
                      <td className="py-3 px-3">
                        <strong className="text-white block">{ev.title}</strong>
                        <span className="text-[10px] text-slate-500">Collected by {ev.collectedBy}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                          {ev.artifactType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-emerald-400">
                        {ev.sha256Hash.substring(0, 20)}...
                      </td>
                      <td className="py-3 px-3 text-slate-400">{ev.collectedAt}</td>
                      <td className="py-3 px-3 text-slate-300 text-[11px]">{ev.legalAuthorization}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedEvidenceForCustody(ev)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-lg transition"
                        >
                          Chain of Custody
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: INVESTIGATION MAP */}
      {subTab === 'investigation-map' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                Geographical Infrastructure & Incident Correlation Map
              </h3>
              <p className="text-xs text-slate-400">
                Visualizing suspect routing servers, proxy gateways, and citizen incident locations across Uganda.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Legal Authority:</span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                {activeCase.statutoryBasis.substring(0, 32)}...
              </span>
            </div>
          </div>

          {/* 100% Free & Cardless Forensic Cyber Intelligence Attack Topology Map */}
          <ForensicLeafletMap height="540px" />


          <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-400">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-300">Marker Types:</span>
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="w-2.5 h-2.5 rounded bg-rose-600" /> Server Infrastructure Location
              </span>
              <span className="flex items-center gap-1 text-blue-400 font-bold">
                <span className="w-2.5 h-2.5 rounded bg-blue-600" /> Victim Incident Location
              </span>
            </div>

            <div className="text-amber-300 text-[11px] font-semibold">
              Notice: Server infrastructure is distinct from human suspect physical location.
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: COURT REPORT GENERATOR */}
      {subTab === 'court-report' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" />
              Court-Admissible Dossier Configuration
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Certifying Agency:</label>
                <select
                  value={reportAgency}
                  onChange={(e) => setReportAgency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none"
                >
                  <option value="Uganda Police Cybercrime CID">Uganda Police Cybercrime CID</option>
                  <option value="UG-CERT / NITA-U">UG-CERT / NITA-U</option>
                  <option value="Bank of Uganda Forensics">Bank of Uganda Forensics</option>
                  <option value="Joint Inter-Agency Taskforce">Joint Inter-Agency Taskforce</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Investigator Synthesis Notes:</label>
                <textarea
                  rows={5}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div><strong>Case Ref:</strong> {activeCase.caseNumber}</div>
                <div><strong>Evidence Exhibits:</strong> {caseEvidence.length} cryptographically sealed items</div>
                <div><strong>Statutory Basis:</strong> Computer Misuse Act 2022</div>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                <span>{isGeneratingReport ? 'Compiling Formal Dossier...' : 'Generate Official Court Report'}</span>
              </button>
            </div>
          </div>

          {/* Report Viewer */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Court-Ready Forensic Investigation Report
              </h3>

              {generatedReport && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedReport.reportMarkdown);
                    setCopiedReport(true);
                    setTimeout(() => setCopiedReport(false), 2000);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReport ? 'Copied Markdown!' : 'Copy Dossier'}</span>
                </button>
              )}
            </div>

            {!generatedReport && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-xs text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-700" />
                <p>Click &ldquo;Generate Official Court Report&rdquo; to compile the full forensic investigation report complete with SHA-256 evidence chain, infrastructure tracing, and legal recommendations.</p>
              </div>
            )}

            {generatedReport && (
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 font-sans text-xs text-slate-200 overflow-y-auto max-h-[600px] whitespace-pre-wrap leading-relaxed select-text">
                {generatedReport.reportMarkdown}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {isAddEvidenceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                Deposit Digital Evidence Exhibit
              </h3>
              <button
                onClick={() => setIsAddEvidenceModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Exhibit Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Captured Server Response Header from Phishing Origin"
                  value={newEvidenceTitle}
                  onChange={(e) => setNewEvidenceTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Artifact Type:</label>
                <select
                  value={newEvidenceType}
                  onChange={(e) => setNewEvidenceType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="IP Address">IP Address</option>
                  <option value="Domain">Domain</option>
                  <option value="URL">URL</option>
                  <option value="Email Header">Email Header</option>
                  <option value="Network Log">Network Log</option>
                  <option value="File Hash">File Hash</option>
                  <option value="WHOIS Entry">WHOIS Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Raw Content / Value (Will be SHA-256 Hashed):</label>
                <textarea
                  rows={4}
                  placeholder="Paste artifact content, network packet string, or hash..."
                  value={newEvidenceValue}
                  onChange={(e) => setNewEvidenceValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Statutory Legal Authority:</label>
                <input
                  type="text"
                  value={newEvidenceAuth}
                  onChange={(e) => setNewEvidenceAuth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEvidenceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hash & Deposit in Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chain of Custody Detail Modal */}
      {selectedEvidenceForCustody && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Chain of Custody Audit Log
                </h3>
                <span className="text-xs text-slate-400">{selectedEvidenceForCustody.title}</span>
              </div>
              <button
                onClick={() => setSelectedEvidenceForCustody(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">SHA-256 Master Hash</span>
                <span className="text-emerald-400 font-bold break-all">{selectedEvidenceForCustody.sha256Hash}</span>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-slate-300 block">Custodial Action Timeline:</span>
                {selectedEvidenceForCustody.chainOfCustody.map((coc, idx) => (
                  <div key={coc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-white">Entry #{idx + 1}: {coc.officerName}</span>
                      <span className="font-mono text-[10px]">{coc.timestamp}</span>
                    </div>
                    <p className="text-slate-300">{coc.actionTaken}</p>
                    <div className="text-[10px] text-slate-500">
                      <strong>Location:</strong> {coc.storageLocation}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedEvidenceForCustody(null)}
                  className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl"
                >
                  Close Audit Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
