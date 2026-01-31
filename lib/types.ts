export type PrenatalFactor = 'Natural' | 'IVF' | 'Twin' | 'Complication';

export type DevelopmentalDelay = 'None' | 'Motor' | 'Language' | 'Cognitive' | 'Global';

export type IntellectualDisability = 'N' | 'F70.0' | 'F71' | 'F72';

export type BehaviorConcern =
  | 'Aggressivity'
  | 'Self-injury'
  | 'Agitation'
  | 'Stereotypy'
  | 'Hyperactivity'
  | 'Sleep'
  | 'Sensory';

export type CaseSubmission = {
  demographics: {
    caseLabel: string;
    ageMonths: number;
    sex: 'Male' | 'Female';
    parentalAge: {
      mother: number;
      father: number;
    };
    diagnosticAgeMonths: number;
    prenatalFactors: PrenatalFactor[];
  };
  development: {
    delays: DevelopmentalDelay[];
    dysmorphicFeatures: boolean;
    intellectualDisability: IntellectualDisability;
    comorbidities: string[];
    regressionObserved: boolean;
  };
  assessments: {
    adosScore: number;
    adirScore: number;
    iqDq: number;
    eegAnomalies: boolean;
    mriFindings: string | null;
    neurologicalExam: string;
    headCircumference: number;
  };
  behaviors: {
    concerns: BehaviorConcern[];
    languageLevel: 'Functional' | 'Delayed' | 'Absent';
    sensoryNotes: string;
  };
  notes: string;
};

export type InferenceJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type InferenceJob = {
  id: string;
  caseId: string;
  status: InferenceJobStatus;
  submittedAt: string;
  completedAt?: string;
  edgeNode?: string;
  payloadCid?: string;
  result?: InferenceResult;
  error?: string;
  statusHistory?: Array<{
    status: InferenceJobStatus;
    timestamp: string;
    message?: string;
  }>;
};

export type InferenceCategory = {
  label: string;
  probability: number;
  narrative?: string;
};

export type RiskLevel = 'low' | 'medium' | 'high';

export type InferenceResult = {
  topPrediction: string;
  prediction?: 'Healthy' | 'ASD';
  probability?: number;
  confidence?: number;
  riskLevel?: RiskLevel;
  categories: InferenceCategory[];
  explanation: string;
  recommendedActions: string[];
};

export type CaseRecord = CaseSubmission & {
  id: string;
  submittedAt: string;
  inference: InferenceResult;
  jobId?: string;
  artifacts?: {
    payloadCid?: string;
  };
};

export type PredictiveInput = {
  caseId?: string;
  ageMonths: number;
  languageLevel: 'Functional' | 'Delayed' | 'Absent';
  eegStatus: 'Normal' | 'Focal' | 'Bilateral';
  mriStatus: 'Normal' | 'Anomaly' | 'Unknown';
  prenatalFactors: PrenatalFactor[];
  developmentalDelays: DevelopmentalDelay[];
  dysmorphicFeatures: boolean;
  behavioralConcerns: number;
  comorbidities: number;
};

export type PredictiveScenario = {
  label: string;
  probability: number;
  narrative: string;
};

export type PredictiveResult = {
  topFinding: string;
  scenarios: PredictiveScenario[];
  riskSummary: string;
  recommendations: string[];
};

// Aspire ASD Screening API Types

export type AspireApiRequest = {
  struct_data: {
    developmental_milestones: 'N' | 'G' | 'M' | 'C';
    iq_dq: number;
    intellectual_disability: 'N' | 'F70.0' | 'F71' | 'F72';
    language_disorder: 'N' | 'Y';
    language_development: 'N' | 'delay' | 'A';
    dysmorphism: 'NO' | 'Y';
    behaviour_disorder: 'N' | 'Y';
    neurological_exam: string;
  };
  metadata?: {
    patient_id?: string;
    session_id?: string;
  };
};

export type AspireApiResponse = {
  status: 'completed';
  request_id: string;
  prediction: 'Healthy' | 'ASD';
  probability: number;
  confidence: number;
  risk_level: RiskLevel;
  input_summary: Record<string, unknown>;
  processed_at: string;
  processor_version: string;
  metadata?: Record<string, unknown>;
};

export type AspireApiErrorCode = 'VALIDATION_ERROR' | 'PROCESSING_ERROR';

export type AspireApiErrorResponse = {
  status: 'error';
  request_id: string;
  error: string;
  error_code: AspireApiErrorCode;
  error_type: 'validation' | 'processing';
  error_message: string;
};
