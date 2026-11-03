import React, { useState, useEffect, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { 
  IncidentReport, 
  IncidentSeverity, 
  LiveCyberWork, 
  AutomatedThreat,
  CyberWorkStatus 
} from '../types.ts';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  INITIAL_CYBER_WORKS, 
  INITIAL_AUTOMATED_THREATS 
} from '../data/seedData.ts';
import { 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Radio, 
  Zap, 
  Volume2, 
  VolumeX, 
  Phone, 
  Building2, 
  Activity, 
  Play, 
  Pause, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Users, 
  Wrench, 
  Cpu, 
  ExternalLink,
  Info,
  X,
  Compass,
  Crosshair,
  Settings,
  Globe
} from 'lucide-react';
import { UgandaFlag } from './UgandaFlag.tsx';
import { FreeUgandaMap } from './FreeUgandaMap.tsx';

interface GoogleMapsThreatViewProps {
  incidents: IncidentReport[];
  onSelectIncident?: (incident: IncidentReport) => void;
}

export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; region: 'Central' | 'Eastern' | 'Western' | 'Northern' }> = {
  Kampala: { lat: 0.3476, lng: 32.5825, region: 'Central' },
  Wakiso: { lat: 0.4044, lng: 32.4833, region: 'Central' },
  Mukono: { lat: 0.3544, lng: 32.7553, region: 'Central' },
  Jinja: { lat: 0.4428, lng: 33.2032, region: 'Eastern' },
  Gulu: { lat: 2.7724, lng: 32.2881, region: 'Northern' },
  Mbarara: { lat: -0.6072, lng: 30.6545, region: 'Western' },
  Masaka: { lat: -0.3411, lng: 31.7361, region: 'Central' },
  'Fort Portal': { lat: 0.6556, lng: 30.2747, region: 'Western' },
  Mbale: { lat: 1.0784, lng: 34.1755, region: 'Eastern' },
  Arua: { lat: 3.0303, lng: 30.9073, region: 'Northern' },
  Entebbe: { lat: 0.0512, lng: 32.4637, region: 'Central' },
  Lira: { lat: 2.2472, lng: 32.9000, region: 'Northern' },
  Kabale: { lat: -1.2500, lng: 29.9833, region: 'Western' },
  Tororo: { lat: 0.6928, lng: 34.1809, region: 'Eastern' },
  Soroti: { lat: 1.7144, lng: 33.6111, region: 'Eastern' }
};

