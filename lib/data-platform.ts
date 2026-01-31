import { Buffer } from 'node:buffer';

import { platformConfig } from '@/lib/config';
import { getCohortCaseRecords, getMockInferenceJobs } from '@/lib/cohort-data';
import { CaseRecord, CaseSubmission, InferenceJob, InferenceJobStatus, InferenceResult } from '@/lib/types';
import { getRatio1NodeClient } from '@/lib/ratio1-client';
import {
  mapCaseToApiPayload,
  validateApiPayload,
  callAspireApi,
  generateMockPredictionResponse,
  AspireApiError,
  AspireNetworkError,
  AspireValidationError
} from '@/lib/aspire-api';

type ParsedHash<T> = {
  items: T[];
  raw: Record<string, unknown>;
};

function parseHashPayload<T>(payload: unknown): ParsedHash<T> {
  const result: ParsedHash<T> = {
    items: [],
    raw: {}
  };

  if (!payload || typeof payload !== 'object') {
    return result;
  }

  const entries = Object.entries(payload as Record<string, unknown>);

  for (const [key, value] of entries) {
    result.raw[key] = value;

    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === 'object') {
          result.items.push(item as T);
        }
      });
      continue;
    }

    if (typeof value === 'object') {
      result.items.push(value as T);
      continue;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && typeof item === 'object') {
              result.items.push(item as T);
            }
          });
        } else if (parsed && typeof parsed === 'object') {
          result.items.push(parsed as T);
        }
      } catch {
        // Ignore malformed JSON entries
      }
    }
  }

  return result;
}

export async function loadCaseRecords(): Promise<CaseRecord[]> {
  if (platformConfig.MOCK_MODE) {
    console.log('[data-platform] MOCK_MODE enabled - returning cohort seed data');
    return getCohortCaseRecords();
  }

  const client = getRatio1NodeClient();
  const response = await client.cstore.hgetall({ hkey: platformConfig.casesHKey });

  const parsed = parseHashPayload<CaseRecord>((response as any).result ?? response);
  return parsed.items;
}

export function loadCohortSeedCases(limit?: number): CaseRecord[] {
  const records = getCohortCaseRecords();
  if (typeof limit === 'number') {
    return records.slice(0, limit);
  }
  return records;
}

export async function loadCaseRecord(caseId: string): Promise<CaseRecord | undefined> {
  if (platformConfig.MOCK_MODE) {
    const cases = getCohortCaseRecords();
    return cases.find(c => c.id === caseId);
  }

  const client = getRatio1NodeClient();
  const response = await client.cstore.hget({ hkey: platformConfig.casesHKey, key: caseId });

  const value = (response as any).result ?? (response as any)?.value ?? response;

  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as CaseRecord;
    } catch {
      return undefined;
    }
  }

  if (typeof value === 'object') {
    return value as CaseRecord;
  }

  return undefined;
}

export async function loadInferenceJobs(): Promise<InferenceJob[]> {
  if (platformConfig.MOCK_MODE) {
    console.log('[data-platform] MOCK_MODE enabled - returning mock jobs');
    return getMockInferenceJobs();
  }

  const client = getRatio1NodeClient();
  const response = await client.cstore.hgetall({ hkey: platformConfig.jobsHKey });

  const parsed = parseHashPayload<InferenceJob>((response as any).result ?? response);
  return parsed.items;
}

export async function loadInferenceJob(jobId: string): Promise<InferenceJob | undefined> {
  if (platformConfig.MOCK_MODE) {
    const jobs = getMockInferenceJobs();
    return jobs.find(j => j.id === jobId);
  }

  const client = getRatio1NodeClient();
  const response = await client.cstore.hget({ hkey: platformConfig.jobsHKey, key: jobId });

  const value = (response as any).result ?? (response as any)?.value ?? response;
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as InferenceJob;
    } catch {
      return undefined;
    }
  }

  if (typeof value === 'object') {
    return value as InferenceJob;
  }

  return undefined;
}

export async function loadPlatformStatus(): Promise<{
  cstore?: Record<string, unknown>;
  r1fs?: Record<string, unknown>;
}> {
  if (platformConfig.MOCK_MODE) {
    console.log('[data-platform] MOCK_MODE enabled - returning mock platform status');
    return {
      cstore: {
        status: 'healthy',
        mode: 'mock',
        message: 'Mock mode - CStore simulation'
      },
      r1fs: {
        status: 'healthy',
        mode: 'mock',
        message: 'Mock mode - R1FS simulation'
      }
    };
  }

  const client = getRatio1NodeClient();
  const [cstoreStatus, r1fsStatus] = await Promise.all([
    client.cstore.getStatus(),
    client.r1fs.getStatus()
  ]);

  return {
    cstore: cstoreStatus as unknown as Record<string, unknown>,
    r1fs: r1fsStatus as unknown as Record<string, unknown>
  };
}

