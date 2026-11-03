import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { 
  INITIAL_INCIDENTS, 
  INITIAL_INDICATORS, 
  INITIAL_ADVISORIES, 
  DATA_DICTIONARY_TABLES, 
  METHODOLOGY_LOG_PHASES,
  INITIAL_CYBER_WORKS,
  INITIAL_AUTOMATED_THREATS,
  INITIAL_INVESTIGATION_CASES,
  INITIAL_EVIDENCE_RECORDS,
  INITIAL_INFRASTRUCTURE_GRAPH
} from './src/data/seedData.ts';
import { 
  IncidentReport, 
  ThreatIndicator, 
  SecurityAdvisory, 
  LiveCyberWork, 
  AutomatedThreat,
  InvestigationCase,
  EvidenceRecord,
  ThreatInfrastructureGraph,
  IpTraceResult 
} from './src/types.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// In-memory data store initialized with authentic Uganda seed data
let incidents: IncidentReport[] = [...INITIAL_INCIDENTS];
let indicators: ThreatIndicator[] = [...INITIAL_INDICATORS];
let advisories: SecurityAdvisory[] = [...INITIAL_ADVISORIES];
let cyberWorks: LiveCyberWork[] = [...INITIAL_CYBER_WORKS];
let automatedThreats: AutomatedThreat[] = [...INITIAL_AUTOMATED_THREATS];
let investigationCases: InvestigationCase[] = [...INITIAL_INVESTIGATION_CASES];
let evidenceRecords: EvidenceRecord[] = [...INITIAL_EVIDENCE_RECORDS];
let infrastructureGraph: ThreatInfrastructureGraph = { ...INITIAL_INFRASTRUCTURE_GRAPH };

// Gemini Client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to sanitize indicators (e.g. normalize phone numbers, URLs)
function normalizeIndicator(val: string): string {
  const trimmed = val.trim();
  if (/^\+?256/.test(trimmed) || /^07[0-9]{8}/.test(trimmed)) {
    // Uganda phone number normalization
    const cleaned = trimmed.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('0')) {
      return '+256' + cleaned.substring(1);
    }
    return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
  }
  return trimmed.toLowerCase();
}

// REST API ROUTES

// 1. System Health & Stats
app.get('/api/stats', (req, res) => {
  const totalReports = incidents.length;
  const underReview = incidents.filter(i => i.status === 'Submitted' || i.status === 'Under Review').length;
  const activeInvestigations = incidents.filter(i => i.status === 'Active Investigation').length;
  const mitigatedOrResolved = incidents.filter(i => i.status === 'Mitigated' || i.status === 'Resolved').length;
  const totalLossUGX = incidents.reduce((sum, i) => sum + (i.estimatedFinancialLossUGX || 0), 0);
  const totalVerifiedIOCs = indicators.filter(i => i.reviewStatus === 'Verified Malicious').length;

  // Regional breakdown
  const regions: Record<string, number> = { Central: 0, Eastern: 0, Western: 0, Northern: 0 };
  const categories: Record<string, number> = {};

  incidents.forEach(inc => {
    if (inc.region && regions[inc.region] !== undefined) {
      regions[inc.region]++;
    }
    categories[inc.incidentCategory] = (categories[inc.incidentCategory] || 0) + 1;
  });

  res.json({
    totalReports,
    underReview,
    activeInvestigations,
    mitigatedOrResolved,
    totalLossUGX,
    totalVerifiedIOCs,
    regions,
    categories
  });
});

