import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { 
  INITIAL_INCIDENTS, 
  INITIAL_INDICATORS, 
  INITIAL_ADVISORIES, 
  DATA_DICTIONARY_TABLES, 
  METHODOLOGY_LOG_PHASES 
} from './src/data/seedData.ts';
import { IncidentReport, ThreatIndicator, SecurityAdvisory } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// In-memory data store initialized with authentic Uganda seed data
let incidents: IncidentReport[] = [...INITIAL_INCIDENTS];
let indicators: ThreatIndicator[] = [...INITIAL_INDICATORS];
let advisories: SecurityAdvisory[] = [...INITIAL_ADVISORIES];

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