export async function storeCaseSubmission(
  submission: CaseSubmission,
  inferenceOverride?: InferenceResult
): Promise<CaseRecord> {
  const timestamp = new Date();
  const id = createCaseId(timestamp);
  const jobId = createJobId(timestamp);

  // Create initial pending inference
  let inference: InferenceResult =
    inferenceOverride ||
    ({
      topPrediction: 'Pending inference',
      categories: [
        { label: 'Awaiting prediction', probability: 1 }
      ],
      explanation: 'Inference job has been queued and is awaiting execution.',
      recommendedActions: ['Monitor job queue for completion.', 'Notify caregivers once results are available.']
    } satisfies InferenceResult);

  const record: CaseRecord = {
    ...submission,
    id,
    submittedAt: timestamp.toISOString(),
    inference,
    jobId,
    artifacts: {}
  };

  if (platformConfig.MOCK_MODE) {
    console.log('[data-platform] MOCK_MODE enabled - simulating case storage with prediction');

    // Run prediction even in mock mode
    const predictionResult = await runPrediction(submission, id);
    if (predictionResult.inference) {
      record.inference = predictionResult.inference;
    }

    return record;
  }

  return storeCaseInLiveMode(record, submission, timestamp);
}

async function runPrediction(
  submission: CaseSubmission,
  caseId: string
): Promise<{ inference?: InferenceResult; error?: string }> {
  try {
    // Map case data to API payload
    const payload = mapCaseToApiPayload(submission, caseId);

    // Validate payload before sending
    const validation = validateApiPayload(payload);
    if (!validation.valid) {
      console.error('[runPrediction] Validation failed:', validation.errors);
      return { error: `Validation failed: ${validation.errors.join(', ')}` };
    }

    let response;

    if (platformConfig.MOCK_MODE || !platformConfig.aspire.enabled) {
      // Use mock prediction in mock mode or if API is disabled
      console.log('[runPrediction] Using mock prediction');
      response = generateMockPredictionResponse(payload);
    } else {
      // Call real API
      console.log('[runPrediction] Calling Aspire API');
      response = await callAspireApi(payload);
    }

    // Save raw API response directly as inference result
    const inference: InferenceResult = {
      topPrediction: response.prediction,
      prediction: response.prediction,
      probability: response.probability,
      confidence: response.confidence,
      riskLevel: response.risk_level,
      categories: [
        { label: response.prediction, probability: response.probability },
        { label: response.prediction === 'ASD' ? 'Healthy' : 'ASD', probability: 1 - response.probability }
      ],
      explanation: `${response.prediction} with ${(response.probability * 100).toFixed(1)}% probability.`,
      recommendedActions: []
    };
    console.log('[runPrediction] Prediction completed:', response.prediction, response.risk_level);

    return { inference };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[runPrediction] Prediction failed:', errorMessage);

    if (error instanceof Error && (error as any).cause) {
      console.error('[runPrediction] Error cause:', (error as any).cause);
    }

    if (error instanceof AspireValidationError) {
      return { error: `Validation error: ${errorMessage}` };
    }
    if (error instanceof AspireApiError) {
      return { error: `API error: ${errorMessage}` };
    }
    if (error instanceof AspireNetworkError) {
      return { error: `Network error: ${errorMessage}` };
    }

    return { error: errorMessage };
  }
}

function createCaseId(timestamp: Date) {
  const baseId = `R1-${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(
    timestamp.getDate()
  ).padStart(2, '0')}`;
  return `${baseId}-${timestamp.getTime().toString().slice(-4)}`;
}

function createJobId(timestamp: Date) {
  return `JOB-${timestamp.getTime()}`;
}

function createStatusHistory(status: InferenceJobStatus, timestamp: Date) {
  return [{ status, timestamp: timestamp.toISOString() }];
}

