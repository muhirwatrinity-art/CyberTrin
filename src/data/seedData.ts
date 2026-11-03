import { 
  IncidentReport, 
  ThreatIndicator, 
  SecurityAdvisory, 
  SchemaTable, 
  MethodologyPhase 
} from '../types.ts';

export const INITIAL_INDICATORS: ThreatIndicator[] = [
  {
    id: 'ioc-001',
    indicatorType: 'Phone Number',
    normalizedValue: '+256772491820',
    originalValue: '+256 772 491 820',
    reviewStatus: 'Verified Malicious',
    confidence: 0.98,
    threatCategory: 'Mobile Money & Financial Fraud',
    reportedCount: 47,
    firstDetected: '2026-10-12',
    lastActive: '2026-11-02',
    telecomOrProvider: 'MTN Uganda',
    description: 'Impersonating MTN MoMo Customer Care claiming false transactions and requesting PIN/OTP confirmation.',
    tags: ['MTN-MoMo', 'Social-Engineering', 'OTP-Theft', 'Kampala-Wakiso'],
    associatedIncidents: ['CGU-2026-1042', 'CGU-2026-1055']
  },
  {
    id: 'ioc-002',
    indicatorType: 'URL / Domain',
    normalizedValue: 'https://ura-etax-uganda-portal.net',
    originalValue: 'https://ura-etax-uganda-portal.net/login',
    reviewStatus: 'Verified Malicious',
    confidence: 0.99,
    threatCategory: 'Phishing & SMS Spoofing',
    reportedCount: 89,
    firstDetected: '2026-10-24',
    lastActive: '2026-11-03',
    telecomOrProvider: 'NameCheap / Hosted on Cloudflare',
    description: 'Clone of Uganda Revenue Authority (URA) web portal harvesting Tax Identification Numbers (TIN) and mobile money credentials.',
    tags: ['URA-Phishing', 'Tax-Refund-Scam', 'Credential-Harvester'],
    associatedIncidents: ['CGU-2026-1088', 'CGU-2026-1120']
  },
  {
    id: 'ioc-003',
    indicatorType: 'Phone Number',
    normalizedValue: '+256708933114',
    originalValue: '+256 708 933 114',
    reviewStatus: 'Verified Malicious',
    confidence: 0.94,
    threatCategory: 'Mobile Money & Financial Fraud',
    reportedCount: 31,
    firstDetected: '2026-10-19',
    lastActive: '2026-11-01',
    telecomOrProvider: 'Airtel Uganda',
    description: 'Fake transaction reversal fraud: Sends spoofed SMS stating "You have received UGX 450,000" then calls pleading for immediate refund.',
    tags: ['Airtel-Money', 'Reversal-Scam', 'Agent-Impersonation'],
    associatedIncidents: ['CGU-2026-1104']
  },
  {
    id: 'ioc-004',
    indicatorType: 'SMS Sender ID',
    normalizedValue: 'UG-MOMO-ALERT',
    originalValue: 'UG-MOMO-ALERT',
    reviewStatus: 'Verified Malicious',
    confidence: 0.96,
    threatCategory: 'Phishing & SMS Spoofing',
    reportedCount: 112,
    firstDetected: '2026-09-30',
    lastActive: '2026-11-02',
    telecomOrProvider: 'Aggregator SMS Route Spoof',
    description: 'Illicit SMS sender ID used to blast fake account suspension warnings directing victims to call fraudulent helpdesk lines.',
    tags: ['SMS-Spoofing', 'Smishing', 'Account-Suspension-Lure'],
    associatedIncidents: ['CGU-2026-1042', 'CGU-2026-1145']
  },
  {
    id: 'ioc-005',
    indicatorType: 'URL / Domain',
    normalizedValue: 'https://sacco-wealth-ug.com',
    originalValue: 'https://sacco-wealth-ug.com/invest',
    reviewStatus: 'Suspicious',
    confidence: 0.88,
    threatCategory: 'Fake SACCO & Investment Scam',
    reportedCount: 22,
    firstDetected: '2026-10-28',
    lastActive: '2026-11-03',
    telecomOrProvider: 'DigitalOcean Singapore',
    description: 'Unlicensed investment platform promising 45% weekly returns targeting WhatsApp SACCO groups in Jinja and Kampala.',
    tags: ['Fake-SACCO', 'Ponzi-Scheme', 'Crypto-Scam'],
    associatedIncidents: ['CGU-2026-1192']
  },
  {
    id: 'ioc-006',
    indicatorType: 'Phone Number',
    normalizedValue: '+256755102948',
    originalValue: '+256 755 102 948',
    reviewStatus: 'Suspicious',
    confidence: 0.79,
    threatCategory: 'SIM Swap & Telecom Fraud',
    reportedCount: 14,
    firstDetected: '2026-10-31',
    lastActive: '2026-11-02',
    telecomOrProvider: 'Airtel Uganda',
    description: 'Number reported for requesting unauthorized duplicate SIM swaps at regional service centres using forged national ID copies.',
    tags: ['SIM-Swap', 'Identity-Theft', 'Telecom-Fraud'],
    associatedIncidents: ['CGU-2026-1205']
  }
];

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'inc-1042',
    referenceNumber: 'CGU-2026-1042',
    title: 'MoMo Agent Reversal & PIN Theft Campaign',
    incidentCategory: 'Mobile Money & Financial Fraud',
    severity: 'High',
    status: 'Active Investigation',
    reportedAt: '2026-11-02 09:15',
    updatedAt: '2026-11-02 14:30',
    isAnonymous: false,
    reporter: {
      name: 'Sarah Namatovu',
      contact: '+256772110293',
      email: 's.namatovu@business.ug',
      district: 'Kampala'
    },
    district: 'Kampala',
    region: 'Central',
    affectedPlatform: 'MTN Mobile Money',
    suspectIdentifiers: ['+256 772 491 820', 'UG-MOMO-ALERT'],
    estimatedFinancialLossUGX: 1850000,
    description: 'Received SMS purporting to be from MTN MoMo confirming receipt of UGX 1,850,000. Immediately received a phone call from an emotional individual claiming it was school fees sent by mistake. While checking account status, caller instructed me to enter a code (*165*...) which actually triggered an agent cash-out withdrawal.',
    evidenceFiles: [
      { name: 'momo_sms_screenshot.png', type: 'image/png', size: '1.2 MB' },
      { name: 'call_log_record.pdf', type: 'application/pdf', size: '240 KB' }
    ],
    aiTriageAnalysis: {
      threatScore: 88,
      detectedTTPs: [
        'T1566: Phishing via SMS (Smishing)',
        'T1204: Social Engineering / Prompted PIN entry',
        'T1656: Impersonation of Family / School fee urgency'
      ],
      summary: 'High-confidence social engineering attack utilizing dual-channel pressure (fake balance SMS followed by urgent telephone plea). Target was tricked into initiating a cash-out authorization USSD sequence.',
      recommendedActions: [
        'Report suspect MSISDN +256772491820 to MTN Fraud Desk for immediate wallet blacklisting.',
        'File formal statement with Uganda Police Cybercrime Unit (CPS Kampala).',
        'Issue merchant advisory on USSD code verification discipline.'
      ],
      extractedIOCs: ['+256772491820', 'UG-MOMO-ALERT'],
      analyzedAt: '2026-11-02 09:17'
    },
    analystNotes: [
      {
        author: 'Capt. Jude Okello (UG-CERT)',
        timestamp: '2026-11-02 11:20',
        note: 'Escalated to MTN Uganda Fraud Risk Operations. MSISDN wallet freeze requested. Matched with 3 other reports in Nakasero/Kikuubo area.'
      }
    ],
    assignedAnalyst: 'Capt. Jude Okello (UG-CERT)',
    referredToAuthority: 'Uganda Police Cyber Unit'
  },
  {
    id: 'inc-1088',
    referenceNumber: 'CGU-2026-1088',
    title: 'Phishing Campaign: Fake URA E-Tax Exemption Portal',
    incidentCategory: 'Phishing & SMS Spoofing',
    severity: 'Critical',
    status: 'Under Review',
    reportedAt: '2026-11-02 18:40',
    updatedAt: '2026-11-03 08:10',
    isAnonymous: true,
    district: 'Wakiso',
    region: 'Central',
    affectedPlatform: 'Web & SMS Gateway',
    suspectIdentifiers: ['https://ura-etax-uganda-portal.net', '+256 701 445 119'],
    estimatedFinancialLossUGX: 0,
    description: 'Bulk SMS blasted across SME business owners in Kira and Entebbe: "URA ALERT: Your company TIN has a pending tax refund of UGX 4,200,000 under 2026 budget relief. Claim within 24h at ura-etax-uganda-portal.net". The link opens a pixel-perfect replica of the Uganda Revenue Authority web portal prompting for TIN, Director National ID, and MoMo authorization PIN.',
    evidenceFiles: [
      { name: 'ura_phishing_url_snapshot.jpg', type: 'image/jpeg', size: '2.1 MB' }
    ],
    aiTriageAnalysis: {
      threatScore: 96,
      detectedTTPs: [
        'T1566.002: Spearphishing Link targeting SME tax registrants',
        'T1600: National Brand Impersonation (URA)',
        'T1056: Input Capture / Credential Harvesting'
      ],
      summary: 'Critical-severity national brand impersonation campaign weaponizing official URA tax refund lures to harvest director identity credentials and financial PINs.',
      recommendedActions: [
        'Submit takedown request to domain registrar and upstream Cloudflare DNS.',
        'Issue urgent public alert via NITA-U and URA official Twitter/X and media channels.',
        'Inject domain into National Threat Indicators blocklist.'
      ],
      extractedIOCs: ['https://ura-etax-uganda-portal.net', '+256701445119'],
      analyzedAt: '2026-11-02 18:42'
    },
    analystNotes: [
      {
        author: 'Brenda Ainembabazi (Threat Intel Lead)',
        timestamp: '2026-11-03 08:30',
        note: 'Domain registrar contacted in Cayman Islands. Domain suspended pending investigation. Block rule deployed to telecom DNS resolvers.'
      }
    ],
    assignedAnalyst: 'Brenda Ainembabazi (Threat Intel Lead)',
    referredToAuthority: 'NITA-U CERT'
  },
  {
    id: 'inc-1150',
    referenceNumber: 'CGU-2026-1150',
    title: 'Ransomware Outbreak Targeting Mukono Community Clinic EMR',
    incidentCategory: 'Ransomware & Malware',
    severity: 'Critical',
    status: 'Active Investigation',
    reportedAt: '2026-11-01 16:20',
    updatedAt: '2026-11-02 17:00',
    isAnonymous: false,
    reporter: {
      name: 'Dr. Ronald Kasule',
      contact: '+256782334991',
      email: 'admin@mukonoclinic.org',
      district: 'Mukono'
    },
    district: 'Mukono',
    region: 'Central',
    affectedPlatform: 'Windows Server 2019 / Health Management App',
    suspectIdentifiers: ['clinic-decryptor-ug@onionmail.org', '185.220.101.5'],
    estimatedFinancialLossUGX: 12000000,
    description: 'All patient records and clinical databases were encrypted overnight with ".uglock" extension. Ransom note left on server desktop demanding 0.25 BTC (~UGX 38,000,000) within 72 hours. Medical staff currently resorting to paper triage; clinic operation severely impaired.',
    evidenceFiles: [
      { name: 'RANSOM_NOTE_README.txt', type: 'text/plain', size: '4 KB' },
      { name: 'encrypted_sample.uglock', type: 'application/octet-stream', size: '512 KB' }
    ],
    aiTriageAnalysis: {
      threatScore: 94,
      detectedTTPs: [
        'T1486: Data Encrypted for Impact',
        'T1190: Exploit Public-Facing Application (Unpatched RDP port 3389)',
        'T1490: Inhibit System Recovery (Volume Shadow Copies deleted)'
      ],
      summary: 'Critical healthcare sector ransomware incident. Ingress vector appears to be exposed Remote Desktop Protocol (RDP) on default port with brute-forced administrator credentials.',
      recommendedActions: [
        'Sever internet uplink immediately to halt lateral spread to lab equipment.',
        'DO NOT pay ransom. Advise on air-gapped backup retrieval.',
        'Dispatch UG-CERT emergency incident response unit for memory dump.'
      ],
      extractedIOCs: ['185.220.101.5', 'clinic-decryptor-ug@onionmail.org'],
      analyzedAt: '2026-11-01 16:25'
    },
    analystNotes: [
      {
        author: 'Emmanuel Otim (Forensic Engineer)',
        timestamp: '2026-11-02 10:00',
        note: 'Offline backup from 5 days prior identified intact on disconnected NAS. Restoration procedure initiated. RDP firewall rules enforced.'
      }
    ],
    assignedAnalyst: 'Emmanuel Otim (Forensic Engineer)',
    referredToAuthority: 'Uganda Police Cyber Unit'
  },
  {
    id: 'inc-1192',
    referenceNumber: 'CGU-2026-1192',
    title: 'WhatsApp Group Admin Takeover & Fake SACCO Ponzi',
    incidentCategory: 'Fake SACCO & Investment Scam',
    severity: 'Medium',
    status: 'Mitigated',
    reportedAt: '2026-10-30 11:00',
    updatedAt: '2026-11-01 15:45',
    isAnonymous: false,
    reporter: {
      name: 'Grace Akello',
      contact: '+256774902118',
      district: 'Jinja'
    },
    district: 'Jinja',
    region: 'Eastern',
    affectedPlatform: 'WhatsApp / Web',
    suspectIdentifiers: ['https://sacco-wealth-ug.com', '+256 752 901 882'],
    estimatedFinancialLossUGX: 3400000,
    description: 'Perpetrators compromised the WhatsApp account of a respected SACCO chairperson using 6-digit SMS verification social engineering. They subsequently announced an "Emergency High-Yield Development Dividend" instructing members to deposit funds via Airtel Money to an unverified proxy number.',
    evidenceFiles: [
      { name: 'whatsapp_chat_evidence.pdf', type: 'application/pdf', size: '3.4 MB' }
    ],
    aiTriageAnalysis: {
      threatScore: 72,
      detectedTTPs: [
        'T1586: Compromised Social Account',
        'T1656: Impersonation of Community Leadership',
        'T1499: Ponzi Financial Solicitation'
      ],
      summary: 'Account hijacking followed by community trust exploitation. Victim network targeted via legitimate chairperson profile.',
      recommendedActions: [
        'Help administrator activate WhatsApp 2-Step Verification with PIN.',
        'Notify Airtel Uganda Fraud Desk to flag receiving merchant wallet.',
        'Publish SACCO community advisory in Busoga region.'
      ],
      extractedIOCs: ['https://sacco-wealth-ug.com', '+256752901882'],
      analyzedAt: '2026-10-30 11:04'
    },
    analystNotes: [
      {
        author: 'Brenda Ainembabazi (Threat Intel Lead)',
        timestamp: '2026-11-01 12:00',
        note: 'Admin account recovered via telecom SIM reset with proper identity verification. Warning broadcasted to SACCO union.'
      }
    ],
    assignedAnalyst: 'Brenda Ainembabazi (Threat Intel Lead)',
    referredToAuthority: 'None'
  },
  {
    id: 'inc-1205',
    referenceNumber: 'CGU-2026-1205',
    title: 'Fraudulent SIM Swap & Mobile Banking Drain in Gulu',
    incidentCategory: 'SIM Swap & Telecom Fraud',
    severity: 'High',
    status: 'Active Investigation',
    reportedAt: '2026-10-29 14:10',
    updatedAt: '2026-10-31 09:20',
    isAnonymous: false,
    reporter: {
      name: 'Geoffrey Odong',
      contact: '+256783119044',
      district: 'Gulu'
    },
    district: 'Gulu',
    region: 'Northern',
    affectedPlatform: 'Airtel Uganda / Centenary Bank App',
    suspectIdentifiers: ['+256 755 102 948'],
    estimatedFinancialLossUGX: 5200000,
    description: 'Phone suddenly lost all cellular connectivity (Emergency Calls Only). Within 20 minutes, attacker performed unauthorized password reset on Centenary Mobile Banking and drained UGX 5,200,000 via mobile money wallet transfer to multiple secondary accounts.',
    evidenceFiles: [
      { name: 'bank_statement_extract.pdf', type: 'application/pdf', size: '620 KB' }
    ],
    aiTriageAnalysis: {
      threatScore: 85,
      detectedTTPs: [
        'T1659: SIM Swap Execution via Social Engineering / Insider assistance',
        'T1539: Steal Web Session / Financial Authorization Bypass'
      ],
      summary: 'SIM swap attack targeting high-net-worth mobile banking account. Speed of execution suggests pre-acquired victim identity documents.',
      recommendedActions: [
        'Request telecom audit trail for the agent/shop where SIM swap was processed.',
        'Engage Centenary Bank Fraud Unit to trace destination wallets.',
        'File report under Section 19 of Computer Misuse Act 2022.'
      ],
      extractedIOCs: ['+256755102948'],
      analyzedAt: '2026-10-29 14:15'
    },
    analystNotes: [
      {
        author: 'Capt. Jude Okello (UG-CERT)',
        timestamp: '2026-10-30 15:00',
        note: 'Police CID Northern Region notified. Telecom store agent in Gulu town under questioning regarding KYC bypass.'
      }
    ],
    assignedAnalyst: 'Capt. Jude Okello (UG-CERT)',
    referredToAuthority: 'Uganda Police Cyber Unit'
  }
];