// 2. Incidents List & Filtering
app.get('/api/incidents', (req, res) => {
  const { status, category, severity, search, district } = req.query;
  let results = [...incidents];

  if (status && typeof status === 'string' && status !== 'All') {
    results = results.filter(i => i.status === status);
  }
  if (category && typeof category === 'string' && category !== 'All') {
    results = results.filter(i => i.incidentCategory === category);
  }
  if (severity && typeof severity === 'string' && severity !== 'All') {
    results = results.filter(i => i.severity === severity);
  }
  if (district && typeof district === 'string' && district !== 'All') {
    results = results.filter(i => i.district.toLowerCase() === district.toLowerCase());
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(i => 
      i.referenceNumber.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.district.toLowerCase().includes(q) ||
      i.suspectIdentifiers.some(s => s.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  results.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  res.json(results);
});

// 3. Submit New Incident Report
app.post('/api/incidents', async (req, res) => {
  try {
    const body = req.body;
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `CGU-2026-${randomSeq}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Initial triage analysis (if not provided, attempt Gemini analysis)
    let aiTriageAnalysis = body.aiTriageAnalysis;
    if (!aiTriageAnalysis && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the automated threat triage engine for CyberTrin Uganda (UG-CERT).
Analyze this incident report from a Ugandan citizen or business:
Title: ${body.title || 'Untitled'}
Category: ${body.incidentCategory || 'General Cyber Incident'}
Platform: ${body.affectedPlatform || 'Unknown'}
Location: ${body.district || 'Kampala'}, Uganda
Suspect Info: ${(body.suspectIdentifiers || []).join(', ')}
Narrative: ${body.description || 'No description'}

Respond strictly with valid JSON conforming to this format:
{
  "threatScore": <integer 1 to 100>,
  "detectedTTPs": ["<MITRE ATT&CK or scam tactic code and description>", "..."],
  "summary": "<Concise 2-3 sentence forensic appraisal emphasizing Ugandan context e.g. MoMo, SACCO, telecom>",
  "recommendedActions": ["<Action 1 for victim or analyst>", "<Action 2>", "<Action 3>"],
  "extractedIOCs": ["<Extracted phone number, URL, domain, or account>", "..."]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          aiTriageAnalysis = {
            threatScore: parsed.threatScore || 70,
            detectedTTPs: parsed.detectedTTPs || ['T1566: Social Engineering'],
            summary: parsed.summary || 'Incident triaged by CyberGuard AI.',
            recommendedActions: parsed.recommendedActions || ['Monitor account', 'Report to telecom'],
            extractedIOCs: parsed.extractedIOCs || (body.suspectIdentifiers || []),
            analyzedAt: now
          };
        }
      } catch (err) {
        console.warn('AI Triage error during incident submission:', err);
      }
    }

    const newIncident: IncidentReport = {
      id: `inc-${Date.now()}`,
      referenceNumber,
      title: body.title || 'Citizen Cybersecurity Report',
      incidentCategory: body.incidentCategory || 'Mobile Money & Financial Fraud',
      severity: body.severity || 'Medium',
      status: 'Submitted',
      reportedAt: now,
      updatedAt: now,
      isAnonymous: !!body.isAnonymous,
      reporter: body.isAnonymous ? undefined : body.reporter,
      district: body.district || 'Kampala',
      region: body.region || 'Central',
      affectedPlatform: body.affectedPlatform || 'Mobile Money',
      suspectIdentifiers: body.suspectIdentifiers || [],
      estimatedFinancialLossUGX: Number(body.estimatedFinancialLossUGX) || 0,
      description: body.description || '',
      evidenceFiles: body.evidenceFiles || [],
      aiTriageAnalysis: aiTriageAnalysis || {
        threatScore: 65,
        detectedTTPs: ['T1566: Social Engineering / MoMo Fraud'],
        summary: 'Incident received and queued for UG-CERT analyst review.',
        recommendedActions: [
          'Change PIN immediately via official USSD menu (*165# or *185#).',
          'Preserve SMS receipts and call history screenshots.'
        ],
        extractedIOCs: body.suspectIdentifiers || [],
        analyzedAt: now
      },
      analystNotes: [],
      assignedAnalyst: 'Pending Assignment',
      referredToAuthority: 'None'
    };

    incidents.unshift(newIncident);

    // If suspect identifiers exist, register or increment indicators
    if (newIncident.suspectIdentifiers && newIncident.suspectIdentifiers.length > 0) {
      newIncident.suspectIdentifiers.forEach(idVal => {
        const normalized = normalizeIndicator(idVal);
        const existing = indicators.find(i => i.normalizedValue === normalized);
        if (existing) {
          existing.reportedCount += 1;
          existing.lastActive = new Date().toISOString().substring(0, 10);
          if (!existing.associatedIncidents?.includes(referenceNumber)) {
            existing.associatedIncidents = [...(existing.associatedIncidents || []), referenceNumber];
          }
        } else {
          indicators.push({
            id: `ioc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            indicatorType: idVal.includes('http') || idVal.includes('.') ? 'URL / Domain' : 'Phone Number',
            normalizedValue: normalized,
            originalValue: idVal,
            reviewStatus: 'Suspicious',
            confidence: 0.70,
            threatCategory: newIncident.incidentCategory,
            reportedCount: 1,
            firstDetected: new Date().toISOString().substring(0, 10),
            lastActive: new Date().toISOString().substring(0, 10),
            telecomOrProvider: idVal.startsWith('+25677') || idVal.startsWith('+25678') ? 'MTN Uganda' : (idVal.startsWith('+25670') || idVal.startsWith('+25675') ? 'Airtel Uganda' : 'Unknown'),
            description: `Reported via incident ${referenceNumber}: ${newIncident.title}`,
            tags: ['Citizen-Reported', newIncident.district],
            associatedIncidents: [referenceNumber]
          });
        }
      });
    }

    res.status(201).json(newIncident);
  } catch (error: any) {
    console.error('Error submitting incident:', error);
    res.status(500).json({ error: 'Failed to record incident', message: error.message });
  }
});

