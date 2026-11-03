import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  UploadCloud, 
  FileCheck, 
  AlertTriangle, 
  PhoneCall, 
  ArrowRight, 
  ArrowLeft, 
  HelpCircle, 
  Building, 
  DollarSign, 
  FileText 
} from 'lucide-react';
import { IncidentCategory, IncidentSeverity, IncidentReport } from '../types.ts';

interface CitizenReportWizardProps {
  onIncidentCreated: (newIncident: IncidentReport) => void;
  initialData?: { description: string; suspect: string };
  onViewWorkbench?: () => void;
}

const UGANDA_DISTRICTS = [
  'Kampala',
  'Wakiso',
  'Mukono',
  'Jinja',
  'Mbarara',
  'Gulu',
  'Masaka',
  'Arua',
  'Entebbe',
  'Fort Portal',
  'Mbale',
  'Lira',
  'Kabale',
  'Tororo',
  'Soroti',
  'Kasese',
  'Hoima',
  'Other District'
];

const CATEGORIES: { label: IncidentCategory; desc: string; icon: string }[] = [
  {
    label: 'Mobile Money & Financial Fraud',
    desc: 'MTN MoMo or Airtel Money fake reversal, PIN theft, agent social engineering',
    icon: '📱'
  },
  {
    label: 'Phishing & SMS Spoofing',
    desc: 'Fake URA tax refund links, banking SMS lures, deceptive emails or websites',
    icon: '🎣'
  },
  {
    label: 'SIM Swap & Telecom Fraud',
    desc: 'Unauthorized duplicate SIM card issuance, telecom KYC bypass',
    icon: '📶'
  },
  {
    label: 'Fake SACCO & Investment Scam',
    desc: 'Ponzi schemes, fraudulent SACCO WhatsApp groups, high-yield crypto scams',
    icon: '💰'
  },
  {
    label: 'Ransomware & Malware',
    desc: 'Locked office files (.uglock), server compromise, spyware',
    icon: '🦠'
  },
  {
    label: 'Impersonation & Social Engineering',
    desc: 'Impersonating government officials, police, school headmasters, or family',
    icon: '🎭'
  },
  {
    label: 'Data Breach & Unauthorized Disclosure',
    desc: 'Leaked customer database, medical records, violation of Data Protection Act',
    icon: '🔓'
  },
  {
    label: 'Online Extortion & Cyber Harassment',
    desc: 'Blackmail, revenge media, threatening digital messages (Computer Misuse Act)',
    icon: '⚖️'
  }
];

