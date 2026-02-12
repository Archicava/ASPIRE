import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { platformConfig } from '@/lib/config';
import { CaseRecord, InferenceJob } from '@/lib/types';
import { StorageAdapter } from './types';

type CasesStore = Record<string, CaseRecord>;
type JobsStore = Record<string, InferenceJob>;
type HiddenCasesStore = { hiddenIds: string[] };

class JsonBackend implements StorageAdapter {
  private dbDir: string;
  private payloadsDir: string;
  private casesPath: string;
  private jobsPath: string;
  private hiddenCasesPath: string;

  constructor(dataDir: string) {
    this.dbDir = join(dataDir, 'db');
    this.payloadsDir = join(dataDir, 'payloads');
    this.casesPath = join(this.dbDir, 'cases.json');
    this.jobsPath = join(this.dbDir, 'jobs.json');
    this.hiddenCasesPath = join(this.dbDir, 'hidden-cases.json');

    // Ensure directories exist
    if (!existsSync(this.dbDir)) {
      mkdirSync(this.dbDir, { recursive: true });
    }
    if (!existsSync(this.payloadsDir)) {
      mkdirSync(this.payloadsDir, { recursive: true });
    }
  }

  private readCases(): CasesStore {
    if (!existsSync(this.casesPath)) {
      return {};
    }
    try {
      const data = readFileSync(this.casesPath, 'utf-8');
      return JSON.parse(data) as CasesStore;
    } catch {
      return {};
    }
  }

  private writeCases(store: CasesStore): void {
    writeFileSync(this.casesPath, JSON.stringify(store, null, 2), 'utf-8');
  }

  private readJobs(): JobsStore {
    if (!existsSync(this.jobsPath)) {
      return {};
    }
    try {
      const data = readFileSync(this.jobsPath, 'utf-8');
      return JSON.parse(data) as JobsStore;
    } catch {
      return {};
    }
  }

  private writeJobs(store: JobsStore): void {
    writeFileSync(this.jobsPath, JSON.stringify(store, null, 2), 'utf-8');
  }

  async getAllCases(): Promise<CaseRecord[]> {
    const store = this.readCases();
    return Object.values(store);
  }

  async getCase(id: string): Promise<CaseRecord | undefined> {
    const store = this.readCases();
    return store[id];
  }

  async setCase(id: string, record: CaseRecord): Promise<void> {
    const store = this.readCases();
    store[id] = record;
    this.writeCases(store);
  }

  async getAllJobs(): Promise<InferenceJob[]> {
    const store = this.readJobs();
    return Object.values(store);
  }

  async getJob(id: string): Promise<InferenceJob | undefined> {
    const store = this.readJobs();
    return store[id];
  }

  async setJob(id: string, job: InferenceJob): Promise<void> {
    const store = this.readJobs();
    store[id] = job;
    this.writeJobs(store);
  }

  async getStatus(): Promise<{ status: string; mode: string }> {
    return {
      status: 'healthy',
      mode: 'local'
    };
  }

  // Hidden cases methods
  private readHiddenCases(): HiddenCasesStore {
    if (!existsSync(this.hiddenCasesPath)) {
      return { hiddenIds: [] };
    }
    try {
      const data = readFileSync(this.hiddenCasesPath, 'utf-8');
      return JSON.parse(data) as HiddenCasesStore;
    } catch {
      return { hiddenIds: [] };
    }
  }

  private writeHiddenCases(store: HiddenCasesStore): void {
    writeFileSync(this.hiddenCasesPath, JSON.stringify(store, null, 2), 'utf-8');
  }

  getHiddenCaseIds(): string[] {
    return this.readHiddenCases().hiddenIds;
  }

  hideCase(caseId: string): void {
    const store = this.readHiddenCases();
    if (!store.hiddenIds.includes(caseId)) {
      store.hiddenIds.push(caseId);
      this.writeHiddenCases(store);
    }
  }

  unhideCase(caseId: string): void {
    const store = this.readHiddenCases();
    store.hiddenIds = store.hiddenIds.filter(id => id !== caseId);
    this.writeHiddenCases(store);
  }

  isCaseHidden(caseId: string): boolean {
    return this.getHiddenCaseIds().includes(caseId);
  }

  // Payload storage methods
  savePayload(caseId: string, payload: unknown): string {
    const filename = `${caseId}.json`;
    const filepath = join(this.payloadsDir, filename);
    writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf-8');
    return filepath;
  }

  getPayload(caseId: string): unknown | undefined {
    const filepath = join(this.payloadsDir, `${caseId}.json`);
    if (!existsSync(filepath)) {
      return undefined;
    }
    try {
      const data = readFileSync(filepath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return undefined;
    }
  }
}

let instance: JsonBackend | null = null;

export function getJsonBackend(): JsonBackend {
  if (!instance) {
    instance = new JsonBackend(platformConfig.dataDir);
  }
  return instance;
}