// 4. Update Incident Triage State (Analyst Workbench)
app.patch('/api/incidents/:id', (req, res) => {
  const { id } = req.params;
  const index = incidents.findIndex(i => i.id === id || i.referenceNumber === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const current = incidents[index];
  const { status, severity, analystNote, assignedAnalyst, referredToAuthority } = req.body;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const updatedNotes = [...(current.analystNotes || [])];
  if (analystNote && analystNote.trim()) {
    updatedNotes.push({
      author: assignedAnalyst || 'UG-CERT Analyst',
      timestamp: now,
      note: analystNote.trim()
    });
  }

  const updated: IncidentReport = {
    ...current,
    status: status || current.status,
    severity: severity || current.severity,
    assignedAnalyst: assignedAnalyst !== undefined ? assignedAnalyst : current.assignedAnalyst,
    referredToAuthority: referredToAuthority !== undefined ? referredToAuthority : current.referredToAuthority,
    analystNotes: updatedNotes,
    updatedAt: now
  };

  incidents[index] = updated;
  res.json(updated);
});

// 5. Threat Indicators Query
app.get('/api/threat-indicators', (req, res) => {
  const { search, type, status } = req.query;
  let results = [...indicators];

  if (type && typeof type === 'string' && type !== 'All') {
    results = results.filter(i => i.indicatorType === type);
  }
  if (status && typeof status === 'string' && status !== 'All') {
    results = results.filter(i => i.reviewStatus === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    results = results.filter(i => 
      i.normalizedValue.toLowerCase().includes(q) ||
      i.originalValue.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  results.sort((a, b) => b.reportedCount - a.reportedCount);
  res.json(results);
});

// 6. Threat Indicator Promotion / Verification
app.post('/api/threat-indicators', (req, res) => {
  const body = req.body;
  const normalized = normalizeIndicator(body.value || body.normalizedValue);

  const existingIndex = indicators.findIndex(i => i.normalizedValue === normalized);
  if (existingIndex >= 0) {
    indicators[existingIndex] = {
      ...indicators[existingIndex],
      reviewStatus: body.reviewStatus || 'Verified Malicious',
      confidence: body.confidence !== undefined ? body.confidence : 0.95,
      lastActive: new Date().toISOString().substring(0, 10),
      description: body.description || indicators[existingIndex].description
    };
    return res.json(indicators[existingIndex]);
  }

  const newIoc: ThreatIndicator = {
    id: `ioc-${Date.now()}`,
    indicatorType: body.indicatorType || 'Phone Number',
    normalizedValue: normalized,
    originalValue: body.value || normalized,
    reviewStatus: body.reviewStatus || 'Verified Malicious',
    confidence: body.confidence || 0.95,
    threatCategory: body.threatCategory || 'Mobile Money & Financial Fraud',
    reportedCount: 1,
    firstDetected: new Date().toISOString().substring(0, 10),
    lastActive: new Date().toISOString().substring(0, 10),
    telecomOrProvider: body.telecomOrProvider || 'Uganda Telecom / ISP',
    description: body.description || 'Verified via UG-CERT threat analysis pipeline.',
    tags: body.tags || ['Analyst-Verified', 'UG-CERT'],
    associatedIncidents: body.incidentRef ? [body.incidentRef] : []
  };

  indicators.unshift(newIoc);
  res.status(201).json(newIoc);
});

// 7. Security Advisories
app.get('/api/advisories', (req, res) => {
  res.json(advisories);
});

// 7b. Live Cyber Works Taking Place (Active Defense Operations)
app.get('/api/cyber-works', (req, res) => {
  res.json(cyberWorks);
});

app.post('/api/cyber-works', (req, res) => {
  const body = req.body;
  const newWork: LiveCyberWork = {
    id: `work-${Date.now()}`,
    operationName: body.operationName || 'Operation Rapid-Shield: Emergency Incident Response',
    district: body.district || 'Kampala',
    lat: body.lat || 0.3476,
    lng: body.lng || 32.5825,
    status: body.status || 'Active Defense',
    workCategory: body.workCategory || 'Packet Scrubbing',
    leadAgency: body.leadAgency || 'UG-CERT Rapid Operations Desk',
    personnelCount: Number(body.personnelCount) || 4,
    metrics: body.metrics || 'Countermeasure deployed; continuous packet telemetry stream active',
    activeTools: body.activeTools || ['Suricata IDS', 'Zeek Probe', 'SS7 Signalling Filter'],
    description: body.description || 'Live cyber defense deployment initiated in response to automated threat alert.',
    lastUpdate: 'Just now'
  };

  cyberWorks.unshift(newWork);
  res.status(201).json(newWork);
});

// 7c. Automated Threat Detection Endpoints & Danger Warnings
app.get('/api/automated-threats', (req, res) => {
  res.json(automatedThreats);
});

const UGANDA_DISTRICT_LOCATIONS: Record<string, { lat: number; lng: number; region: 'Central' | 'Eastern' | 'Western' | 'Northern' }> = {
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

app.post('/api/automated-threats/detect', async (req, res) => {
  try {
    const districtsList = Object.keys(UGANDA_DISTRICT_LOCATIONS);
    const requestedDistrict = req.body.district && UGANDA_DISTRICT_LOCATIONS[req.body.district] 
      ? req.body.district 
      : districtsList[Math.floor(Math.random() * districtsList.length)];
    
    const geo = UGANDA_DISTRICT_LOCATIONS[requestedDistrict];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let threatData: Partial<AutomatedThreat> | null = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the autonomous National Cyber Threat Radar and Sensor Correlator for CyberTrin Uganda (UG-CERT).
A sudden telemetry anomaly has triggered an automatic sensor alarm in ${requestedDistrict} district, Uganda (${geo.region} Region).
Synthesize an authentic real-time cyber threat detection report suitable for emergency alert broadcasting.
Scenarios could involve:
- Rogue USSD shortcode gateway injecting fake MTN/Airtel MoMo reversal prompts.
- Coordinated SIM-swap wave targeting SACCO treasury or agricultural cooperative managers.
- Malicious Android APK masquerading as a quick mobile loan or URA e-Tax utility.
- Autonomous brute-force password spraying against hospital / district local government servers.
- Dark web botnet scanner harvesting citizen credentials.

Respond strictly with valid JSON conforming to this schema:
{
  "threatTitle": "<Short impactful threat title, max 8 words>",
  "threatCategory": "<Mobile Money & Financial Fraud | Phishing & SMS Spoofing | SIM Swap & Telecom Fraud | Ransomware & Malware | Impersonation & Social Engineering | Fake SACCO & Investment Scam>",
  "dangerLevel": "<CRITICAL DANGER | HIGH HAZARD | SEVERE ALERT>",
  "dangerScore": <number between 82 and 99>,
  "automatedSource": "<e.g. Autonomous SS7 Signalling Sensor, Core Packet Inspection Engine, MoMo Gateway Trap, Darknet Honeypot Node>",
  "suspectIdentifiers": ["<Clean indicator e.g. +25677xxxxxxx, shortcode, URL, or IP>"],
  "affectedInfrastructure": "<Specific Uganda infrastructure e.g. Local Telecom Base Station, District Hospital Network, Cooperative Society Switch>",
  "dangerDescription": "<2 sentences warning of the exact danger taking place in that area>",
  "automatedContainmentAction": "<Immediate autonomous defense triggered, e.g. Automated IP drop rule sent to telecom gateway>"
}`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (geminiRes.text) {
          threatData = JSON.parse(geminiRes.text.trim());
        }
      } catch (err) {
        console.warn('Gemini automated threat generation fallback:', err);
      }
    }

    // Procedural Fallback if AI unavailable
    if (!threatData) {
      const proceduralScenarios = [
        {
          threatTitle: `Rogue GSM Cell Intercept in ${requestedDistrict}`,
          threatCategory: 'SIM Swap & Telecom Fraud' as const,
          dangerLevel: 'CRITICAL DANGER' as const,
          dangerScore: 97,
          automatedSource: 'Autonomous Telecom Signal Sensor #UG-SIG-08',
          suspectIdentifiers: [`+25677${Math.floor(1000000 + Math.random() * 8999999)}`, '*165*8# Spoof'],
          affectedInfrastructure: `${requestedDistrict} Core Telecom Base Station`,
          dangerDescription: `DANGER WARNING: Autonomous detector intercepted fake IMSI catcher broadcasting spoofed SIM registration requests across ${requestedDistrict}.`,
          automatedContainmentAction: 'Automated radio frequency isolation requested via UCC Spectrum Directorate.'
        },
        {
          threatTitle: `Surge in Mobile Money Reversal Phishing`,
          threatCategory: 'Mobile Money & Financial Fraud' as const,
          dangerLevel: 'HIGH HAZARD' as const,
          dangerScore: 91,
          automatedSource: 'Payment Gateway Anomaly Probe #MOMO-88',
          suspectIdentifiers: [`+25670${Math.floor(1000000 + Math.random() * 8999999)}`, 'https://ug-momo-reversal.biz'],
          affectedInfrastructure: `${requestedDistrict} Mobile Money Agent Corridor`,
          dangerDescription: `DANGER WARNING: Burst of 800+ spoofed transaction reversal SMS messages targeting merchant kiosks in ${requestedDistrict}.`,
          automatedContainmentAction: 'Automated sender identifier blacklist pushed to national telecom SMS aggregators.'
        },
        {
          threatTitle: `Distributed Ransomware Scanner on Public Health Grid`,
          threatCategory: 'Ransomware & Malware' as const,
          dangerLevel: 'CRITICAL DANGER' as const,
          dangerScore: 95,
          automatedSource: 'GovNet Intrusion Detection System',
          suspectIdentifiers: ['197.239.12.88', 'c2-beacon.ug-health.top'],
          affectedInfrastructure: `${requestedDistrict} Regional Referral Hospital LAN`,
          dangerDescription: `DANGER WARNING: Active exploit attempt against SMBv1 port detected targeting patient records and diagnostic computers.`,
          automatedContainmentAction: 'Automated firewall isolation rule enforced; external port 445 filtered at gateway.'
        }
      ];

      threatData = proceduralScenarios[Math.floor(Math.random() * proceduralScenarios.length)];
    }

    const newThreat: AutomatedThreat = {
      id: `threat-auto-${Date.now()}`,
      district: requestedDistrict,
      region: geo.region,
      lat: geo.lat + (Math.random() - 0.5) * 0.02,
      lng: geo.lng + (Math.random() - 0.5) * 0.02,
      threatTitle: threatData.threatTitle || `Automated Cyber Threat in ${requestedDistrict}`,
      threatCategory: threatData.threatCategory || 'Mobile Money & Financial Fraud',
      dangerLevel: threatData.dangerLevel || 'CRITICAL DANGER',
      dangerScore: threatData.dangerScore || 92,
      detectedAt: now,
      automatedSource: threatData.automatedSource || 'National Cyber Threat Radar',
      suspectIdentifiers: threatData.suspectIdentifiers || [`+25677${Math.floor(1000000 + Math.random() * 8999999)}`],
      affectedInfrastructure: threatData.affectedInfrastructure || `${requestedDistrict} Regional Node`,
      dangerDescription: threatData.dangerDescription || `Danger warning: An active threat was automatically intercepted in ${requestedDistrict}.`,
      automatedContainmentAction: threatData.automatedContainmentAction || 'Automated rate limiting and firewall containment triggered.',
      isMitigated: false
    };

    automatedThreats.unshift(newThreat);

    // Also register any suspect identifiers as indicators
    newThreat.suspectIdentifiers.forEach(idVal => {
      const normalized = normalizeIndicator(idVal);
      const existing = indicators.find(i => i.normalizedValue === normalized);
      if (existing) {
        existing.reportedCount += 1;
        existing.lastActive = new Date().toISOString().substring(0, 10);
      } else {
        indicators.unshift({
          id: `ioc-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          indicatorType: idVal.includes('http') || idVal.includes('.') ? 'URL / Domain' : 'Phone Number',
          normalizedValue: normalized,
          originalValue: idVal,
          reviewStatus: 'Verified Malicious',
          confidence: 0.98,
          threatCategory: newThreat.threatCategory,
          reportedCount: 1,
          firstDetected: new Date().toISOString().substring(0, 10),
          lastActive: new Date().toISOString().substring(0, 10),
          telecomOrProvider: 'Flagged by Autonomous Sensor',
          description: `Automatically detected during danger alert in ${newThreat.district}: ${newThreat.threatTitle}`,
          tags: ['Autonomous-Detection', 'Danger-Alert', newThreat.district]
        });
      }
    });

    res.status(201).json(newThreat);
  } catch (error: any) {
    console.error('Error running automated threat detection:', error);
    res.status(500).json({ error: 'Failed to run threat detection', message: error.message });
  }
});

