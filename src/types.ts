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