export const INITIAL_ADVISORIES: SecurityAdvisory[] = [
  {
    id: 'adv-001',
    title: 'Urgent Advisory: URA E-Tax SMS Phishing & Credential Harvest Lures',
    severity: 'Critical',
    targetSector: 'SMEs',
    summary: 'A wide-scale smishing campaign is impersonating Uganda Revenue Authority with fake tax refund announcements, seeking to harvest TIN credentials and Mobile Money authorization codes.',
    attackVector: 'SMS Spoofing with rogue lookalike domain (ura-etax-uganda-portal.net)',
    indicators: ['ura-etax-uganda-portal.net', '+256 701 445 119', 'UG-MOMO-ALERT'],
    remediationSteps: [
      'URA will never request payment or PIN to process a tax refund or audit.',
      'Only access URA services strictly via official https://ura.go.ug or official URA e-Services portal.',
      'Block rogue SMS senders and immediately report suspicious text messages to UG-CERT or 0800-CYBER.',
      'If you already entered your PIN on any third-party link, dial *165# (MTN) or *185# (Airtel) to change your PIN immediately.'
    ],
    publishedDate: '2026-11-02',
    referenceCode: 'UG-CERT-ADV-2026-089',
    isActive: true
  },
  {
    id: 'adv-002',
    title: 'Mobile Money Cash-Out Fraud Tactics Exploding in Kampala & Wakiso Markets',
    severity: 'High',
    targetSector: 'Citizens',
    summary: 'Fraud syndicates are manipulating shop owners and mobile money agents using fake transaction receipts and social engineering calls claiming erroneous deposits.',
    attackVector: 'Voice social engineering + spoofed notification SMS',
    indicators: ['+256 772 491 820', '+256 708 933 114'],
    remediationSteps: [
      'Never refund money based on SMS alerts or phone calls until you check your account balance via *165# or *185# directly.',
      'Real telecom reversal requests must be authorized through telecom customer care desks, never direct person-to-person refunds.',
      'Protect your 5-digit or 4-digit PIN with your life: no telecom staff will ever ask for your PIN.',
      'Report any suspicious caller immediately to CyberTrin Uganda (+256 772590517).'
    ],
    publishedDate: '2026-10-29',
    referenceCode: 'UG-CERT-ADV-2026-085',
    isActive: true
  },
  {
    id: 'adv-003',
    title: 'Ransomware Targeting Unpatched Healthcare and Educational Windows Servers',
    severity: 'Critical',
    targetSector: 'Government',
    summary: 'Active ransomware threat actors exploit unpatched Remote Desktop Protocol (RDP) on medical clinic servers and university administration systems in Uganda.',
    attackVector: 'RDP port 3389 brute force -> shadow copy deletion -> .uglock ransomware execution',
    indicators: ['185.220.101.5', 'clinic-decryptor-ug@onionmail.org'],
    remediationSteps: [
      'Immediately disable open internet-facing RDP (Port 3389) or restrict via VPN and Multi-Factor Authentication.',
      'Maintain immutable, disconnected offline backups of all critical databases and patient registers.',
      'Apply latest operating system security patches across all hospital network hosts.',
      'Contact UG-CERT incident response team immediately if an encryption indicator is spotted.'
    ],
    publishedDate: '2026-11-01',
    referenceCode: 'UG-CERT-ADV-2026-088',
    isActive: true
  }
];

