import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  IncidentReport, 
  IncidentSeverity, 
  LiveCyberWork, 
  AutomatedThreat 
} from '../types.ts';
import { DISTRICT_COORDINATES } from './GoogleMapsThreatView.tsx';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Globe, 
  Maximize2, 
  Radio, 
  Compass, 
  Phone,
  CheckCircle2,
  X
} from 'lucide-react';

export type MapStyleMode = 'dark' | 'satellite' | 'streets' | 'vector';

interface FreeUgandaMapProps {
  threats?: AutomatedThreat[];
  cyberWorks?: LiveCyberWork[];
  incidents?: IncidentReport[];
  selectedDistrict?: string;
  showDangerZones?: boolean;
  showCyberWorks?: boolean;
  showIncidents?: boolean;
  onSelectThreat?: (threat: AutomatedThreat) => void;
  onSelectWork?: (work: LiveCyberWork) => void;
  onSelectIncident?: (incident: IncidentReport) => void;
  onMitigateThreat?: (threatId: string) => void;
  onDeployWorkToThreat?: (threat: AutomatedThreat) => void;
  height?: string;
}

export const FreeUgandaMap: React.FC<FreeUgandaMapProps> = ({
  threats = [],
  cyberWorks = [],
  incidents = [],
  selectedDistrict = 'All',
  showDangerZones = true,
  showCyberWorks = true,
  showIncidents = true,
  onSelectThreat,
  onSelectWork,
  onSelectIncident,
  onMitigateThreat,
  onDeployWorkToThreat,
  height = '620px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<MapStyleMode>('dark');
  const [selectedThreatModal, setSelectedThreatModal] = useState<AutomatedThreat | null>(null);
  const [selectedWorkModal, setSelectedWorkModal] = useState<LiveCyberWork | null>(null);
  const [selectedIncidentModal, setSelectedIncidentModal] = useState<IncidentReport | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Uganda
    const map = L.map(mapContainerRef.current, {
      center: [1.3733, 32.2903],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Dark Tile Layer (Free, zero-card CartoDB)
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Style Switches (100% Free - No Card Required)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap &copy; CARTO';

    if (mapStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS';
    } else if (mapStyle === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Pan to Selected District when changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedDistrict && selectedDistrict !== 'All') {
      const coord = DISTRICT_COORDINATES[selectedDistrict];
      if (coord) {
        mapInstanceRef.current.flyTo([coord.lat, coord.lng], 10, {
          duration: 1.2
        });
      }
    } else {
      mapInstanceRef.current.flyTo([1.3733, 32.2903], 7, {
        duration: 1
      });
    }
  }, [selectedDistrict]);

  // Render HTML Markers for Threats, Cyber Works, and Incidents
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. DANGER WARNING SYMBOLS FOR AUTOMATED THREATS
    if (showDangerZones) {
      threats.forEach(threat => {
        if (selectedDistrict !== 'All' && threat.district !== selectedDistrict) return;

        const isMitigated = threat.isMitigated;

        // Custom pulsing HTML danger symbol marker
        const dangerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="transform: translate(-50%, -50%);">
            ${!isMitigated ? `
              <span style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: rgba(220, 38, 38, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background-color: rgba(239, 68, 68, 0.5); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
            ` : ''}
            <div style="position: relative; z-index: 10; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 10px; border: 2px solid ${isMitigated ? '#475569' : '#fef08a'}; background: ${isMitigated ? '#1e293b' : 'linear-gradient(135deg, #b91c1c, #991b1b)'}; color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); font-family: ui-sans-serif, system-ui, sans-serif;">
              <span style="font-size: 13px; font-weight: 900; color: ${isMitigated ? '#94a3b8' : '#fef08a'};">⚠️</span>
              <div style="display: flex; flex-direction: column; text-align: left; line-height: 1;">
                <span style="font-size: 9px; font-weight: 900; letter-spacing: 0.05em; color: ${isMitigated ? '#94a3b8' : '#fecaca'}; text-transform: uppercase;">
                  ${isMitigated ? 'CONTAINED' : 'DANGER ZONE'}
                </span>
                <span style="font-size: 10px; font-weight: 700; color: #ffffff;">
                  ${threat.district}
                </span>
              </div>
            </div>
          </div>
        `;

        const dangerIcon = L.divIcon({
          html: dangerHtml,
          className: 'cyber-danger-icon',
          iconSize: [0, 0]
        });

        const marker = L.marker([threat.lat, threat.lng], { icon: dangerIcon });
        marker.on('click', () => {
          setSelectedThreatModal(threat);
          setSelectedWorkModal(null);
          setSelectedIncidentModal(null);
          if (onSelectThreat) onSelectThreat(threat);
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }

    // 2. LIVE CYBER WORKS DEFENSE UNITS
    if (showCyberWorks) {
      cyberWorks.forEach(work => {
        if (selectedDistrict !== 'All' && work.district !== selectedDistrict) return;

        const workHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="transform: translate(-50%, -50%);">
            <span style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.25); animation: pulse 2.5s infinite;"></span>
            <div style="position: relative; z-index: 10; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 10px; border: 2px solid #6ee7b7; background: linear-gradient(135deg, #047857, #065f46); color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); font-family: ui-sans-serif, system-ui, sans-serif;">
              <span style="font-size: 12px;">🛡️</span>
              <div style="display: flex; flex-direction: column; text-align: left; line-height: 1;">
                <span style="font-size: 8.5px; font-weight: 900; letter-spacing: 0.05em; color: #a7f3d0; text-transform: uppercase;">
                  CYBER WORK
                </span>
                <span style="font-size: 10px; font-weight: 700; color: #ffffff;">
                  ${work.district}
                </span>
              </div>
              <span style="width: 6px; height: 6px; border-radius: 9999px; background-color: #34d399; animation: ping 1s infinite;"></span>
            </div>
          </div>
        `;

        const workIcon = L.divIcon({
          html: workHtml,
          className: 'cyber-work-icon',
          iconSize: [0, 0]
        });

        const marker = L.marker([work.lat, work.lng], { icon: workIcon });
        marker.on('click', () => {
          setSelectedWorkModal(work);
          setSelectedThreatModal(null);
          setSelectedIncidentModal(null);
          if (onSelectWork) onSelectWork(work);
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }

    // 3. CITIZEN INCIDENT REPORTS
    if (showIncidents) {
      incidents.forEach((inc, idx) => {
        if (selectedDistrict !== 'All' && inc.district !== selectedDistrict) return;

        const baseCoords = DISTRICT_COORDINATES[inc.district] || DISTRICT_COORDINATES.Kampala;
        const jitterLat = ((idx % 5) - 2) * 0.012;
        const jitterLng = (((idx * 3) % 5) - 2) * 0.012;
        const lat = baseCoords.lat + jitterLat;
        const lng = baseCoords.lng + jitterLng;

        const isCrit = inc.severity === 'Critical';
        const isHigh = inc.severity === 'High';
        const color = isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#3b82f6';

        const pinHtml = `
          <div style="transform: translate(-50%, -50%); cursor: pointer;">
            <div style="width: 16px; height: 16px; border-radius: 9999px; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;">
              <span style="width: 4px; height: 4px; border-radius: 9999px; background: #ffffff;"></span>
            </div>
          </div>
        `;

        const incidentIcon = L.divIcon({
          html: pinHtml,
          className: 'cyber-incident-pin',
          iconSize: [0, 0]
        });

        const marker = L.marker([lat, lng], { icon: incidentIcon });
        marker.on('click', () => {
          setSelectedIncidentModal(inc);
          setSelectedThreatModal(null);
          setSelectedWorkModal(null);
          if (onSelectIncident) onSelectIncident(inc);
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [threats, cyberWorks, incidents, selectedDistrict, showDangerZones, showCyberWorks, showIncidents]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 shadow-2xl bg-slate-950" style={{ height }}>
      
      {/* Top Floating Control Bar: Free Map Styles & Zero-Card Badge */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-2xl text-xs pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white">
            Uganda Cyber Map Engine (100% Free &amp; Cardless)
          </span>
          <span className="text-slate-500 hidden md:inline">•</span>
          <span className="text-emerald-300 text-[11px] font-semibold hidden md:inline">
            OpenStreetMap &amp; CartoDB Active • No API Key or Credit Card Required
          </span>
        </div>

        {/* Tile Layer Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              mapStyle === 'dark' 
                ? 'bg-emerald-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Tactical Dark</span>
          </button>

          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              mapStyle === 'satellite' 
                ? 'bg-emerald-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => setMapStyle('streets')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              mapStyle === 'streets' 
                ? 'bg-emerald-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Streets</span>
          </button>

          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([1.3733, 32.2903], 7);
              }
            }}
            title="Reset to Uganda Center"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* The Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#030712]" />

      {/* Floating Tactical Telemetry & Details Card */}
      {(selectedThreatModal || selectedWorkModal || selectedIncidentModal) && (
        <div className="absolute bottom-4 right-4 z-[1000] max-w-sm w-full bg-slate-900/95 border-2 border-slate-700 backdrop-blur-md rounded-2xl p-4 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              {selectedThreatModal ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                  <span>Automated Threat Alert</span>
                </>
              ) : selectedWorkModal ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Cyber Work Telemetry</span>
                </>
              ) : (
                <span>Citizen Incident Dossier</span>
              )}
            </span>
            <button
              onClick={() => {
                setSelectedThreatModal(null);
                setSelectedWorkModal(null);
                setSelectedIncidentModal(null);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Threat Modal Body */}
          {selectedThreatModal && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                  {selectedThreatModal.dangerLevel} ({selectedThreatModal.dangerScore}/100)
                </span>
                <span className="text-xs text-amber-300 font-bold">{selectedThreatModal.district} District</span>
              </div>
              <h4 className="text-xs font-bold text-white leading-snug">{selectedThreatModal.threatTitle}</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed italic bg-slate-950 p-2 rounded-lg border border-slate-800">
                &ldquo;{selectedThreatModal.dangerDescription}&rdquo;
              </p>
              <div className="text-[10px] text-slate-400 space-y-0.5">
                <div><strong>Detector:</strong> {selectedThreatModal.automatedSource}</div>
                <div><strong>Infrastructure:</strong> {selectedThreatModal.affectedInfrastructure}</div>
                {selectedThreatModal.suspectIdentifiers.length > 0 && (
                  <div className="font-mono text-[10px] text-red-300">
                    <strong>IOCs:</strong> {selectedThreatModal.suspectIdentifiers.join(', ')}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                {!selectedThreatModal.isMitigated ? (
                  <button
                    onClick={() => {
                      if (onDeployWorkToThreat) onDeployWorkToThreat(selectedThreatModal);
                      setSelectedThreatModal(null);
                    }}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Dispatch Cyber Work Unit</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Threat Contained
                  </span>
                )}
                {!selectedThreatModal.isMitigated && onMitigateThreat && (
                  <button
                    onClick={() => {
                      onMitigateThreat(selectedThreatModal.id);
                      setSelectedThreatModal(null);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold"
                  >
                    Mitigate
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cyber Work Modal Body */}
          {selectedWorkModal && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                  {selectedWorkModal.status}
                </span>
                <span className="text-xs text-emerald-300 font-bold">{selectedWorkModal.district} District</span>
              </div>
              <h4 className="text-xs font-bold text-white leading-snug">{selectedWorkModal.operationName}</h4>
              <div className="text-[11px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div><strong>Lead Agency:</strong> {selectedWorkModal.leadAgency}</div>
                <div><strong>Deployed Personnel:</strong> {selectedWorkModal.personnelCount} Specialist Officers</div>
                <div><strong>Telemetry:</strong> {selectedWorkModal.metrics}</div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{selectedWorkModal.description}</p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <a href="tel:+256772590517" className="text-amber-400 font-bold hover:underline flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Command Hotline: +256 772590517
                </a>
              </div>
            </div>
          )}

          {/* Citizen Incident Modal Body */}
          {selectedIncidentModal && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-blue-400">{selectedIncidentModal.referenceNumber}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  {selectedIncidentModal.severity}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white leading-snug">{selectedIncidentModal.title}</h4>
              <div className="text-[11px] text-slate-400">
                District: {selectedIncidentModal.district} • Platform: {selectedIncidentModal.affectedPlatform}
              </div>
              <p className="text-[11px] text-slate-300 italic line-clamp-3 bg-slate-950 p-2 rounded-lg border border-slate-800">
                &ldquo;{selectedIncidentModal.description}&rdquo;
              </p>
              {onSelectIncident && (
                <button
                  onClick={() => {
                    onSelectIncident(selectedIncidentModal);
                    setSelectedIncidentModal(null);
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
  );
};
