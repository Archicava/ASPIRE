import { CaseRecord, InferenceJob } from '@/lib/types';

export interface StorageAdapter {
  // Cases
  getAllCases(): Promise<CaseRecord[]>;
  getCase(id: string): Promise<CaseRecord | undefined>;
  setCase(id: string, record: CaseRecord): Promise<void>;

  // Jobs
  getAllJobs(): Promise<InferenceJob[]>;
  getJob(id: string): Promise<InferenceJob | undefined>;
  setJob(id: string, job: InferenceJob): Promise<void>;

  // Status
  getStatus(): Promise<{ status: string; mode: string }>;
}