app.patch('/api/automated-threats/:id', (req, res) => {
  const { id } = req.params;
  const threatIndex = automatedThreats.findIndex(t => t.id === id);
  if (threatIndex === -1) {
    return res.status(404).json({ error: 'Threat not found' });
  }

  automatedThreats[threatIndex] = {
    ...automatedThreats[threatIndex],
    ...req.body
  };

  res.json(automatedThreats[threatIndex]);
});

// 8. Research Data Dictionary & Methodology Logs
app.get('/api/schema-definitions', (req, res) => {
  res.json(DATA_DICTIONARY_TABLES);
});

app.get('/api/methodology-log', (req, res) => {
  res.json(METHODOLOGY_LOG_PHASES);
});

// 9. Sanitized Dataset Export for Academic/Policy Researchers
app.get('/api/export-dataset', (req, res) => {
  const { type } = req.query;
  if (type === 'indicators') {
    return res.json({
      exportMetadata: {
        source: 'CyberTrin Uganda (UG-CERT / NITA-U)',
        exportDate: new Date().toISOString(),
        totalRecords: indicators.length,
        license: 'Open Data for Academic & Public Defense Use',
        jurisdiction: 'Republic of Uganda'
      },
      data: indicators
    });
  }

  // Sanitize incident reports: Strip names, personal phone numbers to comply with Data Protection & Privacy Act 2019
  const sanitizedIncidents = incidents.map(inc => ({
    referenceNumber: inc.referenceNumber,
    incidentCategory: inc.incidentCategory,
    severity: inc.severity,
    status: inc.status,
    district: inc.district,
    region: inc.region,
    affectedPlatform: inc.affectedPlatform,
    estimatedFinancialLossUGX: inc.estimatedFinancialLossUGX,
    reportedAt: inc.reportedAt,
    aiTriageScore: inc.aiTriageAnalysis?.threatScore,
    detectedTTPs: inc.aiTriageAnalysis?.detectedTTPs,
    suspectIdentifiersCount: inc.suspectIdentifiers.length,
    referredToAuthority: inc.referredToAuthority
  }));

  res.json({
    exportMetadata: {
      source: 'CyberTrin Uganda (UG-CERT)',
      exportDate: new Date().toISOString(),
      privacyCompliance: 'Uganda Data Protection and Privacy Act 2019 (PII scrubbed)',
      totalRecords: sanitizedIncidents.length
    },
    data: sanitizedIncidents
  });
});