export const GoogleMapsThreatView: React.FC<GoogleMapsThreatViewProps> = ({
  incidents,
  onSelectIncident
}) => {
  // Data States
  const [cyberWorks, setCyberWorks] = useState<LiveCyberWork[]>(INITIAL_CYBER_WORKS);
  const [automatedThreats, setAutomatedThreats] = useState<AutomatedThreat[]>(INITIAL_AUTOMATED_THREATS);
  
  // Selection States
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<AutomatedThreat | null>(null);
  const [selectedWork, setSelectedWork] = useState<LiveCyberWork | null>(null);
  
  // Filter & Layer Controls
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [showDangerZones, setShowDangerZones] = useState<boolean>(true);
  const [showCyberWorks, setShowCyberWorks] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);

  // Automated Surveillance & Alarm State
  const [isAutoDetectRunning, setIsAutoDetectRunning] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isScanningNow, setIsScanningNow] = useState<boolean>(false);
  const [activeDangerToast, setActiveDangerToast] = useState<AutomatedThreat | null>(null);
  const [newWorkModalOpen, setNewWorkModalOpen] = useState<boolean>(false);
  const [newWorkDistrict, setNewWorkDistrict] = useState<string>('Kampala');
  const [newWorkName, setNewWorkName] = useState<string>('');
  const [newWorkCategory, setNewWorkCategory] = useState<LiveCyberWork['workCategory']>('Packet Scrubbing');

  // Map Engine Mode: 'free' (OpenStreetMap/Leaflet - 100% Free & Cardless), 'radar' (Tactical Vector), or 'google'
  const [engineMode, setEngineMode] = useState<'free' | 'radar' | 'google'>(() => {
    return (localStorage.getItem('CYBERTRIN_MAP_ENGINE') as any) || 'free';
  });

  const handleSetEngineMode = (mode: 'free' | 'radar' | 'google') => {
    setEngineMode(mode);
    localStorage.setItem('CYBERTRIN_MAP_ENGINE', mode);
  };

  // Google Maps / Tactical Radar States
  const envMapsKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string)?.trim() || '';
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('CYBERTRIN_GMP_KEY') || '';
  });
  const [mapError, setMapError] = useState<boolean>(false);
  const [showKeyConfigModal, setShowKeyConfigModal] = useState<boolean>(false);
  const [tempKeyInput, setTempKeyInput] = useState<string>('');
  const [radarZoom, setRadarZoom] = useState<number>(1);

  // Do not fall back to firebaseConfig.apiKey as it lacks Maps JavaScript API activation
  const effectiveApiKey = customApiKey || envMapsKey;
  const isGoogleMapActive = Boolean(effectiveApiKey) && !mapError && engineMode === 'google';

  // Intercept global Google Maps auth failure to prevent unhandled console crash
  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps API authentication/activation failure (ApiNotActivatedMapError). Activating Uganda Tactical Radar.');
      setMapError(true);
      if (typeof prevAuthFailure === 'function') {
        try { prevAuthFailure(); } catch {}
      }
    };

    const handleWindowError = (e: ErrorEvent) => {
      if (e.message && (e.message.includes('ApiNotActivatedMapError') || e.message.includes('Google Maps JavaScript API error'))) {
        console.warn('Caught Google Maps JavaScript API error:', e.message);
        setMapError(true);
      }
    };
    window.addEventListener('error', handleWindowError);

    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  // Audio effect generator using Web Audio API
  const playDangerAlarm = () => {
    if (!isAudioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Pulse 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(587, now + 0.18);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Pulse 2 (urgent warble)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(987, now + 0.22);
      osc2.frequency.exponentialRampToValueAtTime(659, now + 0.42);
      gain2.gain.setValueAtTime(0.2, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.42);
    } catch {
      // Ignored if user hasn't interacted with audio yet
    }
  };

  // Fetch initial cyber works and automated threats from API
  useEffect(() => {
    const fetchOperationsData = async () => {
      try {
        const [worksRes, threatsRes] = await Promise.all([
          fetch('/api/cyber-works'),
          fetch('/api/automated-threats')
        ]);
        if (worksRes.ok) {
          const wData = await worksRes.json();
          if (Array.isArray(wData) && wData.length > 0) setCyberWorks(wData);
        }
        if (threatsRes.ok) {
          const tData = await threatsRes.json();
          if (Array.isArray(tData) && tData.length > 0) setAutomatedThreats(tData);
        }
      } catch (err) {
        console.warn('Initial threat radar load fallback:', err);
      }
    };

    fetchOperationsData();
  }, []);

  // Periodic Automated Threat Surveillance Loop
  useEffect(() => {
    if (!isAutoDetectRunning) return;

    // Run automated surveillance ping every 28 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/automated-threats/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        if (res.ok) {
          const detectedThreat: AutomatedThreat = await res.json();
          setAutomatedThreats(prev => [detectedThreat, ...prev]);
          setActiveDangerToast(detectedThreat);
          playDangerAlarm();
        }
      } catch (err) {
        console.warn('Surveillance cycle warning:', err);
      }
    }, 28000);

    return () => clearInterval(interval);
  }, [isAutoDetectRunning, isAudioEnabled]);

  // Manual Trigger: Instant Automated Threat Scan
  const handleTriggerAutomatedScan = async () => {
    setIsScanningNow(true);
    try {
      const res = await fetch('/api/automated-threats/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district: selectedDistrict !== 'All' ? selectedDistrict : undefined })
      });
      if (res.ok) {
        const newDetected: AutomatedThreat = await res.json();
        setAutomatedThreats(prev => [newDetected, ...prev]);
        setSelectedThreat(newDetected);
        setActiveDangerToast(newDetected);
        playDangerAlarm();
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanningNow(false);
    }
  };

  // Mitigate or dismiss an automated threat
  const handleMitigateThreat = async (threatId: string) => {
    try {
      await fetch(`/api/automated-threats/${threatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMitigated: true })
      });
      setAutomatedThreats(prev => prev.map(t => t.id === threatId ? { ...t, isMitigated: true } : t));
      if (selectedThreat?.id === threatId) {
        setSelectedThreat(prev => prev ? { ...prev, isMitigated: true } : null);
      }
      if (activeDangerToast?.id === threatId) {
        setActiveDangerToast(null);
      }
    } catch (err) {
      console.warn('Failed to mitigate threat:', err);
    }
  };

  // Deploy an emergency cyber work to a danger zone
  const handleDeployCyberWorkToThreat = async (threat: AutomatedThreat) => {
    const newWorkData: Partial<LiveCyberWork> = {
      operationName: `Operation Neutralize-${threat.district}: ${threat.threatTitle.substring(0, 30)}`,
      district: threat.district,
      lat: threat.lat + 0.005,
      lng: threat.lng + 0.005,
      status: 'Interception Underway',
      workCategory: threat.threatCategory === 'SIM Swap & Telecom Fraud' ? 'Telecom Fraud Sinkhole' : 'Packet Scrubbing',
      leadAgency: 'UG-CERT Emergency Incident Response Unit',
      personnelCount: 6,
      metrics: `Active countermeasure deployed; isolating ${threat.suspectIdentifiers.join(', ')}`,
      activeTools: ['Suricata IDS', 'Telecom SS7 Firewall', 'Zeek Sensor'],
      description: `Emergency response deployment dispatched in response to danger alert detected at ${threat.detectedAt}.`
    };

    try {
      const res = await fetch('/api/cyber-works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkData)
      });
      if (res.ok) {
        const created = await res.json();
        setCyberWorks(prev => [created, ...prev]);
        setSelectedWork(created);
        setSelectedThreat(null);
      }
    } catch (err) {
      console.warn('Failed to deploy work:', err);
    }
  };

  // Add custom cyber work from modal
  const handleCreateCustomWork = async (e: React.FormEvent) => {
    e.preventDefault();
    const geo = DISTRICT_COORDINATES[newWorkDistrict] || DISTRICT_COORDINATES.Kampala;
    const workPayload = {
      operationName: newWorkName || `Operation ${newWorkDistrict} Defense Grid`,
      district: newWorkDistrict,
      lat: geo.lat,
      lng: geo.lng,
      status: 'Active Defense',
      workCategory: newWorkCategory,
      leadAgency: 'UG-CERT / NITA-U Regional Station',
      personnelCount: 4,
      metrics: 'Active perimeter telemetry running',
      activeTools: ['Suricata IDS', 'Gemini Anomaly Correlator', 'Firewall Probe'],
      description: `Deployed cybersecurity operational unit guarding critical nodes in ${newWorkDistrict}.`
    };

    try {
      const res = await fetch('/api/cyber-works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workPayload)
      });
      if (res.ok) {
        const created = await res.json();
        setCyberWorks(prev => [created, ...prev]);
        setNewWorkModalOpen(false);
        setNewWorkName('');
      }
    } catch (err) {
      console.warn('Failed to deploy custom work:', err);
    }
  };

  // Filtering
  const filteredIncidents = incidents.filter(inc => {
    const matchesSev = selectedSeverity === 'All' || inc.severity === selectedSeverity;
    const matchesDist = selectedDistrict === 'All' || inc.district === selectedDistrict;
    return matchesSev && matchesDist;
  });

  const filteredThreats = automatedThreats.filter(t => {
    return selectedDistrict === 'All' || t.district === selectedDistrict;
  });

  const filteredWorks = cyberWorks.filter(w => {
    return selectedDistrict === 'All' || w.district === selectedDistrict;
  });

  const activeDangerCount = automatedThreats.filter(t => !t.isMitigated).length;
  const activeWorksCount = cyberWorks.filter(w => w.status === 'Active Defense' || w.status === 'Interception Underway').length;

  const apiKey = effectiveApiKey;

  const getPinColors = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'Critical':
        return { background: '#DC2626', glyphColor: '#FFFFFF', borderColor: '#7F1D1D' };
      case 'High':
        return { background: '#D97706', glyphColor: '#FFFFFF', borderColor: '#78350F' };
      case 'Medium':
        return { background: '#CA8A04', glyphColor: '#FFFFFF', borderColor: '#713F12' };
      default:
        return { background: '#2563EB', glyphColor: '#FFFFFF', borderColor: '#1E3A8A' };
    }
  };

  return (
    <div className="space-y-4">

      {/* Real-time Danger Alert Broadcast Banner */}
      {activeDangerToast && !activeDangerToast.alertDismissed && (
        <div className="bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 border-2 border-red-500 rounded-2xl p-4 shadow-2xl text-white relative animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-600/90 border border-red-300 flex items-center justify-center shrink-0 shadow-lg shadow-red-950">
              <AlertOctagon className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                  ⚠️ DANGER WARNING DETECTED
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {activeDangerToast.district} District ({activeDangerToast.region} Region)
                </span>
                <span className="text-[11px] text-slate-300 font-mono">
                  Score: {activeDangerToast.dangerScore}/100 • {activeDangerToast.detectedAt}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                {activeDangerToast.threatTitle}
              </h3>
              <p className="text-xs text-red-100 max-w-3xl mt-0.5">
                {activeDangerToast.dangerDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={() => {
                setSelectedThreat(activeDangerToast);
                setSelectedIncident(null);
                setSelectedWork(null);
              }}
              className="px-3 py-1.5 bg-white text-red-900 text-xs font-black rounded-xl hover:bg-red-100 transition shadow-md"
            >
              Inspect Danger Zone
            </button>
            <button
              onClick={() => handleDeployCyberWorkToThreat(activeDangerToast)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Deploy Defense Unit</span>
            </button>
            <button
              onClick={() => setActiveDangerToast(null)}
              className="p-1.5 text-red-300 hover:text-white transition"
              title="Dismiss Alert Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Map Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Radar Command Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Autonomous National Threat Radar
              </span>
              <span className="text-xs text-slate-400">
                Live Cyber Works & Instant Danger Warning Map
              </span>
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Uganda Live Cyber Works & Danger Hotspots
              </h2>
              <UgandaFlag className="w-6 h-4 shadow" />
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Active Danger Warning Count */}
            <div className="flex items-center gap-1.5 bg-red-950/80 px-3 py-1.5 rounded-xl border border-red-700/80 text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
              <span><strong>{activeDangerCount}</strong> Danger Zones</span>
            </div>

            {/* Live Cyber Works Taking Place */}
            <div className="flex items-center gap-1.5 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-700/80 text-emerald-200">
              <Wrench className="w-4 h-4 text-emerald-400 animate-spin" />
              <span><strong>{activeWorksCount}</strong> Live Cyber Works</span>
            </div>

            {/* Automated Surveillance State */}
            <button
              onClick={() => setIsAutoDetectRunning(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition ${
                isAutoDetectRunning 
                  ? 'bg-blue-950 text-blue-300 border-blue-700 hover:bg-blue-900' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Automated Continuous Threat Surveillance"
            >
              {isAutoDetectRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>Auto-Detect: {isAutoDetectRunning ? 'Active (28s)' : 'Paused'}</span>
            </button>

            {/* Instant Scan Trigger Button */}
            <button
              onClick={handleTriggerAutomatedScan}
              disabled={isScanningNow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-red-950/60 transition text-xs"
            >
              <Zap className={`w-3.5 h-3.5 ${isScanningNow ? 'animate-spin' : ''}`} />
              <span>{isScanningNow ? 'Scanning Districts...' : 'Trigger Threat Scan'}</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioEnabled(prev => !prev)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300"
              title={isAudioEnabled ? 'Audio Alarms Enabled' : 'Audio Alarms Muted'}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Layer Toggles & District Filtering Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Layer Checkboxes */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Layers:</span>

            <label className="flex items-center gap-1.5 cursor-pointer text-red-300 font-medium hover:text-red-200">
              <input
                type="checkbox"
                checked={showDangerZones}
                onChange={(e) => setShowDangerZones(e.target.checked)}
                className="rounded accent-red-600"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Danger Warning Symbols ({filteredThreats.length})
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300 font-medium hover:text-emerald-200">
              <input
                type="checkbox"
                checked={showCyberWorks}
                onChange={(e) => setShowCyberWorks(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Live Cyber Works ({filteredWorks.length})
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-blue-300 font-medium hover:text-blue-200">
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Incident Reports ({filteredIncidents.length})</span>
            </label>
          </div>

          {/* District & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-500">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="All">All Uganda</option>
                {Object.keys(DISTRICT_COORDINATES).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setNewWorkModalOpen(true)}
              className="px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy Cyber Work</span>
            </button>
          </div>
        </div>

        {/* Map Container: Multi-Engine (Cardless Interactive Map, Tactical Vector Radar, or Google Maps) */}
        <div className="relative w-full min-h-[600px] h-[640px] bg-slate-950 overflow-hidden">
          {/* Tactical Status Banner */}
          <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-2xl text-xs pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">
                {engineMode === 'free' ? 'Cardless Uganda Map (100% Free • OpenStreetMap & Satellite)' :
                 engineMode === 'radar' ? 'Uganda Tactical Vector Radar Active' :
                 'Google Maps API Layer Active'}
              </span>
              <span className="text-slate-400 hidden lg:inline">•</span>
              <span className="text-emerald-300 text-[11px] font-semibold hidden lg:inline">
                {engineMode === 'free' ? 'Zero billing, cardless real-world street & satellite mapping' :
                 engineMode === 'radar' ? 'Zero-latency offline tactical threat grid' :
                 'Requires GCP Maps JavaScript API'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Engine Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => handleSetEngineMode('free')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    engineMode === 'free'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3 h-3 text-emerald-300" />
                  <span>Free Cardless Map</span>
                </button>

                <button
                  onClick={() => handleSetEngineMode('radar')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    engineMode === 'radar'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3 h-3 text-emerald-300" />
                  <span>Tactical Radar</span>
                </button>

                <button
                  onClick={() => {
                    handleSetEngineMode('google');
                    if (!effectiveApiKey) setShowKeyConfigModal(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    engineMode === 'google'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Google Maps</span>
                </button>
              </div>

              <button
                onClick={() => setShowKeyConfigModal(true)}
                title="Map Settings"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>

          {/* ENGINE 1: 100% FREE CARDLESS MAP (Leaflet + OpenStreetMap + Esri Satellite) */}
          {engineMode === 'free' ? (
            <FreeUgandaMap
              threats={filteredThreats}
              cyberWorks={filteredWorks}
              incidents={filteredIncidents}
              selectedDistrict={selectedDistrict}
              showDangerZones={showDangerZones}
              showCyberWorks={showCyberWorks}
              showIncidents={showIncidents}
              onSelectThreat={(t) => {
                setSelectedThreat(t);
                setSelectedWork(null);
                setSelectedIncident(null);
              }}
              onSelectWork={(w) => {
                setSelectedWork(w);
                setSelectedThreat(null);
                setSelectedIncident(null);
              }}
              onSelectIncident={(i) => {
                setSelectedIncident(i);
                setSelectedThreat(null);
                setSelectedWork(null);
              }}
              onMitigateThreat={handleMitigateThreat}
              onDeployWorkToThreat={handleDeployCyberWorkToThreat}
              height="640px"
            />
          ) : engineMode === 'google' && isGoogleMapActive ? (
            <APIProvider 
              apiKey={apiKey} 
              language="en" 
              region="UG"
              onError={() => {
                console.warn('Google Maps APIProvider reported an error. Switching to Tactical Radar.');
                setMapError(true);
              }}
            >
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={{ lat: 1.3733, lng: 32.2903 }}
                defaultZoom={7}
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: '100%', height: '100%' }}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              >
                
                {/* 1. DANGER WARNING SYMBOLS FOR AUTOMATED THREATS */}
                {showDangerZones && filteredThreats.map((threat) => {
                  const isMitigated = threat.isMitigated;

                  return (
                    <AdvancedMarker
                      key={threat.id}
                      position={{ lat: threat.lat, lng: threat.lng }}
                      onClick={() => {
                        setSelectedThreat(threat);
                        setSelectedIncident(null);
                        setSelectedWork(null);
                      }}
                      title={`⚠️ DANGER WARNING in ${threat.district}: ${threat.threatTitle}`}
                    >
                      <div className="relative flex items-center justify-center cursor-pointer group">
                        {!isMitigated && (
                          <>
                            <span className="absolute w-14 h-14 rounded-full bg-red-600/30 animate-ping pointer-events-none" />
                            <span className="absolute w-10 h-10 rounded-full bg-red-500/40 animate-pulse pointer-events-none" />
                          </>
                        )}

                        <div className={`relative z-10 px-2 py-1 rounded-xl shadow-2xl flex items-center gap-1.5 border-2 transition-transform group-hover:scale-110 ${
                          isMitigated 
                            ? 'bg-slate-900 border-slate-600 text-slate-300' 
                            : 'bg-gradient-to-r from-red-600 via-rose-700 to-amber-600 border-red-200 text-white shadow-red-950/90'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 ${isMitigated ? 'text-slate-400' : 'text-amber-300 fill-amber-300 animate-bounce'}`} />
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] font-black tracking-wider uppercase leading-none">
                              {isMitigated ? 'CONTAINED' : 'DANGER ZONE'}
                            </span>
                            <span className="text-[10px] font-bold leading-tight">
                              {threat.district}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* 2. LIVE CYBER WORKS TAKING PLACE */}
                {showCyberWorks && filteredWorks.map((work) => {
                  return (
                    <AdvancedMarker
                      key={work.id}
                      position={{ lat: work.lat, lng: work.lng }}
                      onClick={() => {
                        setSelectedWork(work);
                        setSelectedThreat(null);
                        setSelectedIncident(null);
                      }}
                      title={`Active Cyber Work: ${work.operationName}`}
                    >
                      <div className="relative flex items-center justify-center cursor-pointer group">
                        <span className="absolute w-12 h-12 rounded-full bg-emerald-500/25 animate-pulse pointer-events-none" />
                        
                        <div className="relative z-10 px-2.5 py-1 rounded-xl shadow-xl bg-gradient-to-r from-emerald-700 to-teal-800 border-2 border-emerald-300 text-white flex items-center gap-1.5 transition-transform group-hover:scale-110">
                          <ShieldCheck className="w-4 h-4 text-emerald-200" />
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-200 leading-none">
                              CYBER WORK
                            </span>
                            <span className="text-[10px] font-bold leading-tight truncate max-w-[110px]">
                              {work.district}
                            </span>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* 3. CITIZEN INCIDENT REPORTS */}
                {showIncidents && filteredIncidents.map((incident, idx) => {
                  const baseCoords = DISTRICT_COORDINATES[incident.district] || DISTRICT_COORDINATES.Kampala;
                  const jitterLat = ((idx % 5) - 2) * 0.012;
                  const jitterLng = (((idx * 3) % 5) - 2) * 0.012;
                  const pos = {
                    lat: baseCoords.lat + jitterLat,
                    lng: baseCoords.lng + jitterLng
                  };
                  const pinColors = getPinColors(incident.severity);

                  return (
                    <AdvancedMarker
                      key={incident.id}
                      position={pos}
                      onClick={() => {
                        setSelectedIncident(incident);
                        setSelectedThreat(null);
                        setSelectedWork(null);
                      }}
                      title={`${incident.referenceNumber}: ${incident.title}`}
                    >
                      <Pin
                        background={pinColors.background}
                        glyphColor={pinColors.glyphColor}
                        borderColor={pinColors.borderColor}
                        scale={0.9}
                      />
                    </AdvancedMarker>
                  );
                })}

                {/* INFO WINDOWS */}
                {selectedThreat && (
                  <InfoWindow
                    position={{ lat: selectedThreat.lat + 0.008, lng: selectedThreat.lng }}
                    onCloseClick={() => setSelectedThreat(null)}
                  >
                    <div className="p-2.5 max-w-sm text-slate-900 font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-red-200 pb-1.5 mb-2">
                        <span className="flex items-center gap-1 text-xs font-black text-red-700 uppercase tracking-wide">
                          <AlertTriangle className="w-4 h-4 text-red-600 fill-red-600 animate-bounce" />
                          {selectedThreat.dangerLevel}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                          Danger Score: {selectedThreat.dangerScore}/100
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-950 mb-1 leading-snug">
                        {selectedThreat.threatTitle}
                      </h4>
                      <div className="text-[11px] text-slate-700 space-y-1 mb-2 bg-red-50 p-2 rounded-lg border border-red-100">
                        <div><strong>Location:</strong> {selectedThreat.district} District ({selectedThreat.region})</div>
                        <div><strong>Detector:</strong> {selectedThreat.automatedSource}</div>
                        <div><strong>Infrastructure:</strong> {selectedThreat.affectedInfrastructure}</div>
                      </div>
                      <p className="text-[11px] text-slate-800 mb-2 leading-relaxed italic">
                        &ldquo;{selectedThreat.dangerDescription}&rdquo;
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                        {!selectedThreat.isMitigated ? (
                          <button
                            onClick={() => handleDeployCyberWorkToThreat(selectedThreat)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-sm transition"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Dispatch Cyber Work Unit</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Threat Contained</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </InfoWindow>
                )}

                {selectedWork && (
                  <InfoWindow
                    position={{ lat: selectedWork.lat + 0.008, lng: selectedWork.lng }}
                    onCloseClick={() => setSelectedWork(null)}
                  >
                    <div className="p-2.5 max-w-sm text-slate-900 font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-1.5 mb-2">
                        <span className="flex items-center gap-1 text-xs font-black text-emerald-800 uppercase tracking-wide">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          {selectedWork.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {selectedWork.workCategory}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-950 mb-1 leading-snug">
                        {selectedWork.operationName}
                      </h4>
                      <div className="text-[11px] text-slate-700 space-y-1 mb-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <div><strong>District:</strong> {selectedWork.district}</div>
                        <div><strong>Lead Agency:</strong> {selectedWork.leadAgency}</div>
                        <div><strong>Deployed Personnel:</strong> {selectedWork.personnelCount} Specialist Officers</div>
                        <div><strong>Live Telemetry:</strong> <span className="font-semibold text-emerald-800">{selectedWork.metrics}</span></div>
                      </div>
                    </div>
                  </InfoWindow>
                )}

                {selectedIncident && (
                  <InfoWindow
                    position={(() => {
                      const base = DISTRICT_COORDINATES[selectedIncident.district] || DISTRICT_COORDINATES.Kampala;
                      return { lat: base.lat + 0.01, lng: base.lng };
                    })()}
                    onCloseClick={() => setSelectedIncident(null)}
                  >
                    <div className="p-2 max-w-xs text-slate-900 font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1 mb-1.5">
                        <span className="font-mono text-xs font-bold text-blue-700">
                          {selectedIncident.referenceNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedIncident.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          selectedIncident.severity === 'High' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedIncident.severity}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mb-1 leading-tight">
                        {selectedIncident.title}
                      </h4>
                      <p className="text-[11px] text-slate-700 line-clamp-2 italic mb-2">
                        &ldquo;{selectedIncident.description}&rdquo;
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* ENGINE 2: TACTICAL VECTOR RADAR (Zero-latency offline defense grid) */
            <div className="relative w-full h-full bg-[#030712] overflow-hidden flex flex-col justify-between">
              {/* Radar Coordinate Grid Canvas */}
              <div className="relative flex-1 w-full h-full overflow-hidden">
                <svg
                  viewBox="0 0 1000 640"
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <radialGradient id="radarSweepGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
                      <stop offset="70%" stopColor="#059669" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="gridLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.3" />
                    </linearGradient>
                    <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.7" strokeOpacity="0.4" />
                    </pattern>
                  </defs>

                  {/* Tactical Grid Background */}
                  <rect width="1000" height="640" fill="url(#tacticalGrid)" />

                  {/* Range Rings Centered around Kampala (x: 580, y: 380) */}
                  <circle cx="580" cy="380" r="80" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                  <circle cx="580" cy="380" r="160" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                  <circle cx="580" cy="380" r="260" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="6 6" opacity="0.2" />
                  <circle cx="580" cy="380" r="380" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="8 8" opacity="0.15" />

                  {/* Tactical Crosshair Axis */}
                  <line x1="0" y1="380" x2="1000" y2="380" stroke="#059669" strokeWidth="0.8" opacity="0.25" strokeDasharray="4 4" />
                  <line x1="580" y1="0" x2="580" y2="640" stroke="#059669" strokeWidth="0.8" opacity="0.25" strokeDasharray="4 4" />

                  {/* Rotating Sweeper Beam Line */}
                  <g className="origin-[580px_380px] animate-[spin_8s_linear_infinite] pointer-events-none">
                    <line x1="580" y1="380" x2="980" y2="380" stroke="#10b981" strokeWidth="2" opacity="0.7" />
                    <polygon points="580,380 980,330 980,380" fill="url(#radarSweepGradient)" />
                  </g>

                  {/* Lake Victoria Contour Polygon in South-East */}
                  <path
                    d="M 540 430 Q 600 420 680 430 Q 760 460 780 540 Q 730 620 620 610 Q 550 560 540 430 Z"
                    fill="#1e3a8a"
                    fillOpacity="0.25"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeOpacity="0.5"
                    strokeDasharray="4 2"
                  />
                  <text x="640" y="520" fill="#60a5fa" fontSize="11" fontWeight="bold" opacity="0.6">
                    LAKE VICTORIA (UGANDA SECTOR)
                  </text>

                  {/* Uganda Regional Sectors Outline */}
                  <path
                    d="M 280 120 L 520 80 L 800 130 L 840 380 L 780 560 L 520 600 L 260 560 L 220 340 Z"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    opacity="0.5"
                  />

                  {/* Regional Boundary Labels */}
                  <text x="460" y="110" fill="#94a3b8" fontSize="12" fontWeight="bold" letterSpacing="2" opacity="0.6">NORTHERN SECTOR (ACHOLI / LANGO)</text>
                  <text x="730" y="280" fill="#94a3b8" fontSize="12" fontWeight="bold" letterSpacing="2" opacity="0.6">EASTERN SECTOR</text>
                  <text x="210" y="380" fill="#94a3b8" fontSize="12" fontWeight="bold" letterSpacing="2" opacity="0.6">WESTERN SECTOR</text>
                  <text x="490" y="340" fill="#94a3b8" fontSize="12" fontWeight="bold" letterSpacing="2" opacity="0.7">CENTRAL SECTOR (GREATER KAMPALA)</text>

                  {/* District Centroids & Labels */}
                  {Object.entries(DISTRICT_COORDINATES).map(([name, data]) => {
                    // Geographic coordinate to SVG (Lat: -1.5 to 3.5, Lng: 29.5 to 34.8)
                    const x = ((data.lng - 29.5) / 5.3) * 780 + 120;
                    const y = ((3.6 - data.lat) / 5.1) * 500 + 70;
                    const isSelected = selectedDistrict === name;

                    return (
                      <g key={name} className="cursor-pointer group" onClick={() => setSelectedDistrict(name)}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 6 : 3.5}
                          fill={isSelected ? '#38bdf8' : '#64748b'}
                          opacity={isSelected ? 0.9 : 0.5}
                        />
                        <text
                          x={x + 7}
                          y={y + 3}
                          fill={isSelected ? '#38bdf8' : '#94a3b8'}
                          fontSize={isSelected ? '12' : '10'}
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          className="transition-colors group-hover:fill-white"
                        >
                          {name}
                        </text>
                      </g>
                    );
                  })}

                  {/* LAYER 3: CITIZEN INCIDENT REPORTS (If enabled) */}
                  {showIncidents && filteredIncidents.map((inc, idx) => {
                    const coords = DISTRICT_COORDINATES[inc.district] || DISTRICT_COORDINATES.Kampala;
                    const jitterX = ((idx % 5) - 2) * 16;
                    const jitterY = (((idx * 2) % 5) - 2) * 14;
                    const x = ((coords.lng - 29.5) / 5.3) * 780 + 120 + jitterX;
                    const y = ((3.6 - coords.lat) / 5.1) * 500 + 70 + jitterY;
                    const isCrit = inc.severity === 'Critical';

                    return (
                      <g
                        key={inc.id}
                        className="cursor-pointer transition-transform hover:scale-125"
                        onClick={() => {
                          setSelectedIncident(inc);
                          setSelectedThreat(null);
                          setSelectedWork(null);
                        }}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isCrit ? 7 : 5}
                          fill={isCrit ? '#ef4444' : inc.severity === 'High' ? '#f59e0b' : '#3b82f6'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}

                  {/* LAYER 2: LIVE CYBER WORKS DEFENSE UNITS (If enabled) */}
                  {showCyberWorks && filteredWorks.map((work) => {
                    const x = ((work.lng - 29.5) / 5.3) * 780 + 120;
                    const y = ((3.6 - work.lat) / 5.1) * 500 + 70;

                    return (
                      <g
                        key={work.id}
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedWork(work);
                          setSelectedThreat(null);
                          setSelectedIncident(null);
                        }}
                      >
                        {/* Defense Shield Aura */}
                        <circle cx={x} cy={y} r="26" fill="#10b981" fillOpacity="0.15" className="animate-pulse" />
                        <circle cx={x} cy={y} r="16" fill="#047857" stroke="#34d399" strokeWidth="2" />
                        
                        {/* Status Label */}
                        <rect
                          x={x - 45}
                          y={y + 18}
                          width="90"
                          height="18"
                          rx="9"
                          fill="#064e3b"
                          stroke="#10b981"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={y + 30}
                          textAnchor="middle"
                          fill="#a7f3d0"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          🛡️ {work.district}
                        </text>
                      </g>
                    );
                  })}

                  {/* LAYER 1: DANGER WARNING SYMBOLS FOR AUTOMATED THREATS (If enabled) */}
                  {showDangerZones && filteredThreats.map((threat) => {
                    const x = ((threat.lng - 29.5) / 5.3) * 780 + 120;
                    const y = ((3.6 - threat.lat) / 5.1) * 500 + 70;
                    const isMitigated = threat.isMitigated;

                    return (
                      <g
                        key={threat.id}
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedThreat(threat);
                          setSelectedIncident(null);
                          setSelectedWork(null);
                        }}
                      >
                        {/* Radiating Shockwave Warning Rings */}
                        {!isMitigated && (
                          <>
                            <circle cx={x} cy={y} r="34" fill="#dc2626" fillOpacity="0.25" className="animate-ping origin-center" />
                            <circle cx={x} cy={y} r="22" fill="#ef4444" fillOpacity="0.35" className="animate-pulse origin-center" />
                          </>
                        )}

                        {/* Danger Warning Triangle Badge */}
                        <g transform={`translate(${x - 16}, ${y - 16})`}>
                          <polygon
                            points="16,2 30,28 2,28"
                            fill={isMitigated ? '#475569' : '#dc2626'}
                            stroke={isMitigated ? '#94a3b8' : '#fef08a'}
                            strokeWidth="2.5"
                            className="transition-transform group-hover:scale-110"
                          />
                          <text
                            x="16"
                            y="25"
                            textAnchor="middle"
                            fill={isMitigated ? '#ffffff' : '#fef08a'}
                            fontSize="13"
                            fontWeight="900"
                          >
                            !
                          </text>
                        </g>

                        {/* Danger Pill Badge */}
                        <rect
                          x={x - 52}
                          y={y + 16}
                          width="104"
                          height="20"
                          rx="6"
                          fill={isMitigated ? '#1e293b' : '#7f1d1d'}
                          stroke={isMitigated ? '#64748b' : '#ef4444'}
                          strokeWidth="1.2"
                        />
                        <text
                          x={x}
                          y={y + 30}
                          textAnchor="middle"
                          fill={isMitigated ? '#cbd5e1' : '#fecaca'}
                          fontSize="9.5"
                          fontWeight="bold"
                        >
                          ⚠️ {isMitigated ? 'MITIGATED' : 'DANGER'}: {threat.district}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Tactical Inspector Overlay Box (When a pin is selected on vector radar) */}
                {(selectedThreat || selectedWork || selectedIncident) && (
                  <div className="absolute bottom-4 right-4 z-30 max-w-sm w-full bg-slate-900/95 border-2 border-slate-700 backdrop-blur-md rounded-2xl p-4 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        {selectedThreat ? '⚠️ Automated Threat Telemetry' : selectedWork ? '🛡️ Live Cyber Work Telemetry' : '📋 Incident Dossier'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedThreat(null);
                          setSelectedWork(null);
                          setSelectedIncident(null);
                        }}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedThreat && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                            {selectedThreat.dangerLevel} ({selectedThreat.dangerScore}/100)
                          </span>
                          <span className="text-xs text-amber-300 font-bold">{selectedThreat.district} District</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug">{selectedThreat.threatTitle}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic bg-slate-950 p-2 rounded-lg border border-slate-800">
                          &ldquo;{selectedThreat.dangerDescription}&rdquo;
                        </p>
                        <div className="text-[10px] text-slate-400 space-y-0.5">
                          <div><strong>Detector:</strong> {selectedThreat.automatedSource}</div>
                          <div><strong>Infrastructure:</strong> {selectedThreat.affectedInfrastructure}</div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                          {!selectedThreat.isMitigated ? (
                            <button
                              onClick={() => handleDeployCyberWorkToThreat(selectedThreat)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Dispatch Defense Unit</span>
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Threat Mitigated
                            </span>
                          )}
                          {!selectedThreat.isMitigated && (
                            <button
                              onClick={() => handleMitigateThreat(selectedThreat.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold"
                            >
                              Mitigate
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedWork && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                            {selectedWork.status}
                          </span>
                          <span className="text-xs text-emerald-300 font-bold">{selectedWork.district} District</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug">{selectedWork.operationName}</h4>
                        <div className="text-[11px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <div><strong>Lead Agency:</strong> {selectedWork.leadAgency}</div>
                          <div><strong>Personnel:</strong> {selectedWork.personnelCount} Specialist Officers</div>
                          <div><strong>Telemetry:</strong> {selectedWork.metrics}</div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{selectedWork.description}</p>
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          <a href="tel:+256772590517" className="text-amber-400 font-bold hover:underline flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> Command Hotline
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedIncident && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400">{selectedIncident.referenceNumber}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                            {selectedIncident.severity}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug">{selectedIncident.title}</h4>
                        <div className="text-[11px] text-slate-400">
                          District: {selectedIncident.district} • Platform: {selectedIncident.affectedPlatform}
                        </div>
                        <p className="text-[11px] text-slate-300 italic line-clamp-3 bg-slate-950 p-2 rounded-lg border border-slate-800">
                          &ldquo;{selectedIncident.description}&rdquo;
                        </p>
                        {onSelectIncident && (
                          <button
                            onClick={() => {
                              onSelectIncident(selectedIncident);
                              setSelectedIncident(null);
                            }}
                            className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
                          >
                            Inspect Full Dossier
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Live Cyber Works & Danger Warnings Telemetry Strip */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Map Legend:</span>
            <span className="flex items-center gap-1.5 text-red-400 font-bold">
              <span className="w-3 h-3 rounded-md bg-red-600 animate-pulse border border-red-300" />
              ⚠️ Danger Warning Symbol (Threat Detected)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-3 h-3 rounded-md bg-emerald-600 border border-emerald-300" />
              🛡️ Live Cyber Work (Active Defense)
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Citizen Incident Pin
            </span>
          </div>

          {/* Emergency Regional Dispatch Hotline */}
          <div className="flex items-center gap-2 text-xs">
            <a 
              href="tel:+256772590517"
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-800/80 transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Regional Dispatch Desk: +256 772590517</span>
            </a>
          </div>

        </div>

      </div>

      {/* Real-Time Live Cyber Works & Operations Radar Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Column: Live Cyber Works Taking Place */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800">
                <Wrench className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Live Cyber Works in Progress ({cyberWorks.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Active defensive deployments, packet scrubbing & forensic interdictions
                </p>
              </div>
            </div>

            <button
              onClick={() => setNewWorkModalOpen(true)}
              className="text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
            >
              + Deploy Unit
            </button>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {cyberWorks.map(work => (
              <div 
                key={work.id}
                onClick={() => {
                  setSelectedWork(work);
                  setSelectedThreat(null);
                }}
                className="p-3 bg-slate-950/80 border border-slate-800 hover:border-emerald-600/60 rounded-xl transition cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                      {work.operationName}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {work.district}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-2 line-clamp-1">
                  {work.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-emerald-400 font-semibold">{work.metrics}</span>
                  <span>{work.personnelCount} Officers • {work.lastUpdate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Automated Threat Detection Feed & Danger Warnings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-950 text-red-400 rounded-xl border border-red-800">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Automated Threat Radar Feed ({automatedThreats.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Autonomous sensor interceptions & real-time danger warnings
                </p>
              </div>
            </div>

            <button
              onClick={handleTriggerAutomatedScan}
              disabled={isScanningNow}
              className="text-xs px-2.5 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg transition flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>{isScanningNow ? 'Scanning...' : 'Run Scan'}</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {automatedThreats.map(threat => (
              <div 
                key={threat.id}
                onClick={() => {
                  setSelectedThreat(threat);
                  setSelectedWork(null);
                }}
                className={`p-3 rounded-xl border transition cursor-pointer group ${
                  threat.isMitigated 
                    ? 'bg-slate-950/60 border-slate-800 opacity-70' 
                    : 'bg-red-950/30 border-red-800/80 hover:border-red-500'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${threat.isMitigated ? 'bg-slate-500' : 'bg-red-500 animate-ping'}`} />
                    <span className="text-xs font-bold text-white group-hover:text-red-300 transition">
                      {threat.threatTitle}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    threat.isMitigated 
                      ? 'bg-slate-800 text-slate-400' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {threat.isMitigated ? 'Mitigated' : threat.dangerLevel}
                  </span>
                </div>

                <p className="text-xs text-red-200/90 mb-2 line-clamp-1">
                  {threat.dangerDescription}
                </p>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    <strong>{threat.district}</strong> • Score: {threat.dangerScore}/100
                  </span>
                  <span className="text-slate-500">{threat.detectedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Deploy Custom Cyber Work Modal */}
      {newWorkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Deploy Emergency Cyber Defense Unit
              </h3>
              <button
                onClick={() => setNewWorkModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomWork} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Uganda District:</label>
                <select
                  value={newWorkDistrict}
                  onChange={(e) => setNewWorkDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {Object.keys(DISTRICT_COORDINATES).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Operation Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Operation Nile-Shield: USSD Rate Limiter"
                  value={newWorkName}
                  onChange={(e) => setNewWorkName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Defense Category:</label>
                <select
                  value={newWorkCategory}
                  onChange={(e) => setNewWorkCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Packet Scrubbing">Packet Scrubbing</option>
                  <option value="Telecom Fraud Sinkhole">Telecom Fraud Sinkhole</option>
                  <option value="GovNet Honeypot">GovNet Honeypot</option>
                  <option value="Digital Forensics Unit">Digital Forensics Unit</option>
                  <option value="Critical Infrastructure Shield">Critical Infrastructure Shield</option>
                </select>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-400 space-y-1">
                <div><strong>Lead Authority:</strong> UG-CERT / NITA-U Rapid Operational Desk</div>
                <div><strong>Emergency Hotline Dispatch:</strong> +256 772590517</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewWorkModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dispatch Cyber Unit to Map</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Maps API Key Configuration Modal */}
      {showKeyConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                Google Maps Key & Activation Configuration
              </h3>
              <button
                onClick={() => setShowKeyConfigModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-300 leading-relaxed">
              <p>
                To enable Google Maps satellite and hybrid layers without errors, the key must belong to a Google Cloud project with the 
                <strong className="text-white"> Maps JavaScript API</strong> activated.
              </p>
              <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  Why did "ApiNotActivatedMapError" occur?
                </div>
                <div className="text-[11px]">
                  The default project key only has standard web services active. The Maps JavaScript API has not yet been enabled on that GCP project. When unactivated, CyberTrin Uganda seamlessly uses the high-resolution Uganda Cyber Tactical Radar.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Custom Google Maps API Key:
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={tempKeyInput || customApiKey}
                onChange={(e) => setTempKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Saved in browser secure storage for this session.
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('CYBERTRIN_GMP_KEY');
                  setCustomApiKey('');
                  setTempKeyInput('');
                  setMapError(false);
                  setShowKeyConfigModal(false);
                }}
                className="px-3 py-1.5 text-rose-400 hover:text-rose-300 font-semibold"
              >
                Use Tactical Radar Mode
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyConfigModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const keyToSave = tempKeyInput.trim();
                    if (keyToSave) {
                      localStorage.setItem('CYBERTRIN_GMP_KEY', keyToSave);
                      setCustomApiKey(keyToSave);
                    }
                    setMapError(false);
                    setShowKeyConfigModal(false);
                  }}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow"
                >
                  Save & Apply Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
