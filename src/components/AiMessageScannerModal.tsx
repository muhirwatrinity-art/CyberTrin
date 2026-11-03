import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  PhoneCall, 
  ExternalLink 
} from 'lucide-react';

interface AiMessageScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportIncident?: (initialData: { description: string; suspect: string }) => void;
}

export const AiMessageScannerModal: React.FC<AiMessageScannerModalProps> = ({
  isOpen,
  onClose,
  onReportIncident
}) => {
  const [content, setContent] = useState('');
  const [senderId, setSenderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    verdict: string;
    riskScore: number;
    scamType: string;
    summaryPlainEnglish: string;
    localLanguageClues?: string;
    redFlagsDetected: string[];
    safeCitizenAction: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScan = async (overrideContent?: string, overrideSender?: string) => {
    const textToScan = overrideContent !== undefined ? overrideContent : content;
    const senderToScan = overrideSender !== undefined ? overrideSender : senderId;

    if (!textToScan.trim()) {
      setError('Please enter a message, SMS, or link to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/gemini/scan-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textToScan,
          senderId: senderToScan
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Analysis service temporarily unavailable');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to scan message. Please verify network connection.');
    } finally {
      setLoading(false);
    }
  };

  const sampleScenarios = [
    {
      label: 'MTN MoMo Reversal Fraud',
      sender: '+256708933114',
      text: 'Y\'ello! You have received UGX 850,000 from KASULE JOHN. Transaction ID: 10488291442. Balance: UGX 851,200. Please refund immediately to 0708933114, it was sent by mistake for school fees.'
    },
    {
      label: 'Fake URA Tax Refund Link',
      sender: 'UG-TAX-ALERT',
      text: 'URA NOTICE: Your TIN has been approved for 2026 Budget Tax Exemption refund of UGX 3,450,000. Claim within 12 hours at https://ura-etax-uganda-portal.net/refund before expiry.'
    },
    {
      label: 'WhatsApp 6-Digit Code Hijack',
      sender: '+256755102948',
      text: 'Hello chairperson, I accidentally sent my 6-digit WhatsApp registration code to your phone via SMS. Please forward it to me quickly so I can finish joining our SACCO meeting!'
    },
    {
      label: 'Legitimate Telecom Balance Check',
      sender: 'MTN-UGANDA',
      text: 'Y\'ello! Your bundle balance: 4.2GB valid until 12/11/2026. Dial *150*1# to buy more data or *165# for MoMo services. Thank you for using MTN.'
    }
  ];

  const handleUseSample = (sample: typeof sampleScenarios[0]) => {
    setContent(sample.text);
    setSenderId(sample.sender);
    handleScan(sample.text, sample.sender);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-400/30 bg-slate-950 shrink-0 shadow-md">
              <img 
                src="/assets/aistudio/ASSOCIATIOON_BUD_DON_E_8a09b5f8.jpg" 
                alt="CyberTrin Badge" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                CyberTrin Threat Scanner
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Gemini 3.8 Flash Heuristics
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Paste any suspicious SMS, WhatsApp message, email, or link for instant forensic scam detection
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Quick sample pills */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Try a real Ugandan scenario:
            </div>
            <div className="flex flex-wrap gap-2">
              {sampleScenarios.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUseSample(s)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sender Number, Handle, or SMS Header (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. +256 708 933 114, UG-MOMO, or unknown WhatsApp number"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Suspicious Message Content or Link <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Paste the exact text of the message, SMS, email, or suspicious URL here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none font-mono text-xs"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => handleScan()}
            disabled={loading || !content.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing against Ugandan fraud signatures...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Scan for Fraud & Phishing Indicators</span>
              </>
            )}
          </button>

          {/* Scan Results Display */}
          {result && (
            <div className="mt-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              
              {/* Verdict Banner */}
              <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                result.verdict === 'SCAM' 
                  ? 'bg-red-950/40 border-red-800 text-red-200' 
                  : result.verdict === 'SUSPICIOUS'
                  ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.verdict === 'SCAM' ? (
                    <ShieldAlert className="w-7 h-7 text-red-400 shrink-0 mt-0.5" />
                  ) : result.verdict === 'SUSPICIOUS' ? (
                    <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black tracking-wider text-base">
                        VERDICT: {result.verdict}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                        Risk Score: {result.riskScore}/100
                      </span>
                    </div>
                    <p className="text-xs font-semibold mt-0.5 text-slate-300">
                      Classification: {result.scamType}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(result.summaryPlainEnglish)}
                  className="text-xs p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 shrink-0"
                  title="Copy analysis"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Plain English Summary */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1">Forensic Analysis</h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                  {result.summaryPlainEnglish}
                </p>
              </div>

              {/* Ugandan Slang/Context Clues */}
              {result.localLanguageClues && (
                <div className="bg-amber-950/20 border border-amber-900/50 p-3 rounded-xl text-xs text-amber-200/90">
                  <span className="font-bold text-amber-300">Uganda Context / Tactics: </span>
                  {result.localLanguageClues}
                </div>
              )}

              {/* Red Flags */}
              {result.redFlagsDetected && result.redFlagsDetected.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">Red Flags Detected</h4>
                  <ul className="space-y-1.5">
                    {result.redFlagsDetected.map((flag, i) => (
                      <li key={i} className="text-xs text-red-300/90 flex items-start gap-2 bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-900/40">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Citizen Action Plan */}
              {result.safeCitizenAction && result.safeCitizenAction.length > 0 && (
                <div className="bg-cyan-950/30 border border-cyan-800/60 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Immediate Recommended Citizen Action:
                  </h4>
                  <ul className="space-y-1.5">
                    {result.safeCitizenAction.map((act, i) => (
                      <li key={i} className="text-xs text-cyan-100 flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">{i + 1}.</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Report button */}
              {result.verdict !== 'LIKELY SAFE' && onReportIncident && (
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      onReportIncident({
                        description: `Suspicious message scanned: "${content}"`,
                        suspect: senderId || 'Unknown sender'
                      });
                      onClose();
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-red-950/50"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>File Official Incident Report with this Evidence</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Emergency Reporting Hotline: <strong className="text-amber-300">+256 772590517</strong> (24/7)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