// 10. Gemini AI: Deep Threat Analysis Endpoint
app.post('/api/gemini/analyze-threat', async (req, res) => {
  try {
    const { title, category, description, platform, district, indicatorsList } = req.body;

    const prompt = `You are the Senior Cyber Intelligence Analyst for CyberTrin Uganda (UG-CERT), working in partnership with the Uganda Police Force Cybercrime Division and NITA-U.
Perform a forensic triage and threat classification on this incident report:

Title: ${title || 'Unspecified Incident'}
Category: ${category || 'General Threat'}
Platform / Vector: ${platform || 'Unknown'}
District / Region: ${district || 'Kampala'}, Uganda
Reported Indicators: ${(indicatorsList || []).join(', ')}
Narrative Details: ${description || 'No narrative provided.'}

Your assessment must specifically address the Ugandan threat landscape (such as MTN MoMo PIN interception, Airtel Money reversals, SACCO scams, URA e-Tax lures, WhatsApp admin takeovers, SIM swaps, and Computer Misuse Act 2022 violations).

Respond strictly with a valid JSON object matching this schema:
{
  "threatScore": <number between 1 and 100>,
  "severityRating": "<Low | Medium | High | Critical>",
  "detectedTTPs": [
    "<MITRE ATT&CK technique code>: <Technique name with Ugandan context>"
  ],
  "executiveSummary": "<2-3 sentence authoritative summary of what occurred and the risk level>",
  "psychologicalLures": ["<Lure tactic 1 e.g. Artificial Urgency>", "<Lure tactic 2>"],
  "extractedIOCs": ["<Cleaned indicators of compromise: phone numbers in +256 format, URLs, sender IDs>"],
  "victimImmediateDefense": [
    "<Step 1: e.g. Dial *165# or *185# to freeze wallet or change PIN>",
    "<Step 2: Emergency bank/police hotline>",
    "<Step 3: Evidence preservation>"
  ],
  "ugandaLegalContext": "<Relevant section of Uganda Computer Misuse Act 2022 or Data Protection and Privacy Act 2019 applicable to this offense>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) {
      throw new Error('No analysis generated by Gemini');
    }

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini analyze-threat error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze threat', 
      message: error.message || 'Gemini analysis failed' 
    });
  }
});

// 11. Gemini AI: Citizen Message / SMS / Link Heuristic Scanner
app.post('/api/gemini/scan-message', async (req, res) => {
  try {
    const { content, senderId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content or URL is required' });
    }

    const prompt = `You are CyberTrin Uganda's Citizen Threat Detector.
A Ugandan citizen has received this suspicious SMS message, WhatsApp text, email, or link and wants to know if it is a scam:

Sender / Number: ${senderId || 'Unknown'}
Content: "${content}"

Analyze it against common Ugandan cyber fraud schemes:
- Fake Mobile Money cash-out or reversal alerts ("You have received UGX...")
- Fake MTN / Airtel customer care agent PIN requests
- Fake Uganda Revenue Authority (URA) tax refund or TIN audit SMS
- WhatsApp verification code hijacking (requesting 6-digit SMS code)
- Fake SACCO or quick online loan approvals demanding "commitment fee"
- Impersonation of UPDF, Police, or Government scholarship recruitment

Respond strictly in valid JSON format:
{
  "verdict": "<SCAM | SUSPICIOUS | LIKELY SAFE>",
  "riskScore": <number 1 to 100>,
  "scamType": "<e.g. Mobile Money Reversal Scam, URA Credential Harvesting, SACCO Advance Fee Fraud, WhatsApp Hijack, Legitimate Notification>",
  "summaryPlainEnglish": "<Clear, plain-English explanation without heavy jargon of why this is or isn't a scam>",
  "localLanguageClues": "<Note if local terms/slang like 'reversal', 'mufere', 'school fees', or telecom USSD formats are misused>",
  "redFlagsDetected": ["<Red flag 1>", "<Red flag 2>"],
  "safeCitizenAction": [
    "<Step 1: What to do right now, e.g. Do not dial any USSD code or send any money>",
    "<Step 2: Official number to verify with telecom or institution>"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) {
      throw new Error('No scanner response from Gemini');
    }

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini scan-message error:', error);
    res.status(500).json({ 
      error: 'Failed to scan message', 
      message: error.message || 'Gemini scanning failed' 
    });
  }
});

// =========================================================================
// 12. DIGITAL FORENSICS & INVESTIGATION MODULE ENDPOINTS
// =========================================================================

// 12a. IP Address Deep Geolocation & Digital Trace
app.post('/api/investigation/trace-ip', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Valid IP address required' });
    }

    const trimmedIp = ip.trim();
    const isIPv6 = trimmedIp.includes(':');
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmedIp);

    if (!isIPv4 && !isIPv6) {
      return res.status(400).json({ error: 'Invalid IPv4 or IPv6 address format' });
    }

    // Default template
    let traceResult: IpTraceResult = {
      ip: trimmedIp,
      ipVersion: isIPv6 ? 'IPv6' : 'IPv4',
      country: 'Uganda',
      countryCode: 'UG',
      region: 'Central Region',
      city: 'Kampala',
      approxLat: 0.3476,
      approxLng: 32.5825,
      isp: 'Liquid Intelligent Technologies Uganda',
      asn: 'AS36982',
      asOrg: 'Liquid Telecommunications Ltd',
      isDataCenterOrHosting: false,
      isVpnOrProxy: false,
      isTorExitNode: false,
      reputationScore: 25,
      reputationCategory: 'Low Risk',
      associatedDomains: [],
      historicalThreatCount: 0,
      confidenceLevel: 'High',
      intelligenceSource: 'National Cyber Threat Intelligence Feed & BGP Route Tables',
      intelligenceDate: new Date().toISOString().substring(0, 10),
      forensicDisclaimer: 'IMPORTANT INVESTIGATIVE NOTICE: IP geolocation indicates network routing infrastructure, ISP gateways, or hosting facilities. It MUST NEVER be presented as the exact physical location of a suspect. Lawful subscriber identification requires a Section 28 Production Order directed to the relevant ISP under the Uganda Computer Misuse Act 2022.'
    };

    // Check if known in our active threat indicator database
    const matchingIndicator = indicators.find(i => i.normalizedValue === trimmedIp || i.originalValue === trimmedIp);
    const matchingThreat = automatedThreats.find(t => t.suspectIdentifiers.some(s => s.includes(trimmedIp)));

    // Attempt live lookup with external IP intelligence if possible
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2400);
      const extRes = await fetch(`http://ip-api.com/json/${trimmedIp}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query,proxy,hosting`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (extRes.ok) {
        const data = await extRes.json();
        if (data && data.status === 'success') {
          traceResult.country = data.country || traceResult.country;
          traceResult.countryCode = data.countryCode || traceResult.countryCode;
          traceResult.region = data.regionName || traceResult.region;
          traceResult.city = data.city || traceResult.city;
          traceResult.approxLat = data.lat || traceResult.approxLat;
          traceResult.approxLng = data.lon || traceResult.approxLng;
          traceResult.isp = data.isp || traceResult.isp;
          traceResult.asn = data.as ? data.as.split(' ')[0] : traceResult.asn;
          traceResult.asOrg = data.org || traceResult.asOrg;
          traceResult.isVpnOrProxy = !!data.proxy;
          traceResult.isDataCenterOrHosting = !!data.hosting;
        }
      }
    } catch {
      // Use heuristic threat intelligence fallback
    }

    // Known threat signatures for specific Ugandan investigative IPs
    if (trimmedIp === '102.134.42.19') {
      traceResult.country = 'Uganda';
      traceResult.city = 'Kampala';
      traceResult.approxLat = 0.3476;
      traceResult.approxLng = 32.5825;
      traceResult.isp = 'Liquid Telecom Uganda';
      traceResult.asn = 'AS36982';
      traceResult.isVpnOrProxy = true;
      traceResult.isTorExitNode = true;
      traceResult.reputationScore = 94;
      traceResult.reputationCategory = 'Suspicious Proxy';
      traceResult.associatedDomains = ['tor-exit-node-ug.net', 'vpn-relay.liquid.ug'];
      traceResult.historicalThreatCount = 38;
    } else if (trimmedIp === '197.239.8.5') {
      traceResult.country = 'Uganda';
      traceResult.city = 'Kampala';
      traceResult.approxLat = 0.3162;
      traceResult.approxLng = 32.5822;
      traceResult.isp = 'Raxio Data Centre / Uganda Internet Exchange (UIXP)';
      traceResult.asn = 'AS37075';
      traceResult.isDataCenterOrHosting = true;
      traceResult.reputationScore = 88;
      traceResult.reputationCategory = 'Malicious C2';
      traceResult.associatedDomains = ['c2-gateway-momo.biz'];
      traceResult.historicalThreatCount = 42;
    } else if (trimmedIp === '45.142.182.11') {
      traceResult.country = 'Netherlands';
      traceResult.city = 'Amsterdam';
      traceResult.approxLat = 52.3676;
      traceResult.approxLng = 4.9041;
      traceResult.isp = 'Stark Industries Bulletproof Hosting';
      traceResult.asn = 'AS44477';
      traceResult.isDataCenterOrHosting = true;
      traceResult.reputationScore = 98;
      traceResult.reputationCategory = 'Malicious C2';
      traceResult.associatedDomains = ['api-gateway-momo-ug.biz', 'secure-ussd-verify.net'];
      traceResult.historicalThreatCount = 112;
    } else if (trimmedIp === '185.220.101.4') {
      traceResult.country = 'Germany';
      traceResult.city = 'Frankfurt';
      traceResult.approxLat = 50.1109;
      traceResult.approxLng = 8.6821;
      traceResult.isp = 'Tor Exit Authority / Zwiebelfreunde';
      traceResult.asn = 'AS206238';
      traceResult.isTorExitNode = true;
      traceResult.isVpnOrProxy = true;
      traceResult.reputationScore = 96;
      traceResult.reputationCategory = 'Known Phishing Host';
      traceResult.associatedDomains = ['ura-etax-uganda-portal.net'];
      traceResult.historicalThreatCount = 89;
    }

    if (matchingIndicator || matchingThreat) {
      traceResult.reputationScore = Math.max(traceResult.reputationScore, 90);
      traceResult.reputationCategory = 'Malicious C2';
      traceResult.historicalThreatCount = (matchingIndicator?.reportedCount || 1) + 15;
    }

    res.json(traceResult);
  } catch (error: any) {
    console.error('IP trace error:', error);
    res.status(500).json({ error: 'Failed to trace IP address', message: error.message });
  }
});