export const DATA_DICTIONARY_TABLES: SchemaTable[] = [
  {
    tableName: 'incidentReports',
    description: 'Primary repository of reported cybersecurity incidents across Uganda.',
    primaryKey: 'id (UUID)',
    fields: [
      { field: 'id', dataType: 'UUID', constraint: 'PRIMARY KEY', description: 'Unique internal system identifier for the incident.' },
      { field: 'referenceNumber', dataType: 'VARCHAR(32)', constraint: 'UNIQUE, NOT NULL', description: 'Public tracking code format: CGU-YYYY-XXXX for citizen follow-up.' },
      { field: 'reporterId', dataType: 'UUID', constraint: 'FOREIGN KEY, NULLABLE', description: 'Points to users table. Set to NULL if the citizen reported anonymously.' },
      { field: 'incidentCategory', dataType: 'ENUM', constraint: 'NOT NULL', description: 'Standardized classification: MoMo Fraud, Phishing, Ransomware, SIM Swap, etc.' },
      { field: 'severity', dataType: 'ENUM', constraint: 'NOT NULL (Low/Med/High/Critical)', description: 'Assigned threat severity rating.' },
      { field: 'status', dataType: 'ENUM', constraint: 'DEFAULT "Submitted"', description: 'Workflow state: Submitted, Under Review, Active Investigation, Mitigated, Resolved.' },
      { field: 'district', dataType: 'VARCHAR(64)', constraint: 'NOT NULL', description: 'Ugandan district where the incident occurred (e.g. Kampala, Gulu, Mbarara).' },
      { field: 'region', dataType: 'ENUM', constraint: 'NOT NULL', description: 'Geographic zone (Central, Eastern, Western, Northern).' },
      { field: 'affectedPlatform', dataType: 'VARCHAR(128)', constraint: 'NOT NULL', description: 'Platform or infrastructure compromised (e.g. MTN MoMo, Airtel, Centenary).' },
      { field: 'estimatedFinancialLossUGX', dataType: 'BIGINT', constraint: 'DEFAULT 0', description: 'Financial loss in Ugandan Shillings (UGX) for economic impact tracking.' },
      { field: 'description', dataType: 'TEXT', constraint: 'NOT NULL', description: 'Citizen narrative of the incident, sanitized for PII.' },
      { field: 'isAnonymous', dataType: 'BOOLEAN', constraint: 'DEFAULT FALSE', description: 'Protects victim identity per Uganda Data Protection and Privacy Act 2019.' },
      { field: 'reportedAt', dataType: 'TIMESTAMP WITH TIME ZONE', constraint: 'NOT NULL, SYSTEM GEN', description: 'UTC timestamp of initial report submission.' },
      { field: 'updatedAt', dataType: 'TIMESTAMP WITH TIME ZONE', constraint: 'NOT NULL', description: 'Timestamp of latest analyst review or status transition.' }
    ]
  },
  {
    tableName: 'threatIndicators',
    description: 'Curated Indicators of Compromise (IOCs) published for public search and firewall blocklists.',
    primaryKey: 'id (UUID)',
    fields: [
      { field: 'id', dataType: 'UUID', constraint: 'PRIMARY KEY', description: 'Unique identifier for the indicator item.' },
      { field: 'indicatorType', dataType: 'ENUM', constraint: 'NOT NULL', description: 'Indicator classification: Phone Number, URL, SMS Sender ID, IP, Account.' },
      { field: 'normalizedValue', dataType: 'VARCHAR(255)', constraint: 'INDEXED, UNIQUE', description: 'Cleaned, lowercased, canonical indicator (e.g., E.164 phone +256..., clean URL).' },
      { field: 'reviewStatus', dataType: 'ENUM', constraint: 'NOT NULL', description: 'Verification level: Unverified, Verified Malicious, Suspicious, Cleared.' },
      { field: 'confidence', dataType: 'FLOAT', constraint: 'CHECK (0.0 TO 1.0)', description: 'Algorithmic and analyst confidence score in malicious intent.' },
      { field: 'threatCategory', dataType: 'ENUM', constraint: 'NOT NULL', description: 'Mapped cyber threat category matching incidentReports.' },
      { field: 'reportedCount', dataType: 'INTEGER', constraint: 'DEFAULT 1', description: 'Total distinct citizen reports citing this specific indicator.' },
      { field: 'telecomOrProvider', dataType: 'VARCHAR(128)', constraint: 'NULLABLE', description: 'Identified network carrier (MTN, Airtel, UTL) or hosting provider.' },
      { field: 'tags', dataType: 'TEXT[] (ARRAY)', constraint: 'DEFAULT []', description: 'Searchable threat metadata tags (e.g. Smishing, Ponzi, Fake-URA).' },
      { field: 'firstDetected', dataType: 'DATE', constraint: 'NOT NULL', description: 'Date indicator was first recorded in national telemetry.' },
      { field: 'lastActive', dataType: 'DATE', constraint: 'NOT NULL', description: 'Date of most recent observed activity or verification.' }
    ]
  },
  {
    tableName: 'evidenceRecords',
    description: 'Digital evidence and forensic attachments related to incident reports.',
    primaryKey: 'id (UUID)',
    fields: [
      { field: 'id', dataType: 'UUID', constraint: 'PRIMARY KEY', description: 'Unique evidence identifier.' },
      { field: 'incidentId', dataType: 'UUID', constraint: 'FOREIGN KEY', description: 'Associated incident report foreign key.' },
      { field: 'fileHashSHA256', dataType: 'CHAR(64)', constraint: 'NOT NULL', description: 'Cryptographic hash ensuring digital chain of custody under Uganda evidence law.' },
      { field: 'fileType', dataType: 'VARCHAR(64)', constraint: 'NOT NULL', description: 'MIME type of evidence (image/png, application/pdf, message/rfc822).' },
      { field: 'storageUri', dataType: 'VARCHAR(512)', constraint: 'ENCRYPTED AT REST', description: 'AES-256 encrypted object storage pointer.' },
      { field: 'sanitizedFlag', dataType: 'BOOLEAN', constraint: 'DEFAULT FALSE', description: 'Flag verifying whether PII has been scrubbed before analyst sharing.' }
    ]
  },
  {
    tableName: 'triageAudits',
    description: 'Immutable audit trail of all analyst triage interventions and legal referrals.',
    primaryKey: 'id (UUID)',
    fields: [
      { field: 'id', dataType: 'UUID', constraint: 'PRIMARY KEY', description: 'Unique audit entry identifier.' },
      { field: 'incidentId', dataType: 'UUID', constraint: 'FOREIGN KEY', description: 'Target incident report.' },
      { field: 'analystName', dataType: 'VARCHAR(128)', constraint: 'NOT NULL', description: 'Identity of CERT analyst or investigator performing action.' },
      { field: 'actionTaken', dataType: 'VARCHAR(255)', constraint: 'NOT NULL', description: 'Action executed: Status transition, Severity escalation, Referral, IOC publish.' },
      { field: 'actionTimestamp', dataType: 'TIMESTAMP', constraint: 'NOT NULL, SYSTEM GEN', description: 'Time of modification.' },
      { field: 'referralAgency', dataType: 'VARCHAR(128)', constraint: 'NULLABLE', description: 'Transferred agency: Uganda Police Cyber Unit, UCC, Bank of Uganda, NITA-U.' }
    ]
  }
];

