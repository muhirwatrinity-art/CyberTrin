import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Server, MapPin, Globe, Layers, Compass, Shield } from 'lucide-react';

interface ForensicLeafletMapProps {
  height?: string;
}

export const ForensicLeafletMap: React.FC<ForensicLeafletMapProps> = ({
  height = '540px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'streets'>('dark');

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [0.355, 32.61],
      zoom: 11,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Default CartoDB Dark layer (100% free, zero card)
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    // Markers and Vectors Layer
    const group = L.layerGroup().addTo(map);

    // 1. Suspect IP Node: Liquid Telecom Tor Exit
    const torExitHtml = `
      <div style="transform: translate(-50%, -50%); cursor: pointer;">
        <span style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: rgba(244, 63, 94, 0.4); animation: ping 1.5s infinite; transform: translate(-25%, -25%);"></span>
        <div style="position: relative; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 10px; border: 2px solid #fda4af; background: linear-gradient(135deg, #e11d48, #9f1239); color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); font-family: ui-sans-serif, system-ui, sans-serif; white-space: nowrap;">
          <span style="font-size: 11px;">🖥️</span>
          <span style="font-size: 10px; font-weight: 800;">IP 102.134.42.19 (Tor Exit)</span>
        </div>
      </div>
    `;
    const torMarker = L.marker([0.3476, 32.5825], {
      icon: L.divIcon({ html: torExitHtml, className: 'tor-node-icon', iconSize: [0, 0] })
    }).addTo(group);
    torMarker.bindPopup(`
      <div style="font-family: ui-sans-serif, system-ui; padding: 4px; max-width: 260px; color: #0f172a;">
        <div style="font-size: 10px; font-weight: 800; color: #e11d48; text-transform: uppercase;">Suspect Infrastructure Server</div>
        <div style="font-size: 12px; font-weight: 700; margin-top: 2px;">Liquid Telecom Uganda Gateway</div>
        <div style="font-size: 11px; margin-top: 4px; color: #475569;">
          <div><strong>IP:</strong> 102.134.42.19 (ASN 36982)</div>
          <div><strong>Threat Type:</strong> Tor Exit Relay / Credential Stuffing Proxy</div>
          <div><strong>Coordinates:</strong> 0.3476° N, 32.5825° E</div>
        </div>
        <div style="margin-top: 6px; font-size: 9.5px; color: #94a3b8; font-style: italic;">
          Notice: Infrastructure location represents ISP data center, not physical suspect dwelling.
        </div>
      </div>
    `);

    // 2. Suspect IP Node: Raxio Data Centre Gateway
    const raxioHtml = `
      <div style="transform: translate(-50%, -50%); cursor: pointer;">
        <div style="position: relative; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 10px; border: 2px solid #fde68a; background: linear-gradient(135deg, #d97706, #92400e); color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); font-family: ui-sans-serif, system-ui, sans-serif; white-space: nowrap;">
          <span style="font-size: 11px;">🏢</span>
          <span style="font-size: 10px; font-weight: 800;">IP 197.239.8.5 (Raxio Gateway)</span>
        </div>
      </div>
    `;
    const raxioMarker = L.marker([0.3162, 32.5822], {
      icon: L.divIcon({ html: raxioHtml, className: 'raxio-node-icon', iconSize: [0, 0] })
    }).addTo(group);
    raxioMarker.bindPopup(`
      <div style="font-family: ui-sans-serif, system-ui; padding: 4px; max-width: 260px; color: #0f172a;">
        <div style="font-size: 10px; font-weight: 800; color: #d97706; text-transform: uppercase;">Suspect Hosting Facility</div>
        <div style="font-size: 12px; font-weight: 700; margin-top: 2px;">Raxio Tier-III Data Centre Gateway</div>
        <div style="font-size: 11px; margin-top: 4px; color: #475569;">
          <div><strong>IP:</strong> 197.239.8.5 (ASN 37075)</div>
          <div><strong>Role:</strong> Command & Control staging endpoint</div>
        </div>
      </div>
    `);

    // 3. Victim Node: Wakiso District
    const wakisoHtml = `
      <div style="transform: translate(-50%, -50%); cursor: pointer;">
        <div style="position: relative; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 10px; border: 2px solid #93c5fd; background: linear-gradient(135deg, #2563eb, #1e40af); color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); font-family: ui-sans-serif, system-ui, sans-serif; white-space: nowrap;">
          <span style="font-size: 11px;">📍</span>
          <span style="font-size: 10px; font-weight: 700;">Victim Device: Wakiso</span>
        </div>
      </div>
    `;
    const wakisoMarker = L.marker([0.4044, 32.4833], {
      icon: L.divIcon({ html: wakisoHtml, className: 'victim-wakiso-icon', iconSize: [0, 0] })
    }).addTo(group);
    wakisoMarker.bindPopup(`
      <div style="font-family: ui-sans-serif, system-ui; padding: 4px; max-width: 240px; color: #0f172a;">
        <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase;">Citizen Victim Incident</div>
        <div style="font-size: 12px; font-weight: 700; margin-top: 2px;">Wakiso District Resident</div>
        <div style="font-size: 11px; margin-top: 4px; color: #475569;">
          <div><strong>Platform:</strong> Mobile Money USSD Phishing</div>
          <div><strong>Estimated Loss:</strong> UGX 1,500,000</div>
        </div>
      </div>
    `);

    // 4. Victim Node: Mukono District
    const mukonoHtml = `
      <div style="transform: translate(-50%, -50%); cursor: pointer;">
        <div style="position: relative; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 10px; border: 2px solid #93c5fd; background: linear-gradient(135deg, #2563eb, #1e40af); color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); font-family: ui-sans-serif, system-ui, sans-serif; white-space: nowrap;">
          <span style="font-size: 11px;">📍</span>
          <span style="font-size: 10px; font-weight: 700;">Victim Device: Mukono</span>
        </div>
      </div>
    `;
    const mukonoMarker = L.marker([0.3544, 32.7553], {
      icon: L.divIcon({ html: mukonoHtml, className: 'victim-mukono-icon', iconSize: [0, 0] })
    }).addTo(group);
    mukonoMarker.bindPopup(`
      <div style="font-family: ui-sans-serif, system-ui; padding: 4px; max-width: 240px; color: #0f172a;">
        <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase;">Citizen Victim Incident</div>
        <div style="font-size: 12px; font-weight: 700; margin-top: 2px;">Mukono District SACCO</div>
        <div style="font-size: 11px; margin-top: 4px; color: #475569;">
          <div><strong>Platform:</strong> Online Banking BEC Invoice Fraud</div>
          <div><strong>Estimated Loss:</strong> UGX 8,500,000</div>
        </div>
      </div>
    `);

    // 5. Glowing Cybercrime Vector Trace Routes (Server -> Victims)
    const attackRoute1 = L.polyline(
      [
        [0.3476, 32.5825],
        [0.38, 32.53],
        [0.4044, 32.4833]
      ],
      {
        color: '#f43f5e',
        weight: 3,
        dashArray: '8, 6',
        opacity: 0.85
      }
    ).addTo(group);

    const attackRoute2 = L.polyline(
      [
        [0.3162, 32.5822],
        [0.33, 32.67],
        [0.3544, 32.7553]
      ],
      {
        color: '#f59e0b',
        weight: 3,
        dashArray: '8, 6',
        opacity: 0.85
      }
    ).addTo(group);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Style
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    mapRef.current.removeLayer(tileLayerRef.current);

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap contributors &copy; CARTO';

    if (mapStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, USGS';
    } else if (mapStyle === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19
    }).addTo(mapRef.current);

    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 shadow-2xl bg-slate-950" style={{ height }}>
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-2xl text-xs pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white">
            Forensic Attack Topology Grid (100% Free &amp; Cardless)
          </span>
          <span className="text-slate-500 hidden md:inline">•</span>
          <span className="text-emerald-300 text-[11px] font-semibold hidden md:inline">
            OpenStreetMap &amp; CartoDB Live Vectors
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              mapStyle === 'dark' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Dark
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              mapStyle === 'satellite' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" />
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              mapStyle === 'streets' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            Streets
          </button>
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.flyTo([0.355, 32.61], 11);
              }
            }}
            title="Reset to Kampala Incident Corridor"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* The Leaflet Canvas */}
      <div ref={containerRef} className="w-full h-full z-0 bg-[#030712]" />
    </div>
  );
};