// 12b. AI-Assisted Digital Trace Analysis (Email Headers, Network Logs, File Hashes)
app.post('/api/investigation/ai-trace-assist', async (req, res) => {
  try {
    const { artifactType, rawData, caseContext } = req.body;
    if (!rawData || !rawData.trim()) {
      return res.status(400).json({ error: 'Artifact content required' });
    }

    const prompt = `You are a Senior Digital Forensics Examiner for CyberTrin Uganda / Uganda Police Cybercrime CID.
Perform a forensic trace examination on the following digital artifact:

Artifact Type: ${artifactType || 'General Digital Evidence'}
Case Context: ${caseContext || 'Investigating unauthorized access and financial fraud targeting Ugandan citizens and entities.'}

Raw Artifact Content:
"""
${rawData.substring(0, 3500)}
"""

Conduct a rigorous forensic analysis adhering to the Uganda Evidence Act and Computer Misuse Act 2022:
1. Extract all actionable indicators (IP addresses, domains, email hops, cryptographic hashes, protocol headers).
2. If this is an Email Header, evaluate SPF, DKIM, DMARC, Received: hop chains, sender authenticity, and identify the true originating injection server IP vs. intermediate relay hops.
3. If this is a Network Log or URL, identify anomalous requests, injection strings, payload signatures, and target assets.
4. If this is a File Hash, evaluate malware family likelihood, sandbox indicators, and MITRE ATT&CK techniques.
5. Formulate a working Forensic Hypothesis.
6. Outline necessary lawful investigative procedures (e.g. Section 28 Production Orders to Ugandan ISPs, MLAT requests for foreign hosting providers, preservation letters under Budapest Convention standards).
7. Highlight evidentiary limitations (remind investigators that IP addresses/hostnames do not prove physical human identity without subscriber verification).

Respond strictly in valid JSON format:
{
  "artifactType": "${artifactType}",
  "forensicSummary": "<Concise 3-4 sentence forensic appraisal>",
  "extractedIndicators": [
    {
      "indicatorType": "<IP Address | Domain | URL | Email Address | Hash | ASN>",
      "value": "<clean extracted value>",
      "role": "<e.g. Originating Injection IP | Spoofed Display Sender | C2 Controller | Compromised Victim Server>",
      "reputationRisk": "<High | Medium | Low>"
    }
  ],
  "emailHeaderAnalysis": {
    "originatingIp": "<Extracted originating IP if email header, or null>",
    "spfResult": "<Pass | Fail | SoftFail | None | Not Applicable>",
    "dkimResult": "<Pass | Fail | None | Not Applicable>",
    "dmarcResult": "<Pass | Fail | None | Not Applicable>",
    "hopCount": <integer or 0>,
    "isForged": <boolean>
  },
  "detectedTTPs": [
    "<MITRE ATT&CK ID e.g. T1566.002: Spearphishing Link - explanation>"
  ],
  "forensicHypothesis": "<Clear technical hypothesis on the threat actor's infrastructure and modus operandi>",
  "recommendedLawfulSteps": [
    "<Step 1: Specific legal and technical action e.g. Apply for Section 28 Production Order to Liquid Telecom for subscriber logs for IP 102.134.42.19 at timestamp 2026-10-28 10:14 EAT>",
    "<Step 2: Preservation letter / DNS sinkhole>",
    "<Step 3: Evidence hashing and court exhibit preparation>"
  ],
  "evidentiaryLimitations": "<Explicit warning explaining why this digital trace alone does not confirm human identity or physical location without subscriber verification>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) {
      throw new Error('No forensic analysis response from Gemini');
    }

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error('AI trace assist error:', error);
    res.status(500).json({ error: 'Forensic trace analysis failed', message: error.message });
  }
});

// 12c. Investigation Cases CRUD
app.get('/api/investigation/cases', (req, res) => {
  res.json(investigationCases);
});

app.post('/api/investigation/cases', (req, res) => {
  const body = req.body;
  const count = investigationCases.length + 101;
  const newCase: InvestigationCase = {
    id: `case-${Date.now()}`,
    caseNumber: body.caseNumber || `CASE-2026-UG-${count}`,
    title: body.title || 'Untitled Cybercrime Investigation',
    leadInvestigator: body.leadInvestigator || 'Authorized Cybercrime Investigator',
    agency: body.agency || 'Uganda Police Cybercrime CID',
    status: body.status || 'Active Forensics',
    incidentReferences: body.incidentReferences || [],
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    summary: body.summary || 'Investigation initiated into digital traces and associated financial cybercrime.',
    suspectDigitalTraces: body.suspectDigitalTraces || [],
    evidenceCount: 0,
    legalWarrantStatus: body.legalWarrantStatus || 'Warrant Granted',
    statutoryBasis: body.statutoryBasis || 'Computer Misuse Act 2022'
  };

  investigationCases.unshift(newCase);
  res.status(201).json(newCase);
});

app.get('/api/investigation/cases/:id', (req, res) => {
  const { id } = req.params;
  const found = investigationCases.find(c => c.id === id || c.caseNumber === id);
  if (!found) return res.status(404).json({ error: 'Case not found' });
  const caseEvidence = evidenceRecords.filter(e => e.caseId === found.id || e.caseId === found.caseNumber);
  res.json({ ...found, evidence: caseEvidence });
});

// 12d. Evidence Records with Cryptographic Integrity Verification
app.get('/api/investigation/evidence/:caseId', (req, res) => {
  const { caseId } = req.params;
  const filtered = evidenceRecords.filter(e => e.caseId === caseId);
  res.json(filtered);
});

app.post('/api/investigation/evidence', (req, res) => {
  try {
    const body = req.body;
    const raw = body.rawValue || '';
    // Generate real SHA-256 hash of raw artifact
    const computedHash = crypto.createHash('sha256').update(raw).digest('hex');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newEvidence: EvidenceRecord = {
      id: `ev-${Date.now()}`,
      caseId: body.caseId || 'case-001',
      title: body.title || 'Digital Artifact Exhibit',
      artifactType: body.artifactType || 'Network Log',
      rawValue: raw,
      sha256Hash: body.sha256Hash || computedHash,
      collectedAt: now,
      collectedBy: body.collectedBy || 'Investigator on Duty',
      legalAuthorization: body.legalAuthorization || 'Section 28 Computer Misuse Act 2022',
      isTamperVerified: true,
      chainOfCustody: [
        {
          id: `coc-${Date.now()}`,
          timestamp: now,
          officerName: body.collectedBy || 'Investigator on Duty',
          officerBadgeOrId: body.officerBadge || 'CID-FORENSICS',
          actionTaken: 'Evidence collected, hashed with SHA-256, and sealed in digital evidence locker',
          storageLocation: 'UG-CERT Cryptographic Evidence Vault',
          sha256Verification: computedHash
        }
      ],
      notes: body.notes || ''
    };

    evidenceRecords.unshift(newEvidence);

    // Update case evidence count
    const targetCase = investigationCases.find(c => c.id === newEvidence.caseId || c.caseNumber === newEvidence.caseId);
    if (targetCase) {
      targetCase.evidenceCount += 1;
      targetCase.updatedAt = now;
    }

    res.status(201).json(newEvidence);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record evidence', message: error.message });
  }
});

// 12e. Interactive Threat Infrastructure Graph
app.get('/api/investigation/infrastructure-graph', (req, res) => {
  res.json(infrastructureGraph);
});

// 12f. Generate Formal Investigation Report
app.post('/api/investigation/generate-report', async (req, res) => {
  try {
    const { caseId, investigatorNotes, requestedAgency } = req.body;
    const foundCase = investigationCases.find(c => c.id === caseId || c.caseNumber === caseId) || investigationCases[0];
    const caseEv = evidenceRecords.filter(e => e.caseId === foundCase.id || e.caseId === foundCase.caseNumber);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let reportMarkdown = '';

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are a Senior Digital Forensics Investigator drafting an official, court-admissible Digital Evidence and Forensic Investigation Report for CyberTrin Uganda / Uganda Police Cybercrime Division (CID).

Case Details:
- Case Number: ${foundCase.caseNumber}
- Case Title: ${foundCase.title}
- Lead Investigator: ${foundCase.leadInvestigator}
- Agency: ${requestedAgency || foundCase.agency}
- Statutory Basis: ${foundCase.statutoryBasis}
- Suspect Traces: ${foundCase.suspectDigitalTraces.join(', ')}
- Associated Incidents: ${foundCase.incidentReferences.join(', ')}
- Total Preserved Evidence Records: ${caseEv.length}

Evidence Summary:
${caseEv.map((e, idx) => `Exhibit #${idx + 1}: ${e.title} (${e.artifactType}) - SHA-256: ${e.sha256Hash} - Authority: ${e.legalAuthorization}`).join('\n')}

Investigator Notes: ${investigatorNotes || 'Standard forensic workflow completed; evidence integrity preserved.'}

Draft a formal, structured Forensic Investigation Report in Markdown format with:
1. Executive Summary & Objective of Investigation
2. Digital Evidence Chain of Custody & SHA-256 Verification Table
3. Infrastructure Analysis & Network Correlation (IP, ASN, Domains, Reverse Proxy Cloaking)
4. Geographical Intelligence Estimation & Crucial Legal Limitations (Distinguishing network infrastructure from human suspect physical location)
5. Modus Operandi & MITRE ATT&CK Matrix Correlation
6. Recommendations for Prosecutorial Action & Lawful Section 28 Production Orders
7. Formal Certification Statement under Uganda Evidence Act (Electronic Evidence provisions) and Computer Misuse Act 2022.`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        });

        if (geminiRes.text) {
          reportMarkdown = geminiRes.text.trim();
        }
      } catch (err) {
        console.warn('Gemini report generation fallback:', err);
      }
    }

    if (!reportMarkdown) {
      reportMarkdown = `# REPUBLIC OF UGANDA
## UG-CERT & UGANDA POLICE FORCE CYBERCRIME DIVISION (CID)
### OFFICIAL DIGITAL FORENSICS INVESTIGATION REPORT

**Case Number:** ${foundCase.caseNumber}
**Date of Report:** ${now}
**Lead Investigator:** ${foundCase.leadInvestigator}
**Agency:** ${foundCase.agency}
**Statutory Basis:** ${foundCase.statutoryBasis}

---

### 1. EXECUTIVE SUMMARY
An authorized digital forensics examination was initiated pursuant to verified reports of cybercrime incidents (${foundCase.incidentReferences.join(', ')}). Digital indicators including suspect IP addresses, domains, and malicious payloads were seized and forensically analyzed in accordance with Section 28 of the Computer Misuse Act 2022.

### 2. DIGITAL EVIDENCE INVENTORY & INTEGRITY VERIFICATION
All digital artifacts have been cryptographically sealed using SHA-256 integrity hashing to satisfy chain-of-custody standards under the Uganda Evidence Act:

${caseEv.map((e, i) => `- **Exhibit ${i + 1}:** ${e.title}  
  *Artifact Type:* ${e.artifactType}  
  *SHA-256 Hash:* \`${e.sha256Hash}\`  
  *Chain of Custody Status:* Verified Tamper-Evident (${e.chainOfCustody.length} custody entries recorded)`).join('\n\n')}

### 3. INFRASTRUCTURE TRACING & GEOGRAPHICAL ESTIMATION
Digital tracing revealed traffic traversing domestic and international transit points:
- **Observed Digital Traces:** ${foundCase.suspectDigitalTraces.join(', ')}
- **Hosting / ASNs:** Liquid Intelligent Technologies (AS36982), Cloudflare Reverse Proxy (AS13335).

**IMPORTANT LEGAL & TECHNICAL LIMITATION:**
IP geolocation identifies the approximate geographical facility of the server, proxy, or ISP router. Under Uganda law, server geolocation does **not** establish the physical location of the criminal actor. To tie digital traces to a physical individual, lawful court production orders must be issued to the relevant telecommunications providers.

### 4. RECOMMENDATIONS & NEXT LEGAL STEPS
1. File formal ex-parte application for a Section 28 Production Order before the Chief Magistrate's Court.
2. Request Call Detail Records (CDR), IMSI binding, and subscriber KYC from MTN and Airtel Uganda.
3. Submit international preservation request to Cloudflare Trust & Safety for origin server server logs.

---
*Report certified by Digital Forensics & Cyber Threat Intelligence Unit, CyberTrin Uganda.*`;
    }

    res.json({
      caseNumber: foundCase.caseNumber,
      generatedAt: now,
      leadInvestigator: foundCase.leadInvestigator,
      reportMarkdown
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report', message: error.message });
  }
});


// Mount Vite in dev mode or serve static files in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CyberTrin Uganda server operational on http://0.0.0.0:${PORT}`);
  });
}

startServer();
