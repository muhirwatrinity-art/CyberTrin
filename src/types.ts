export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IncidentStatus = 
  | 'Submitted' 
  | 'Under Review' 
  | 'Active Investigation' 
  | 'Mitigated' 
  | 'Resolved' 
  | 'False Positive';

export type IncidentCategory =
  | 'Mobile Money & Financial Fraud'
  | 'Phishing & SMS Spoofing'
  | 'SIM Swap & Telecom Fraud'
  | 'Ransomware & Malware'
  | 'Impersonation & Social Engineering'
  | 'Data Breach & Unauthorized Disclosure'
  | 'Online Extortion & Cyber Harassment'
  | 'Fake SACCO & Investment Scam';

export type IndicatorType = 
  | 'Phone Number' 
  | 'URL / Domain' 
  | 'SMS Sender ID' 
  | 'Email Address' 
  | 'IP Address' 
  | 'Bank / MoMo Account';

export type ReviewStatus = 'Unverified' | 'Verified Malicious' | 'Suspicious' | 'Cleared / Safe';

export interface ThreatIndicator {
  id: string;
  indicatorType: IndicatorType;
  normalizedValue: string;
  originalValue: string;
  reviewStatus: ReviewStatus;
  confidence: number; // 0.0 - 1.0
  threatCategory: IncidentCategory;
  reportedCount: number;
  firstDetected: string;
  lastActive: string;
  telecomOrProvider?: string;
  description: string;
  tags: string[];
  associatedIncidents?: string[];
}

export interface IncidentReport {
  id: string;
  referenceNumber: string; // e.g. CGU-2026-1042
  title: string;
  incidentCategory: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  reporter?: {
    name?: string;
    contact?: string;
    email?: string;
    district?: string;
  };
  district: string; // Kampala, Wakiso, Gulu, Jinja, Mbarara, etc.
  region: 'Central' | 'Eastern' | 'Western' | 'Northern';
  affectedPlatform: string; // e.g. MTN MoMo, Airtel Money, Centenary Bank, Stanbic, WhatsApp, SMS
  suspectIdentifiers: string[]; // Phone numbers, URLs, Sender IDs
  estimatedFinancialLossUGX: number;
  description: string;
  evidenceFiles?: {
    name: string;
    type: string;
    size: string;
  }[];
  aiTriageAnalysis?: {
    threatScore: number; // 1-100
    detectedTTPs: string[];
    summary: string;
    recommendedActions: string[];
    extractedIOCs: string[];
    analyzedAt: string;
  };
  analystNotes?: {
    author: string;
    timestamp: string;
    note: string;
  }[];
  assignedAnalyst?: string;
  referredToAuthority?: 'Uganda Police Cyber Unit' | 'UCC' | 'Bank of Uganda' | 'NITA-U CERT' | 'None';
}

export interface SecurityAdvisory {
  id: string;
  title: string;
  severity: IncidentSeverity;
  targetSector: 'Citizens' | 'Financial & Fintech' | 'SACCOs' | 'SMEs' | 'Government';
  summary: string;
  attackVector: string;
  indicators: string[];
  remediationSteps: string[];
  publishedDate: string;
  referenceCode: string;
  isActive: boolean;
}

export interface SchemaField {
  field: string;
  dataType: string;
  constraint: string;
  description: string;
  complianceNote?: string;
}

export interface SchemaTable {
  tableName: string;
  description: string;
  primaryKey: string;
  fields: SchemaField[];
}

export interface MethodologyPhase {
  phase: number;
  milestone: string;
  description: string;
  verificationMetric: string;
  documentationRequired: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  completionDate?: string;
}

export type CyberWorkStatus = 'Active Defense' | 'Interception Underway' | 'Telemetry Scan' | 'Incident Containment';

export interface LiveCyberWork {
  id: string;
  operationName: string;
  district: string;
  lat: number;
  lng: number;
  status: CyberWorkStatus;
  workCategory: 'Packet Scrubbing' | 'Telecom Fraud Sinkhole' | 'GovNet Honeypot' | 'Digital Forensics Unit' | 'Critical Infrastructure Shield';
  leadAgency: string;
  personnelCount: number;
  metrics: string;
  activeTools: string[];
  description: string;
  lastUpdate: string;
}