async function storeCaseInLiveMode(
  record: CaseRecord,
  submission: CaseSubmission,
  timestamp: Date
): Promise<CaseRecord> {
  const client = getRatio1NodeClient();

  const payload = {
    caseId: record.id,
    submittedAt: record.submittedAt,
    submission
  };

  let payloadCid: string | undefined;
  let edgeNode: string | undefined;

  try {
    const uploadResponse = await client.r1fs.addFileBase64({
      file_base64_str: Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64'),
      filename: `${record.id}.json`
    });

    const cidCandidate =
      (uploadResponse as any)?.result?.cid ??
      (uploadResponse as any)?.cid ??
      uploadResponse ??
      undefined;

    payloadCid = typeof cidCandidate === 'string' ? cidCandidate : undefined;
    edgeNode =
      (uploadResponse as any)?.ee_node_address ??
      (uploadResponse as any)?.result?.ee_node_address ??
      undefined;
  } catch (error) {
    console.error('[storeCaseInLiveMode] Failed to persist payload to R1FS', error);
  }

  record.artifacts = {
    payloadCid: payloadCid ?? record.artifacts?.payloadCid
  };

  // Create initial job with queued status
  const job: InferenceJob = {
    id: record.jobId ?? createJobId(timestamp),
    caseId: record.id,
    status: 'queued',
    submittedAt: timestamp.toISOString(),
    edgeNode,
    payloadCid,
    statusHistory: createStatusHistory('queued', timestamp)
  };

  record.jobId = job.id;

  // Run prediction
  const runningTimestamp = new Date();
  job.status = 'running';
  job.statusHistory = [
    ...createStatusHistory('queued', timestamp),
    { status: 'running', timestamp: runningTimestamp.toISOString() }
  ];

  const predictionResult = await runPrediction(submission, record.id);

  const completedTimestamp = new Date();
  if (predictionResult.inference) {
    record.inference = predictionResult.inference;
    job.status = 'succeeded';
    job.completedAt = completedTimestamp.toISOString();
    job.result = predictionResult.inference;
    job.statusHistory = [
      ...job.statusHistory,
      { status: 'succeeded', timestamp: completedTimestamp.toISOString() }
    ];
  } else if (predictionResult.error) {
    job.status = 'failed';
    job.completedAt = completedTimestamp.toISOString();
    job.error = predictionResult.error;
    job.statusHistory = [
      ...job.statusHistory,
      { status: 'failed', timestamp: completedTimestamp.toISOString(), message: predictionResult.error }
    ];
  }

  // Store case and job
  await client.cstore.hset({
    hkey: platformConfig.casesHKey,
    key: record.id,
    value: JSON.stringify(record)
  });

  await client.cstore.hset({
    hkey: platformConfig.jobsHKey,
    key: job.id,
    value: JSON.stringify(job)
  });

  return record;
}

export async function retryCasePrediction(
  caseId: string
): Promise<{ success: boolean; caseRecord?: CaseRecord; error?: string }> {
  // Load existing case record
  const record = await loadCaseRecord(caseId);
  if (!record) {
    return { success: false, error: 'Case not found' };
  }

  // Extract submission data from case record
  const submission: CaseSubmission = {
    demographics: record.demographics,
    development: record.development,
    assessments: record.assessments,
    behaviors: record.behaviors,
    notes: record.notes
  };

  // Run prediction
  const timestamp = new Date();
  const predictionResult = await runPrediction(submission, caseId);

  if (!predictionResult.inference) {
    return { success: false, error: predictionResult.error || 'Prediction failed' };
  }

  // Update case record with new inference
  record.inference = predictionResult.inference;

  // Update job if exists
  let job: InferenceJob | undefined;
  if (record.jobId) {
    job = await loadInferenceJob(record.jobId);
  }

  if (job) {
    job.status = 'succeeded';
    job.completedAt = timestamp.toISOString();
    job.result = predictionResult.inference;
    job.error = undefined;
    job.statusHistory = [
      ...(job.statusHistory || []),
      { status: 'running', timestamp: new Date(timestamp.getTime() - 1000).toISOString(), message: 'Retry initiated' },
      { status: 'succeeded', timestamp: timestamp.toISOString(), message: 'Retry successful' }
    ];
  }

  // Persist updates
  if (!platformConfig.MOCK_MODE) {
    const client = getRatio1NodeClient();

    await client.cstore.hset({
      hkey: platformConfig.casesHKey,
      key: record.id,
      value: JSON.stringify(record)
    });

    if (job) {
      await client.cstore.hset({
        hkey: platformConfig.jobsHKey,
        key: job.id,
        value: JSON.stringify(job)
      });
    }
  }

  return { success: true, caseRecord: record };
}
