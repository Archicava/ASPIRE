import { platformConfig } from '@/lib/config';
import { getRatio1NodeClient } from '@/lib/ratio1-client';
import { CaseRecord, InferenceJob } from '@/lib/types';
import { StorageAdapter } from './types';

function parseHashPayload<T>(payload: unknown): T[] {
  const items: T[] = [];

  if (!payload || typeof payload !== 'object') {
    return items;
  }

  const entries = Object.entries(payload as Record<string, unknown>);

  for (const [, value] of entries) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === 'object') {
          items.push(item as T);
        }
      });
      continue;
    }

    if (typeof value === 'object') {
      items.push(value as T);
      continue;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && typeof item === 'object') {
              items.push(item as T);
            }
          });
        } else if (parsed && typeof parsed === 'object') {
          items.push(parsed as T);
        }
      } catch {
        // Ignore malformed JSON entries
      }
    }
  }

  return items;
}

function parseValue<T>(value: unknown): T | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  if (typeof value === 'object') {
    return value as T;
  }

  return undefined;
}

class CstoreBackend implements StorageAdapter {
  async getAllCases(): Promise<CaseRecord[]> {
    const client = getRatio1NodeClient();
    const response = await client.cstore.hgetall({ hkey: platformConfig.casesHKey });
    return parseHashPayload<CaseRecord>((response as any).result ?? response);
  }

  async getCase(id: string): Promise<CaseRecord | undefined> {
    const client = getRatio1NodeClient();
    const response = await client.cstore.hget({ hkey: platformConfig.casesHKey, key: id });
    const value = (response as any).result ?? (response as any)?.value ?? response;
    return parseValue<CaseRecord>(value);
  }

  async setCase(id: string, record: CaseRecord): Promise<void> {
    const client = getRatio1NodeClient();
    await client.cstore.hset({
      hkey: platformConfig.casesHKey,
      key: id,
      value: JSON.stringify(record)
    });
  }

  async getAllJobs(): Promise<InferenceJob[]> {
    const client = getRatio1NodeClient();
    const response = await client.cstore.hgetall({ hkey: platformConfig.jobsHKey });
    return parseHashPayload<InferenceJob>((response as any).result ?? response);
  }

  async getJob(id: string): Promise<InferenceJob | undefined> {
    const client = getRatio1NodeClient();
    const response = await client.cstore.hget({ hkey: platformConfig.jobsHKey, key: id });
    const value = (response as any).result ?? (response as any)?.value ?? response;
    return parseValue<InferenceJob>(value);
  }

  async setJob(id: string, job: InferenceJob): Promise<void> {
    const client = getRatio1NodeClient();
    await client.cstore.hset({
      hkey: platformConfig.jobsHKey,
      key: id,
      value: JSON.stringify(job)
    });
  }

  async getStatus(): Promise<{ status: string; mode: string }> {
    const client = getRatio1NodeClient();
    const cstoreStatus = await client.cstore.getStatus();
    return {
      status: (cstoreStatus as any)?.status ?? 'unknown',
      mode: 'cstore'
    };
  }
}

let instance: CstoreBackend | null = null;

export function getCstoreBackend(): StorageAdapter {
  if (!instance) {
    instance = new CstoreBackend();
  }
  return instance;
}
