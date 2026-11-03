import React, { useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { IncidentReport, IncidentSeverity } from '../types.ts';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  MapPin, 
  ShieldAlert, 
  AlertTriangle, 
  Filter, 
  Maximize2, 
  Phone, 
  Building2, 
  Info 
} from 'lucide-react';

interface GoogleMapsThreatViewProps {
  incidents: IncidentReport[];
  onSelectIncident?: (incident: IncidentReport) => void;
}

const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Kampala: { lat: 0.3476, lng: 32.5825 },
  Wakiso: { lat: 0.4044, lng: 32.4833 },
  Mukono: { lat: 0.3544, lng: 32.7553 },
  Jinja: { lat: 0.4428, lng: 33.2032 },
  Gulu: { lat: 2.7724, lng: 32.2881 },
  Mbarara: { lat: -0.6072, lng: 30.6545 },
  Masaka: { lat: -0.3411, lng: 31.7361 },
  'Fort Portal': { lat: 0.6556, lng: 30.2747 },
  Mbale: { lat: 1.0784, lng: 34.1755 },
  Arua: { lat: 3.0303, lng: 30.9073 },
  Entebbe: { lat: 0.0512, lng: 32.4637 },
  Lira: { lat: 2.2472, lng: 32.9000 },
  Kabale: { lat: -1.2500, lng: 29.9833 },
  Tororo: { lat: 0.6928, lng: 34.1809 },
  Soroti: { lat: 1.7144, lng: 33.6111 }
};

export const GoogleMapsThreatView: React.FC<GoogleMapsThreatViewProps> = ({
  incidents,
  onSelectIncident
}) => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');

  // API Key handling: Prioritize VITE_GOOGLE_MAPS_API_KEY from secret store, fallback to firebaseConfig.apiKey
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || firebaseConfig.apiKey || '';

  const filteredIncidents = incidents.filter(inc => {
    const matchesSev = selectedSeverity === 'All' || inc.severity === selectedSeverity;
    const matchesDist = selectedDistrict === 'All' || inc.district === selectedDistrict;
    return matchesSev && matchesDist;
  });

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase tracking-wider">
              Google Maps Platform
            </span>
            <span className="text-xs text-slate-400">National Threat Geolocation & Hotspot Radar</span>
          </div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            Uganda Cybercrime Incident Map
          </h2>
        </div>

        {/* Map Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 font-medium">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 font-medium">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none"
            >
              <option value="All">All Districts</option>
              {Object.keys(DISTRICT_COORDINATES).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <span className="text-xs font-mono text-cyan-300 px-2 py-1 bg-cyan-950/60 rounded-lg border border-cyan-800">
            {filteredIncidents.length} Markers
          </span>
        </div>
      </div>

      {/* Map Container with explicit CSS height (CF2) */}
      <div className="relative w-full h-[540px] bg-slate-950">
        <APIProvider apiKey={apiKey} language="en" region="UG">
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: 1.3733, lng: 32.2903 }}
            defaultZoom={7}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            {/* Render AdvancedMarkers for incidents */}
            {filteredIncidents.map((incident, idx) => {
              const baseCoords = DISTRICT_COORDINATES[incident.district] || DISTRICT_COORDINATES.Kampala;
              // Add slight random deterministic jitter so overlapping district points scatter nicely
              const jitterLat = ((idx % 5) - 2) * 0.015;
              const jitterLng = (((idx * 3) % 5) - 2) * 0.015;
              const pos = {
                lat: baseCoords.lat + jitterLat,
                lng: baseCoords.lng + jitterLng
              };
              const pinColors = getPinColors(incident.severity);

              return (
                <AdvancedMarker
                  key={incident.id}
                  position={pos}
                  onClick={() => setSelectedIncident(incident)}
                  title={`${incident.referenceNumber}: ${incident.title}`}
                >
                  <Pin
                    background={pinColors.background}
                    glyphColor={pinColors.glyphColor}
                    borderColor={pinColors.borderColor}
                    scale={1.05}
                  />
                </AdvancedMarker>
              );
            })}

            {/* InfoWindow on Marker Click */}
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

                  <div className="text-[11px] text-slate-600 space-y-0.5 mb-2">
                    <div><strong>District:</strong> {selectedIncident.district} ({selectedIncident.region})</div>
                    <div><strong>Platform:</strong> {selectedIncident.affectedPlatform}</div>
                    <div><strong>Loss:</strong> UGX {selectedIncident.estimatedFinancialLossUGX.toLocaleString()}</div>
                  </div>

                  <p className="text-[11px] text-slate-700 line-clamp-2 italic mb-2">
                    &ldquo;{selectedIncident.description}&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                    <span className="text-slate-500">{selectedIncident.reportedAt}</span>
                    {onSelectIncident && (
                      <button
                        onClick={() => {
                          onSelectIncident(selectedIncident);
                          setSelectedIncident(null);
                        }}
                        className="px-2 py-1 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition"
                      >
                        Inspect Dossier
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Legend & Emergency Hotline Footer */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">Severity Legend:</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Critical</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Low</span>
        </div>

        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Phone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Regional Dispatch Desk: <strong className="text-amber-300">+256 772590517</strong></span>
        </div>
      </div>

    </div>
  );
};
