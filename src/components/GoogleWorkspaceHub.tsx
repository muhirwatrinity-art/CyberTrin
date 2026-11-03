import React, { useState, useEffect } from 'react';
import { 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken, 
  initAuth 
} from '../services/googleAuth.ts';
import { 
  fetchRecentEmails, 
  sendEmailAlert, 
  createIncidentDossierDoc, 
  exportToGoogleSheet, 
  fetchChatSpaces, 
  postChatMessage,
  GmailMessageItem,
  ChatSpaceItem
} from '../services/workspaceServices.ts';
import { IncidentReport, ThreatIndicator } from '../types.ts';
import { 
  Mail, 
  FileText, 
  FileSpreadsheet, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  RefreshCw, 
  LogOut, 
  Plus, 
  Lock 
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleWorkspaceHubProps {
  incidents: IncidentReport[];
  indicators: ThreatIndicator[];
  onScanEmailSnippet?: (text: string, sender: string) => void;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  incidents,
  indicators,
  onScanEmailSnippet
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'gmail' | 'docs' | 'sheets' | 'chat'>('gmail');

  // Gmail State
  const [emails, setEmails] = useState<GmailMessageItem[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [emailSearchQuery, setEmailSearchQuery] = useState('label:INBOX');
  const [sendToEmail, setSendToEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Docs State
  const [selectedIncidentForDoc, setSelectedIncidentForDoc] = useState<string>(incidents[0]?.id || '');
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);

  // Sheets State
  const [exportingSheet, setExportingSheet] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  // Chat State
  const [chatSpaces, setChatSpaces] = useState<ChatSpaceItem[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [chatMessageText, setChatMessageText] = useState(
    '🚨 [CyberTrin Uganda Alert] Urgent: New smishing campaign targeting MoMo agents detected in Kampala. Verify indicators at CyberTrin Uganda.'
  );
  const [sendingChat, setSendingChat] = useState(false);

  // Status Notification
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Confirmation Modal State (Mandatory for mutating Workspace actions)
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmAction: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setActionError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setActionSuccess(`Signed in successfully as ${res.user.email}`);
      }
    } catch (err: any) {
      setActionError(err.message || 'Google authentication failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setToken(null);
    setEmails([]);
    setChatSpaces([]);
    setActionSuccess('Signed out of Google Workspace.');
  };

  // 1. Gmail actions
  const loadEmails = async () => {
    if (!token) return;
    setLoadingEmails(true);
    setActionError(null);
    try {
      const list = await fetchRecentEmails(token, emailSearchQuery);
      setEmails(list);
    } catch (err: any) {
      setActionError(err.message || 'Could not fetch Gmail messages');
    } finally {
      setLoadingEmails(false);
    }
  };

  const triggerSendEmail = () => {
    if (!sendToEmail || !emailSubject || !emailBody) {
      setActionError('Please complete recipient email, subject, and message body.');
      return;
    }

    setConfirmationDialog({
      isOpen: true,
      title: 'Send Official Advisory Email via Gmail?',
      description: `This will send an email from your authorized Gmail account (${user?.email}) to "${sendToEmail}" with subject "${emailSubject}".`,
      confirmAction: async () => {
        if (!token) return;
        setIsSendingEmail(true);
        setActionError(null);
        try {
          await sendEmailAlert(token, sendToEmail, emailSubject, emailBody);
          setActionSuccess(`Email sent successfully to ${sendToEmail}`);
          setSendToEmail('');
          setEmailSubject('');
          setEmailBody('');
        } catch (err: any) {
          setActionError(err.message || 'Failed to send email');
        } finally {
          setIsSendingEmail(false);
        }
      }
    });
  };

  // 2. Google Docs actions
  const triggerCreateDoc = () => {
    const inc = incidents.find(i => i.id === selectedIncidentForDoc) || incidents[0];
    if (!inc) return;

    setConfirmationDialog({
      isOpen: true,
      title: 'Create Investigation Case Dossier in Google Docs?',
      description: `This will create a new Google Doc titled "CyberTrin Uganda - Investigation Case Dossier [${inc.referenceNumber}]" in your Google Drive with full forensic findings, suspect IOCs, and police CID statements.`,
      confirmAction: async () => {
        if (!token) return;
        setCreatingDoc(true);
        setActionError(null);
        try {
          const res = await createIncidentDossierDoc(token, inc);
          setCreatedDocUrl(res.documentUrl);
          setActionSuccess(`Google Doc created: [${inc.referenceNumber}] Case Dossier`);
        } catch (err: any) {
          setActionError(err.message || 'Failed to generate Google Doc');
        } finally {
          setCreatingDoc(false);
        }
      }
    });
  };

  // 3. Google Sheets actions
  const triggerExportSheet = () => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Export Telemetry Database to Google Sheets?',
      description: `This will create a new Google Spreadsheet in your Google Drive with 2 tabs ("Incidents" with ${incidents.length} records and "Threat Indicators" with ${indicators.length} IOCs).`,
      confirmAction: async () => {
        if (!token) return;
        setExportingSheet(true);
        setActionError(null);
        try {
          const res = await exportToGoogleSheet(token, incidents, indicators);
          setCreatedSheetUrl(res.spreadsheetUrl);
          setActionSuccess('Threat telemetry exported successfully to Google Sheets');
        } catch (err: any) {
          setActionError(err.message || 'Failed to export to Google Sheets');
        } finally {
          setExportingSheet(false);
        }
      }
    });
  };

  // 4. Google Chat actions
  const loadChatSpaces = async () => {
    if (!token) return;
    setLoadingSpaces(true);
    setActionError(null);
    try {
      const list = await fetchChatSpaces(token);
      setChatSpaces(list);
      if (list.length > 0 && !selectedSpace) {
        setSelectedSpace(list[0].name);
      }
    } catch (err: any) {
      setActionError(err.message || 'Could not fetch Google Chat spaces');
    } finally {
      setLoadingSpaces(false);
    }
  };

  const triggerPostChat = () => {
    if (!selectedSpace || !chatMessageText.trim()) {
      setActionError('Please select a Google Chat space and enter your alert message.');
      return;
    }

    const spaceObj = chatSpaces.find(s => s.name === selectedSpace);
    const spaceDisplay = spaceObj?.displayName || selectedSpace;

    setConfirmationDialog({
      isOpen: true,
      title: 'Broadcast Alert to Google Chat Space?',
      description: `This will post a real-time cybersecurity alert message into the Google Chat space "${spaceDisplay}" on behalf of ${user?.email}.`,
      confirmAction: async () => {
        if (!token) return;
        setSendingChat(true);
        setActionError(null);
        try {
          await postChatMessage(token, selectedSpace, chatMessageText);
          setActionSuccess(`Alert posted to Google Chat space "${spaceDisplay}"`);
        } catch (err: any) {
          setActionError(err.message || 'Failed to send message to Google Chat');
        } finally {
          setSendingChat(false);
        }
      }
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-bold uppercase tracking-wider">
              Google Workspace Suite
            </span>
            <span className="text-xs text-slate-400">Gmail • Docs • Sheets • Chat Integration</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            CyberTrin Workspace Operations
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Synchronize cybersecurity intelligence, draft police case dossiers in Google Docs, export live spreadsheets, and broadcast incident alerts to Google Chat and Gmail.
          </p>
        </div>

        {/* Auth State Button */}
        <div>
          {user ? (
            <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-blue-400" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left text-xs">
                <div className="font-bold text-white leading-tight">{user.displayName || 'Google User'}</div>
                <div className="text-[11px] text-slate-400">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 transition ml-2"
                title="Sign out of Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2.5 border border-slate-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border-b border-emerald-900/60 text-emerald-300 text-xs flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-950/40 border-b border-red-900/60 text-red-300 text-xs flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Workspace App Sub-Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 pt-2">
        <button
          onClick={() => { setActiveTab('gmail'); if (token && emails.length === 0) loadEmails(); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'gmail'
              ? 'bg-slate-900 text-red-400 border-red-500'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Gmail Scanner & Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'docs'
              ? 'bg-slate-900 text-blue-400 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Google Docs Case Dossiers</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'sheets'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Sheets Telemetry</span>
        </button>

        <button
          onClick={() => { setActiveTab('chat'); if (token && chatSpaces.length === 0) loadChatSpaces(); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'chat'
              ? 'bg-slate-900 text-teal-400 border-teal-500'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Google Chat War Rooms</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {!token ? (
          <div className="p-12 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Workspace Authentication Required</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Authenticate with your Google account with permission to access Gmail, Google Docs, Google Sheets, and Google Chat.
              </p>
            </div>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition inline-flex items-center gap-2"
            >
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          <div>
            
            {/* 1. GMAIL TAB */}
            {activeTab === 'gmail' && (
              <div className="space-y-6">
                
                {/* Search & Fetch Emails */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex-1 w-full flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Gmail search query (e.g. label:INBOX or scam or URA)"
                      value={emailSearchQuery}
                      onChange={(e) => setEmailSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <button
                      onClick={loadEmails}
                      disabled={loadingEmails}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition shrink-0 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingEmails ? 'animate-spin' : ''}`} />
                      <span>{loadingEmails ? 'Fetching...' : 'Fetch Inbox'}</span>
                    </button>
                  </div>
                </div>

                {/* Email List */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recent Inbox Messages for Phishing Inspection ({emails.length})
                  </div>

                  {emails.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                      Click &ldquo;Fetch Inbox&rdquo; to inspect recent emails for phishing indicators or tax lures.
                    </div>
                  ) : (
                    emails.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white line-clamp-1">{msg.subject}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{msg.date}</span>
                          </div>
                          <div className="text-[11px] text-cyan-300 font-mono">From: {msg.sender}</div>
                          <p className="text-slate-400 text-xs line-clamp-1 italic">
                            &ldquo;{msg.snippet}&rdquo;
                          </p>
                        </div>

                        {onScanEmailSnippet && (
                          <button
                            onClick={() => onScanEmailSnippet(msg.snippet || msg.subject || '', msg.sender || '')}
                            className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-semibold rounded-lg transition shrink-0 flex items-center gap-1 text-xs self-start md:self-auto"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Scan with Gemini</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Compose & Send Email Alert */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-400" />
                    Send Official Incident Receipt or Advisory via Gmail
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Recipient Email *</label>
                      <input
                        type="email"
                        placeholder="recipient@example.com"
                        value={sendToEmail}
                        onChange={(e) => setSendToEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Email Subject *</label>
                      <input
                        type="text"
                        placeholder="[CyberTrin Uganda] Security Advisory / Case Notice"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-xs">Message Content *</label>
                    <textarea
                      rows={3}
                      placeholder="Write your official advisory statement or emergency instructions..."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={triggerSendEmail}
                      disabled={isSendingEmail}
                      className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingEmail ? 'Sending...' : 'Send Email via Gmail'}</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* 2. GOOGLE DOCS TAB */}
            {activeTab === 'docs' && (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Export Formal Investigation Dossier to Google Docs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generates a formal, printable case dossier in Google Docs formatted with incident reference codes, forensic classification, suspect indicators, and statutory compliance clauses for submission to the Uganda Police Cybercrime Division (CID Kibuli).
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Select Incident to Export:
                  </label>
                  <select
                    value={selectedIncidentForDoc}
                    onChange={(e) => setSelectedIncidentForDoc(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    {incidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {inc.referenceNumber} • {inc.title} ({inc.district} - {inc.severity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={triggerCreateDoc}
                    disabled={creatingDoc}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{creatingDoc ? 'Generating Document...' : 'Generate Google Doc Dossier'}</span>
                  </button>

                  {createdDocUrl && (
                    <a
                      href={createdDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Document in Google Docs</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 3. GOOGLE SHEETS TAB */}
            {activeTab === 'sheets' && (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Export National Threat Telemetry to Google Sheets
                  </h3>
                  <p className="text-xs text-slate-400">
                    Creates an active Google Spreadsheet containing two synchronized sheets: <strong>&quot;Incidents&quot;</strong> ({incidents.length} records) and <strong>&quot;Threat Indicators (IOCs)&quot;</strong> ({indicators.length} records) for tabular analysis and reporting.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Sheet 1: Incidents</span>
                    <strong className="text-white">{incidents.length} rows with financial loss & districts</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sheet 2: Threat Indicators</span>
                    <strong className="text-white">{indicators.length} phone numbers, domains, & SMS senders</strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={triggerExportSheet}
                    disabled={exportingSheet}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{exportingSheet ? 'Creating Sheet...' : 'Export to Google Sheets'}</span>
                  </button>

                  {createdSheetUrl && (
                    <a
                      href={createdSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Spreadsheet in Google Sheets</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 4. GOOGLE CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Broadcast Threat Alerts to Google Chat Spaces
                  </h3>
                  <p className="text-xs text-slate-400">
                    Post real-time incident warnings and IOC alerts directly into your organization&apos;s Google Chat rooms and security incident channels.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Select Target Google Chat Space:
                    </label>
                    <button
                      onClick={loadChatSpaces}
                      disabled={loadingSpaces}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingSpaces ? 'animate-spin' : ''}`} />
                      <span>Refresh Spaces</span>
                    </button>
                  </div>

                  {chatSpaces.length === 0 ? (
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400">
                      No Google Chat spaces found or loaded. Click &ldquo;Refresh Spaces&rdquo; to query spaces accessible by your account.
                    </div>
                  ) : (
                    <select
                      value={selectedSpace}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      {chatSpaces.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.displayName} ({s.name})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Alert Message Content:
                  </label>
                  <textarea
                    rows={3}
                    value={chatMessageText}
                    onChange={(e) => setChatMessageText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white resize-none"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    onClick={triggerPostChat}
                    disabled={sendingChat || !selectedSpace}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{sendingChat ? 'Posting...' : 'Broadcast to Google Chat'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Mandatory User Confirmation Dialog */}
      {confirmationDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{confirmationDialog.title}</h3>
                <span className="text-[10px] text-slate-400">Explicit User Confirmation Required</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmationDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setConfirmationDialog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const act = confirmationDialog.confirmAction;
                  setConfirmationDialog(null);
                  await act();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                Confirm &amp; Proceed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