export const CitizenReportWizard: React.FC<CitizenReportWizardProps> = ({
  onIncidentCreated,
  initialData,
  onViewWorkbench
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [category, setCategory] = useState<IncidentCategory>('Mobile Money & Financial Fraud');
  const [severity, setSeverity] = useState<IncidentSeverity>('High');
  const [district, setDistrict] = useState<string>('Kampala');
  const [affectedPlatform, setAffectedPlatform] = useState<string>('MTN Mobile Money');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [suspectInput, setSuspectInput] = useState<string>(initialData?.suspect || '');
  const [suspectIdentifiers, setSuspectIdentifiers] = useState<string[]>(
    initialData?.suspect ? [initialData.suspect] : []
  );
  const [estimatedLossUGX, setEstimatedLossUGX] = useState<string>('0');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterContact, setReporterContact] = useState<string>('');
  const [reporterEmail, setReporterEmail] = useState<string>('');
  
  // Simulated evidence file
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; size: string }[]>([]);

  // AI Pre-Triage State
  const [isAiTriaging, setIsAiTriaging] = useState(false);
  const [aiPreview, setAiPreview] = useState<{
    threatScore: number;
    severityRating: IncidentSeverity;
    detectedTTPs: string[];
    executiveSummary: string;
    extractedIOCs: string[];
    victimImmediateDefense: string[];
    ugandaLegalContext: string;
  } | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<IncidentReport | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddSuspect = () => {
    if (suspectInput.trim()) {
      if (!suspectIdentifiers.includes(suspectInput.trim())) {
        setSuspectIdentifiers([...suspectIdentifiers, suspectInput.trim()]);
      }
      setSuspectInput('');
    }
  };

  const handleRemoveSuspect = (val: string) => {
    setSuspectIdentifiers(suspectIdentifiers.filter(s => s !== val));
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFiles([
        ...attachedFiles,
        {
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: `${(file.size / 1024).toFixed(1)} KB`
        }
      ]);
    }
  };

  // Run AI Pre-Triage via backend Gemini 3.8 Flash endpoint
  const handleRunAiPreTriage = async () => {
    if (!description.trim()) {
      setFormError('Please provide a description of what happened before running AI triage.');
      return;
    }

    setFormError(null);
    setIsAiTriaging(true);

    try {
      const res = await fetch('/api/gemini/analyze-threat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `${category} in ${district}`,
          category,
          platform: affectedPlatform,
          district,
          indicatorsList: suspectIdentifiers.length > 0 ? suspectIdentifiers : [suspectInput],
          description
        })
      });

      if (!res.ok) {
        throw new Error('AI analysis service unavailable');
      }

      const data = await res.json();
      setAiPreview(data);
      if (data.severityRating) {
        setSeverity(data.severityRating);
      }
      // If AI extracted extra IOCs, add them
      if (data.extractedIOCs && Array.isArray(data.extractedIOCs)) {
        const combined = Array.from(new Set([...suspectIdentifiers, ...data.extractedIOCs])).filter(Boolean);
        setSuspectIdentifiers(combined);
      }
    } catch (err: any) {
      console.warn('AI Pre-triage error:', err);
      setFormError('Could not complete live AI triage. You can still submit the report.');
    } finally {
      setIsAiTriaging(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setFormError('Please describe the incident in detail.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const regionMap: Record<string, 'Central' | 'Eastern' | 'Western' | 'Northern'> = {
      Kampala: 'Central',
      Wakiso: 'Central',
      Mukono: 'Central',
      Entebbe: 'Central',
      Masaka: 'Central',
      Jinja: 'Eastern',
      Mbale: 'Eastern',
      Tororo: 'Eastern',
      Soroti: 'Eastern',
      Mbarara: 'Western',
      'Fort Portal': 'Western',
      Kasese: 'Western',
      Kabale: 'Western',
      Hoima: 'Western',
      Gulu: 'Northern',
      Arua: 'Northern',
      Lira: 'Northern'
    };

    const finalRegion = regionMap[district] || 'Central';
    const finalTitle = title.trim() || `${category} - ${affectedPlatform} (${district})`;

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          incidentCategory: category,
          severity,
          district,
          region: finalRegion,
          affectedPlatform,
          suspectIdentifiers: suspectIdentifiers.length > 0 ? suspectIdentifiers : (suspectInput ? [suspectInput] : []),
          estimatedFinancialLossUGX: parseInt(estimatedLossUGX) || 0,
          description,
          isAnonymous,
          reporter: isAnonymous ? undefined : {
            name: reporterName,
            contact: reporterContact,
            email: reporterEmail,
            district
          },
          evidenceFiles: attachedFiles,
          aiTriageAnalysis: aiPreview ? {
            threatScore: aiPreview.threatScore,
            detectedTTPs: aiPreview.detectedTTPs,
            summary: aiPreview.executiveSummary,
            recommendedActions: aiPreview.victimImmediateDefense,
            extractedIOCs: aiPreview.extractedIOCs,
            analyzedAt: new Date().toISOString()
          } : undefined
        })
      });

      if (!res.ok) {
        throw new Error('Failed to record incident');
      }

      const created = await res.json();
      setSubmittedIncident(created);
      onIncidentCreated(created);
      setStep(4);
    } catch (err: any) {
      setFormError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setSuspectIdentifiers([]);
    setSuspectInput('');
    setEstimatedLossUGX('0');
    setAttachedFiles([]);
    setAiPreview(null);
    setSubmittedIncident(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      
      {/* Top Header Card */}
      <div className="mb-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-blue-400/40 bg-slate-950 shadow-xl shrink-0 hidden sm:block">
              <img 
                src="/assets/aistudio/ASSOCIATIOON_BUD_DON_E_8a09b5f8.jpg" 
                alt="CyberTrin VUCDSA Badge" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  CyberTrin Uganda Official Incident Portal
                </span>
                <span className="text-xs text-slate-400">Section 14, Computer Misuse Act</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Report a Cybersecurity Threat or Financial Fraud
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                Securely submit reports on Mobile Money theft, SMS phishing, SIM swaps, ransomware, or SACCO scams to CyberTrin Uganda and the Uganda Police Cybercrime Unit.
              </p>
            </div>
          </div>

          <a 
            href="tel:+256772590517"
            className="bg-slate-900/90 border border-amber-900/60 hover:border-amber-700 p-3 rounded-xl shrink-0 flex items-center gap-3 transition group"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Emergency Cyber Hotline</div>
              <div className="text-sm font-bold text-amber-300">+256 772590517</div>
            </div>
          </a>
        </div>

        {/* Step Indicator */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-3 gap-2">
          <div className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold ${step >= 1 ? 'bg-blue-950/60 border border-blue-800 text-blue-300' : 'text-slate-500'}`}>
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">1</span>
            <span>Threat Classification</span>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold ${step >= 2 ? 'bg-blue-950/60 border border-blue-800 text-blue-300' : 'text-slate-500'}`}>
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">2</span>
            <span>Suspects & Narrative</span>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold ${step >= 3 ? 'bg-blue-950/60 border border-blue-800 text-blue-300' : 'text-slate-500'}`}>
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">3</span>
            <span>Evidence & AI Triage</span>
          </div>
        </div>
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: CATEGORY, PLATFORM & DISTRICT */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Step 1: What type of incident occurred?</h2>
            <p className="text-xs text-slate-400">Select the primary threat vector to route your report to the appropriate CERT triage specialist.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCategory(c.label)}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  category === c.label
                    ? 'bg-blue-950/70 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-sm font-bold text-white">{c.label}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{c.desc}</p>
                {category === c.label && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 absolute top-3 right-3" />
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Affected Platform / Telecom / Bank <span className="text-red-400">*</span>
              </label>
              <select
                value={affectedPlatform}
                onChange={(e) => setAffectedPlatform(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="MTN Mobile Money">MTN Mobile Money (*165#)</option>
                <option value="Airtel Money">Airtel Money (*185#)</option>
                <option value="Centenary Bank (CenteMobile)">Centenary Bank (CenteMobile)</option>
                <option value="Stanbic Bank Uganda">Stanbic Bank Uganda</option>
                <option value="Absa Bank Uganda">Absa Bank Uganda</option>
                <option value="DFCU Bank">DFCU Bank</option>
                <option value="WhatsApp / SMS">WhatsApp / SMS Gateway</option>
                <option value="Uganda Revenue Authority (URA) e-Tax">URA e-Tax Portal</option>
                <option value="Enterprise / Windows Server">Enterprise / Clinic Server</option>
                <option value="Other Financial Service">Other Financial Institution</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                District in Uganda <span className="text-red-400">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {UGANDA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-950"
            >
              <span>Continue to Suspect & Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SUSPECT & DETAILS */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Step 2: Suspect Identifiers & What Happened</h2>
              <p className="text-xs text-slate-400">Provide details on the numbers, links, or accounts used by the perpetrator.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
              {category}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Incident Title / Summary Headline
              </label>
              <input
                type="text"
                placeholder="e.g. Fraudulent SMS claiming school fee reversal on MoMo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Suspect Identifiers adder */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Suspect Phone Numbers, Malicious URLs, or SMS Sender IDs
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. +256 772 491 820 or ura-fake-tax.net"
                  value={suspectInput}
                  onChange={(e) => setSuspectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSuspect();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSuspect}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  Add IOC
                </button>
              </div>

              {/* Tags of added suspects */}
              {suspectIdentifiers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {suspectIdentifiers.map((s, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSuspect(s)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estimated Financial Loss (in UGX)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">UGX</span>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="0"
                    value={estimatedLossUGX}
                    onChange={(e) => setEstimatedLossUGX(e.target.value)}
                    className="w-full pl-12 pr-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Severity Assessment
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Low">Low - Informational or failed attempt</option>
                  <option value="Medium">Medium - Targeted contact, no confirmed loss</option>
                  <option value="High">High - Financial theft or compromised credentials</option>
                  <option value="Critical">Critical - Active ongoing breach or enterprise paralysis</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Detailed Incident Narrative <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Describe exactly what happened: how the scammer reached you, what instructions were given, USSD codes dialed, or links clicked..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => {
                if (!description.trim()) {
                  setFormError('Please enter a description of the incident before proceeding.');
                  return;
                }
                setFormError(null);
                setStep(3);
                handleRunAiPreTriage();
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-950"
            >
              <span>Next: AI Triage & Evidence</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EVIDENCE & AI TRIAGE PREVIEW */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Step 3: Evidence & AI Threat Triage</h2>
              <p className="text-xs text-slate-400">Review AI classification and attach screenshots or SMS evidence.</p>
            </div>
            <button
              type="button"
              onClick={handleRunAiPreTriage}
              disabled={isAiTriaging}
              className="text-xs px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAiTriaging ? 'Analyzing...' : 'Re-run AI Analysis'}</span>
            </button>
          </div>

          {/* AI Triage Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  UG-CERT Automated Gemini Triage Appraisal
                </span>
              </div>
              {aiPreview && (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                    Threat Score: <strong className="text-cyan-400">{aiPreview.threatScore}/100</strong>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    aiPreview.severityRating === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800' :
                    aiPreview.severityRating === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {aiPreview.severityRating} Severity
                  </span>
                </div>
              )}
            </div>

            {isAiTriaging ? (
              <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <span className="text-xs">Classifying threat vectors and mapping MITRE TTPs...</span>
              </div>
            ) : aiPreview ? (
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-400 uppercase text-[10px] mb-1">Forensic Summary:</h4>
                  <p className="text-slate-200 leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {aiPreview.executiveSummary}
                  </p>
                </div>

                {aiPreview.detectedTTPs && aiPreview.detectedTTPs.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-400 uppercase text-[10px] mb-1">Detected Tactics & Techniques (TTPs):</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {aiPreview.detectedTTPs.map((ttp, idx) => (
                        <span key={idx} className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px]">
                          {ttp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {aiPreview.victimImmediateDefense && aiPreview.victimImmediateDefense.length > 0 && (
                  <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg">
                    <h4 className="font-bold text-cyan-300 uppercase text-[10px] mb-1 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                      Immediate Defense Guidance for Citizen:
                    </h4>
                    <ul className="space-y-1">
                      {aiPreview.victimImmediateDefense.map((stepItem, i) => (
                        <li key={i} className="text-cyan-100 flex items-start gap-1.5">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{stepItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiPreview.ugandaLegalContext && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                    <strong className="text-slate-300">Applicable Uganda Law: </strong>
                    {aiPreview.ugandaLegalContext}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Click &quot;Re-run AI Analysis&quot; to inspect this report against national scam signatures.
              </p>
            )}
          </div>

          {/* Evidence Attachments Upload Simulation */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attach Evidence Files (Screenshots, PDF Bank Statements, SMS Logs)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-4 text-center bg-slate-950/40 transition">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium">Click to select files or drag screenshots here</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Files are cryptographically hashed (SHA-256) for evidence integrity</p>
              <input
                type="file"
                onChange={handleSimulateUpload}
                className="mt-2 text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                    <span className="text-slate-300 font-mono">{f.name} ({f.size})</span>
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <FileCheck className="w-3.5 h-3.5" /> Attached
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anonymity & Data Protection Act Notice */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <input
                id="anonymous-toggle"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-700 bg-slate-900 focus:ring-blue-500"
              />
              <label htmlFor="anonymous-toggle" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-bold text-white block">Submit Anonymously</span>
                <span>
                  Under the <strong>Uganda Data Protection and Privacy Act 2019</strong>, you may submit without revealing your identity. If unchecked, police investigators may contact you for formal testimony.
                </span>
              </label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Mukasa"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+256 7..."
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-950 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting to UG-CERT...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>File Official Incident Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUBMISSION CONFIRMATION & RECEIPT */}
      {step === 4 && submittedIncident && (
        <div className="bg-slate-900 border border-emerald-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 shadow-lg shadow-emerald-950/40">
                <img 
                  src="/assets/aistudio/ASSOCIATIOON_BUD_DON_E_8a09b5f8.jpg" 
                  alt="CyberTrin Uganda Official Badge" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800">
              Report Successfully Logged with CyberTrin Uganda
            </span>
            <h2 className="text-2xl font-black text-white">Incident Tracking Reference</h2>
            <div className="inline-block bg-slate-950 px-6 py-3 rounded-2xl border border-slate-700 font-mono text-xl font-bold text-cyan-400 shadow-inner">
              {submittedIncident.referenceNumber}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please save this tracking reference for police CID follow-up, telecom provider inquiries, and emergency desk contact (+256 772590517).
            </p>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Category</span>
              <span className="font-semibold text-white">{submittedIncident.incidentCategory}</span>
            </div>
            <div>
              <span className="text-slate-500 block">District</span>
              <span className="font-semibold text-white">{submittedIncident.district} ({submittedIncident.region})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Initial Status</span>
              <span className="font-semibold text-amber-400">{submittedIncident.status}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Reported At</span>
              <span className="font-semibold text-white">{submittedIncident.reportedAt}</span>
            </div>
          </div>

          {/* Emergency Action Checklist */}
          <div className="bg-blue-950/40 border border-blue-900 p-4 rounded-xl space-y-2 text-xs">
            <h3 className="font-bold text-blue-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-400" />
                What to do right now (Emergency Action Checklist):
              </span>
              <span className="text-amber-300 font-bold">Hotline: +256 772590517</span>
            </h3>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span><strong>Emergency Cyber Hotline:</strong> Call <strong>+256 772590517</strong> immediately if you need urgent triage assistance or active asset freeze.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span><strong>Change Mobile Money PIN:</strong> Dial *165# (MTN) or *185# (Airtel) from your handset to immediately secure your account.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span><strong>Keep Screenshots:</strong> Do not delete suspect SMS or WhatsApp messages; they serve as digital evidence under Section 8 of the Electronic Transactions Act.</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Submit Another Report
            </button>

            {onViewWorkbench && (
              <button
                onClick={onViewWorkbench}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-950"
              >
                <span>View in Analyst Triage Queue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
