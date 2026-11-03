import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab, UserRole } from './components/Navbar.tsx';
import { CitizenReportWizard } from './components/CitizenReportWizard.tsx';
import { ThreatIntelSearch } from './components/ThreatIntelSearch.tsx';
import { AnalystWorkbench } from './components/AnalystWorkbench.tsx';
import { AdvisoriesSection } from './components/AdvisoriesSection.tsx';
import { ThreatAnalytics } from './components/ThreatAnalytics.tsx';
import { ResearchDataCenter } from './components/ResearchDataCenter.tsx';
import { AiMessageScannerModal } from './components/AiMessageScannerModal.tsx';
import { GoogleMapsThreatView } from './components/GoogleMapsThreatView.tsx';
import { GoogleWorkspaceHub } from './components/GoogleWorkspaceHub.tsx';
import { 
  IncidentReport, 
  ThreatIndicator, 
  SecurityAdvisory, 
  SchemaTable, 
  MethodologyPhase 
} from './types.ts';
import { 
  INITIAL_INCIDENTS, 
  INITIAL_INDICATORS, 
  INITIAL_ADVISORIES, 
  DATA_DICTIONARY_TABLES, 
  METHODOLOGY_LOG_PHASES 
} from './data/seedData.ts';
import { Shield, Phone, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('report');
  const [userRole, setUserRole] = useState<UserRole>('citizen');
  
  // App data state
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);
  const [indicators, setIndicators] = useState<ThreatIndicator[]>(INITIAL_INDICATORS);
  const [advisories, setAdvisories] = useState<SecurityAdvisory[]>(INITIAL_ADVISORIES);
  const [tables, setTables] = useState<SchemaTable[]>(DATA_DICTIONARY_TABLES);
  const [phases, setPhases] = useState<MethodologyPhase[]>(METHODOLOGY_LOG_PHASES);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialText, setScannerInitialText] = useState('');

  // Report pre-fill state from scanner
  const [reportPrefill, setReportPrefill] = useState<{ description: string; suspect: string } | undefined>(undefined);

  // Sync role changes to sensible tab views
  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    if (role === 'analyst' || role === 'lead') {
      setActiveTab('workbench');
    } else {
      setActiveTab('report');
    }
  };

  // Fetch initial data from server
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, iocRes, advRes, schemaRes, methRes] = await Promise.all([
          fetch('/api/incidents'),
          fetch('/api/threat-indicators'),
          fetch('/api/advisories'),
          fetch('/api/schema-definitions'),
          fetch('/api/methodology-log')
        ]);

        if (incRes.ok) {
          const incData = await incRes.json();
          if (Array.isArray(incData) && incData.length > 0) setIncidents(incData);
        }
        if (iocRes.ok) {
          const iocData = await iocRes.json();
          if (Array.isArray(iocData) && iocData.length > 0) setIndicators(iocData);
        }
        if (advRes.ok) {
          const advData = await advRes.json();
          if (Array.isArray(advData) && advData.length > 0) setAdvisories(advData);
        }
        if (schemaRes.ok) {
          const schemaData = await schemaRes.json();
          if (Array.isArray(schemaData) && schemaData.length > 0) setTables(schemaData);
        }
        if (methRes.ok) {
          const methData = await methRes.json();
          if (Array.isArray(methData) && methData.length > 0) setPhases(methData);
        }
      } catch (err) {
        console.warn('Initial data load: using fallback seed data', err);
      }
    };

    fetchData();
  }, []);

  const handleIncidentCreated = (newIncident: IncidentReport) => {
    setIncidents(prev => [newIncident, ...prev]);
  };

  const handleUpdateIncident = async (id: string, updates: Partial<IncidentReport> & { analystNote?: string }) => {
    // Optimistic local update
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id || inc.referenceNumber === id) {
        const updatedNotes = [...(inc.analystNotes || [])];
        if (updates.analystNote) {
          updatedNotes.push({
            author: updates.assignedAnalyst || 'UG-CERT Analyst',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            note: updates.analystNote
          });
        }
        return {
          ...inc,
          ...updates,
          analystNotes: updatedNotes,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return inc;
    }));

    try {
      await fetch(`/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.warn('Failed to persist incident update', err);
    }
  };

  const handleAddIndicator = async (iocData: Partial<ThreatIndicator>) => {
    try {
      const res = await fetch('/api/threat-indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(iocData)
      });
      if (res.ok) {
        const created = await res.json();
        setIndicators(prev => [created, ...prev]);
      }
    } catch (err) {
      console.warn('Failed to add indicator', err);
    }
  };

  const handleOpenScannerWithText = (text: string) => {
    setScannerInitialText(text);
    setIsScannerOpen(true);
  };

  const handleReportIncidentFromScanner = (initial: { description: string; suspect: string }) => {
    setReportPrefill(initial);
    setActiveTab('report');
  };

  const pendingTriageCount = incidents.filter(i => i.status === 'Submitted' || i.status === 'Under Review').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Authoritative Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={handleRoleChange}
        onOpenScanner={() => {
          setScannerInitialText('');
          setIsScannerOpen(true);
        }}
        pendingTriageCount={pendingTriageCount}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'report' && (
          <CitizenReportWizard
            onIncidentCreated={handleIncidentCreated}
            initialData={reportPrefill}
            onViewWorkbench={() => {
              setUserRole('analyst');
              setActiveTab('workbench');
            }}
          />
        )}

        {activeTab === 'indicators' && (
          <ThreatIntelSearch
            indicators={indicators}
            onAddIndicator={handleAddIndicator}
            onOpenScannerWithText={handleOpenScannerWithText}
          />
        )}

        {activeTab === 'workbench' && (
          <AnalystWorkbench
            incidents={incidents}
            onUpdateIncident={handleUpdateIncident}
            onPublishIOC={handleAddIndicator}
          />
        )}

        {activeTab === 'maps' && (
          <GoogleMapsThreatView
            incidents={incidents}
            onSelectIncident={(incident) => {
              setUserRole('analyst');
              setActiveTab('workbench');
            }}
          />
        )}

        {activeTab === 'workspace' && (
          <GoogleWorkspaceHub
            incidents={incidents}
            indicators={indicators}
            onScanEmailSnippet={(text, sender) => {
              setScannerInitialText(`[Email from: ${sender}]\n\n${text}`);
              setIsScannerOpen(true);
            }}
          />
        )}

        {activeTab === 'advisories' && (
          <AdvisoriesSection
            advisories={advisories}
            onOpenReportWithIndicator={(ioc) => {
              setReportPrefill({ description: `Observed malicious activity linked to: ${ioc}`, suspect: ioc });
              setActiveTab('report');
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <ThreatAnalytics
            incidents={incidents}
            indicators={indicators}
          />
        )}

        {activeTab === 'research' && (
          <ResearchDataCenter
            tables={tables}
            phases={phases}
            incidents={incidents}
            indicators={indicators}
          />
        )}
      </main>

      {/* Citizen AI Threat Scanner Modal */}
      <AiMessageScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onReportIncident={handleReportIncidentFromScanner}
      />

      {/* Authoritative National Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-blue-400/40 bg-slate-950 shadow-md shrink-0">
              <img 
                src="/assets/aistudio/ASSOCIATIOON_BUD_DON_E_8a09b5f8.jpg" 
                alt="CyberTrin Uganda VUCDSA Badge" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-sm">
                <span>CyberTrin Uganda • National Cybersecurity Operations</span>
              </div>
              <p className="text-slate-400 text-xs max-w-lg">
                Operated in coordination with the Uganda Police Force Cybercrime Division (CID), UG-CERT / NITA-U, and Bank of Uganda.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
            <a 
              href="tel:+256772590517"
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold bg-amber-950/50 px-3 py-1.5 rounded-xl border border-amber-800/80 transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Emergency 24/7 Hotline: +256 772590517</span>
            </a>
            <div className="text-slate-500">
              Compliant with <span className="text-slate-300">Data Protection Act 2019</span> & <span className="text-slate-300">Computer Misuse Act 2022</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