export type DangerLevel = 'CRITICAL DANGER' | 'HIGH HAZARD' | 'SEVERE ALERT';

export interface AutomatedThreat {
  id: string;
  district: string;
  region: 'Central' | 'Eastern' | 'Western' | 'Northern';
  lat: number;
  lng: number;
  threatTitle: string;
  threatCategory: IncidentCategory;
  dangerLevel: DangerLevel;
  dangerScore: number; // 1 - 100
  detectedAt: string;
  automatedSource: string;
  suspectIdentifiers: string[];
  affectedInfrastructure: string;
  dangerDescription: string;
  automatedContainmentAction: string;
  isMitigated: boolean;
  alertDismissed?: boolean;
}

// DIGITAL FORENSICS & INVESTIGATION MODULE TYPES

export type DigitalArtifactType = 
  | 'IP Address' 
  | 'Domain' 
  | 'URL' 
  | 'Email Header' 
  | 'File Hash' 
  | 'Network Log' 
  | 'DNS Record' 
  | 'WHOIS Entry';

export interface IpTraceResult {
  ip: string;
  ipVersion: 'IPv4' | 'IPv6';
  country: string;
  countryCode: string;
  region: string;
  city: string;
  approxLat: number;
  approxLng: number;
  isp: string;
  asn: string;
  asOrg: string;
  isDataCenterOrHosting: boolean;
  isVpnOrProxy: boolean;
  isTorExitNode: boolean;
  reputationScore: number; // 0 - 100
  reputationCategory: 'Malicious C2' | 'Known Phishing Host' | 'Suspicious Proxy' | 'Low Risk' | 'Clean';
  associatedDomains: string[];
  historicalThreatCount: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  intelligenceSource: string;
  intelligenceDate: string;
  forensicDisclaimer: string;
}

export interface ChainOfCustodyEntry {
  id: string;
  timestamp: string;
  officerName: string;
  officerBadgeOrId: string;
  actionTaken: string;
  storageLocation: string;
  sha256Verification: string;
}

export interface EvidenceRecord {
  id: string;
  caseId: string;
  title: string;
  artifactType: DigitalArtifactType;
  rawValue: string;
  sha256Hash: string;
  collectedAt: string;
  collectedBy: string;
  legalAuthorization: string;
  isTamperVerified: boolean;
  chainOfCustody: ChainOfCustodyEntry[];
  notes?: string;
}

export interface InvestigationCase {
  id: string;
  caseNumber: string; // e.g. CASE-2026-UG-0419
  title: string;
  leadInvestigator: string;
  agency: 'Uganda Police Cybercrime CID' | 'UG-CERT / NITA-U' | 'Bank of Uganda Forensics' | 'Joint Inter-Agency Taskforce';
  status: 'Open' | 'Active Forensics' | 'Subpoena Pending' | 'Referred to Court' | 'Closed';
  incidentReferences: string[];
  createdAt: string;
  updatedAt: string;
  summary: string;
  suspectDigitalTraces: string[];
  evidenceCount: number;
  legalWarrantStatus: 'Warrant Granted' | 'Production Order Pending' | 'Consent Based' | 'Not Required';
  statutoryBasis: string; // e.g. "Section 28 Computer Misuse Act 2022"
}

export type InfrastructureNodeType = 
  | 'IP' 
  | 'Domain' 
  | 'Hosting / ASN' 
  | 'Malware Hash' 
  | 'Victim Account' 
  | 'Threat Actor' 
  | 'Incident';

export interface InfrastructureNode {
  id: string;
  label: string;
  nodeType: InfrastructureNodeType;
  details?: string;
  country?: string;
  reputation?: string;
  isMalicious?: boolean;
}

export interface InfrastructureLink {
  source: string;
  target: string;
  relationshipType: 'Hosted On' | 'DNS Resolves To' | 'Shared Certificate' | 'Observed In Incident' | 'Exfiltration Channel' | 'Suspected C2';
  isConfirmed: boolean; // confirmed vs suspected
  confidence: number; // 0 - 100
  notes?: string;
}

export interface ThreatInfrastructureGraph {
  nodes: InfrastructureNode[];
  links: InfrastructureLink[];
}