export const METHODOLOGY_LOG_PHASES: MethodologyPhase[] = [
  {
    phase: 1,
    milestone: 'Architecture & Design System Foundation',
    description: 'Implement high-trust national cyber defense UI design system adhering to Ugandan national institutional standards, accessible public routes, and strict anti-slop visual clarity for CyberTrin Uganda.',
    verificationMetric: 'UI System complete, responsive across mobile/desktop, zero placeholder styling, emergency hotline accessible within 1 click.',
    documentationRequired: 'Style System, Design Tokens, Routing Sitemap',
    status: 'Completed',
    completionDate: '2026-11-03'
  },
  {
    phase: 2,
    milestone: 'Citizen Reporting & Public Core',
    description: 'Citizen incident submission flow with automatic reference number generation (CGU-2026-XXXX), optional anonymous mode, district selector, and evidence upload simulation.',
    verificationMetric: 'Reports successfully validated, saved in persistent storage, and reference number rendered to user with tracking receipt.',
    documentationRequired: 'Data Dictionary v1.0, Citizen Flow Architecture',
    status: 'Completed',
    completionDate: '2026-11-03'
  },
  {
    phase: 3,
    milestone: 'UG-CERT Analyst Workbench & RBAC',
    description: 'Role-based operational triage queue for security analysts, status transitions, severity overrides, forensic notes, and legal referrals to Uganda Police Cybercrime Division.',
    verificationMetric: 'Analyst actions generate immutable audit log entries; citizen privacy protected from unauthorized disclosure.',
    documentationRequired: 'Permission Matrix, Triage Standard Operating Procedure',
    status: 'Completed',
    completionDate: '2026-11-03'
  },
  {
    phase: 4,
    milestone: 'Gemini AI Threat Classification & IOC Extraction',
    description: 'Server-side Gemini 3.8 Flash intelligence integration to automatically classify incident severity, extract phone/URL IOCs, map MITRE TTPs, and generate victim action guidance.',
    verificationMetric: '100% of incident submissions and message scans return structured triage assessments with zero client-side key exposure.',
    documentationRequired: 'AI Prompt Engineering Specification, Heuristics Benchmark',
    status: 'Completed',
    completionDate: '2026-11-03'
  },
  {
    phase: 5,
    milestone: 'Threat Intelligence Search & Real-Time Scanner',
    description: 'Instant searchable repository of verified malicious phone numbers, phishing URLs, and SMS sender IDs, combined with interactive AI message analyzer.',
    verificationMetric: 'Search latency < 100ms on indexed indicators; instant heuristic feedback with confidence scoring.',
    documentationRequired: 'Threat Indicator Schema, IOC Normalization Guide',
    status: 'Completed',
    completionDate: '2026-11-03'
  },
  {
    phase: 6,
    milestone: 'National Analytics, Regional Heatmaps & Telemetry',
    description: 'Live analytics dashboard displaying incident volume, regional breakdown across Uganda districts (Kampala, Wakiso, Jinja, Gulu, Mbarara), and financial loss metrics in UGX.',
    verificationMetric: 'Real-time telemetry reflects accurate aggregations across all recorded incidents.',
    documentationRequired: 'Telemetry Data Validation Report, Regional Threat Index',
    status: 'Completed',
    completionDate: '2026-11-03'
  },
  {
    phase: 7,
    milestone: 'Research Data Hygiene, Legal Compliance & Hardening',
    description: 'Full data dictionary explorer, exportable sanitized research datasets (JSON/CSV), methodology logs, and compliance audit for the Uganda Data Protection and Privacy Act 2019.',
    verificationMetric: 'Zero PII leakage in public exports; SHA-256 chain-of-custody verification enabled.',
    documentationRequired: 'Research Data Hygiene Protocol, DPPA 2019 Compliance Audit',
    status: 'Completed',
    completionDate: '2026-11-03'
  }
];
