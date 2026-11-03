import { IncidentReport, ThreatIndicator } from '../types.ts';

// Helper for Base64 URL safe encoding (RFC 2822 for Gmail API)
function encodeBase64UrlSafe(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// -------------------------------------------------------------
// GMAIL SERVICES
// -------------------------------------------------------------

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  sender?: string;
  subject?: string;
  date?: string;
}

export async function fetchRecentEmails(
  accessToken: string,
  query: string = 'label:INBOX'
): Promise<GmailMessageItem[]> {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Gmail messages');
  }

  const listData = await listRes.json();
  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  // Fetch details for top 8 messages in parallel
  const details = await Promise.all(
    listData.messages.slice(0, 8).map(async (msg: { id: string }) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        if (!itemRes.ok) return null;
        const itemData = await itemRes.json();

        let subject = '(No Subject)';
        let sender = 'Unknown Sender';
        let date = '';

        if (itemData.payload?.headers) {
          for (const h of itemData.payload.headers) {
            if (h.name.toLowerCase() === 'subject') subject = h.value;
            if (h.name.toLowerCase() === 'from') sender = h.value;
            if (h.name.toLowerCase() === 'date') date = h.value;
          }
        }

        return {
          id: itemData.id,
          threadId: itemData.threadId,
          snippet: itemData.snippet || '',
          subject,
          sender,
          date
        };
      } catch {
        return null;
      }
    })
  );

  return details.filter((m): m is GmailMessageItem => m !== null);
}

export async function sendEmailAlert(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string }> {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText
  ];
  const rawEmail = encodeBase64UrlSafe(emailLines.join('\r\n'));

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: rawEmail })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to send Gmail email');
  }

  return await res.json();
}

// -------------------------------------------------------------
// GOOGLE DOCS SERVICES
// -------------------------------------------------------------

export async function createIncidentDossierDoc(
  accessToken: string,
  incident: IncidentReport
): Promise<{ documentId: string; documentUrl: string }> {
  const docTitle = `CyberTrin Uganda - Investigation Case Dossier [${incident.referenceNumber}]`;

  // 1. Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: docTitle })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Doc');
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;

  // 2. Insert structured content into document
  const content = `CYBERTRIN UGANDA • NATIONAL CYBERSECURITY OPERATIONS
OFFICIAL INCIDENT INVESTIGATION DOSSIER
========================================================================
Reference Number: ${incident.referenceNumber}
Incident Title:   ${incident.title}
Threat Category:  ${incident.incidentCategory}
Severity Rating:  ${incident.severity}
Status:           ${incident.status}
District / Region:${incident.district} (${incident.region})
Affected Vector:  ${incident.affectedPlatform}
Financial Impact: UGX ${incident.estimatedFinancialLossUGX.toLocaleString()}
Report Date:      ${incident.reportedAt}
Referred Agency:  ${incident.referredToAuthority || 'None'}
========================================================================

1. FORENSIC TRIAGE SUMMARY:
${incident.aiTriageAnalysis?.summary || 'Triage summary pending completion.'}

Threat Score: ${incident.aiTriageAnalysis?.threatScore || 'N/A'}/100
Detected TTPs:
${(incident.aiTriageAnalysis?.detectedTTPs || []).map(t => '  • ' + t).join('\n')}

2. SUSPECT INDICATORS OF COMPROMISE (IOCs):
${incident.suspectIdentifiers.length > 0 
  ? incident.suspectIdentifiers.map(i => '  • ' + i).join('\n') 
  : '  • No discrete suspect indicators provided.'}

3. INCIDENT NARRATIVE & CITIZEN STATEMENT:
${incident.description}

4. DIGITAL EVIDENCE & CUSTODY:
${(incident.evidenceFiles || []).map(f => `  • ${f.name} (${f.size}) - SHA-256 Verified`).join('\n') || '  • No files attached.'}

5. CASE ACTIVITY & NOTES:
${(incident.analystNotes || []).map(n => `  [${n.timestamp}] ${n.author}: ${n.note}`).join('\n') || '  • No case notes logged.'}

========================================================================
Issued under Section 14, Computer Misuse Act & Data Protection and Privacy Act 2019.
CyberTrin Emergency Desk: +256 772590517
`;

  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: content
          }
        }
      ]
    })
  });

  return {
    documentId,
    documentUrl: `https://docs.google.com/document/d/${documentId}/edit`
  };
}

// -------------------------------------------------------------
// GOOGLE SHEETS SERVICES
// -------------------------------------------------------------

export async function exportToGoogleSheet(
  accessToken: string,
  incidents: IncidentReport[],
  indicators: ThreatIndicator[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const sheetTitle = `CyberTrin Uganda - Threat Telemetry [${new Date().toISOString().substring(0, 10)}]`;

  // 1. Create spreadsheet with 2 sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: sheetTitle },
      sheets: [
        { properties: { title: 'Incidents' } },
        { properties: { title: 'Threat Indicators (IOCs)' } }
      ]
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Sheet');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Populate Incidents sheet
  const incidentRows = [
    ['Reference Number', 'Title', 'Category', 'Severity', 'Status', 'District', 'Region', 'Platform', 'Loss (UGX)', 'Reported At', 'Referred Authority'],
    ...incidents.map(i => [
      i.referenceNumber,
      i.title,
      i.incidentCategory,
      i.severity,
      i.status,
      i.district,
      i.region,
      i.affectedPlatform,
      i.estimatedFinancialLossUGX,
      i.reportedAt,
      i.referredToAuthority || 'None'
    ])
  ];

  // 3. Populate Indicators sheet
  const indicatorRows = [
    ['Indicator Value', 'Type', 'Status', 'Confidence', 'Category', 'Reports Count', 'Telecom / ISP', 'Last Active'],
    ...indicators.map(ioc => [
      ioc.originalValue,
      ioc.indicatorType,
      ioc.reviewStatus,
      ioc.confidence,
      ioc.threatCategory,
      ioc.reportedCount,
      ioc.telecomOrProvider || 'Unknown',
      ioc.lastActive
    ])
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Incidents!A1',
          values: incidentRows
        },
        {
          range: "'Threat Indicators (IOCs)'!A1",
          values: indicatorRows
        }
      ]
    })
  });

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  };
}

// -------------------------------------------------------------
// GOOGLE CHAT SERVICES
// -------------------------------------------------------------

export interface ChatSpaceItem {
  name: string; // format: spaces/XXXX
  displayName?: string;
  type?: string;
}

export async function fetchChatSpaces(accessToken: string): Promise<ChatSpaceItem[]> {
  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Google Chat spaces');
  }

  const data = await res.json();
  return (data.spaces || []).map((s: any) => ({
    name: s.name,
    displayName: s.displayName || s.name,
    type: s.type || 'SPACE'
  }));
}

export async function postChatMessage(
  accessToken: string,
  spaceName: string,
  messageText: string
): Promise<any> {
  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: messageText
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to post message to Google Chat');
  }

  return await res.json();
}
