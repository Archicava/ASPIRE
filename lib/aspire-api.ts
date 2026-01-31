import { platformConfig } from '@/lib/config';
import type {
  AspireApiRequest,
  AspireApiResponse,
  AspireApiErrorResponse,
  CaseSubmission,
  RiskLevel
} from '@/lib/types';

export class AspireValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'AspireValidationError';
  }
}

export class AspireNetworkError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AspireNetworkError';
  }
}

export class AspireApiError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string,
    public readonly errorType: string,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'AspireApiError';
  }
}

type ValidationResult =
  | { valid: true; payload: AspireApiRequest }
  | { valid: false; errors: string[] };

export function mapCaseToApiPayload(
  submission: CaseSubmission,
  caseId?: string
): AspireApiRequest {
  const { development, assessments, behaviors } = submission;

  // Map developmental_milestones: prioritize Global > Motor > Cognitive > None
  let developmentalMilestones: 'N' | 'G' | 'M' | 'C' = 'N';
  if (development.delays.includes('Global')) {
    developmentalMilestones = 'G';
  } else if (development.delays.includes('Motor')) {
    developmentalMilestones = 'M';
  } else if (development.delays.includes('Cognitive')) {
    developmentalMilestones = 'C';
  }

  // Map language_development from languageLevel
  const languageDevelopmentMap: Record<string, 'N' | 'delay' | 'A'> = {
    Functional: 'N',
    Delayed: 'delay',
    Absent: 'A'
  };
  const languageDevelopment = languageDevelopmentMap[behaviors.languageLevel] || 'N';

  // Derive language_disorder: Y if not Functional
  const languageDisorder: 'N' | 'Y' = behaviors.languageLevel !== 'Functional' ? 'Y' : 'N';

  // Map dysmorphism
  const dysmorphism: 'NO' | 'Y' = development.dysmorphicFeatures ? 'Y' : 'NO';

  // Derive behaviour_disorder: Y if any concerns present
  const behaviourDisorder: 'N' | 'Y' = behaviors.concerns.length > 0 ? 'Y' : 'N';

  return {
    struct_data: {
      developmental_milestones: developmentalMilestones,
      iq_dq: assessments.iqDq,
      intellectual_disability: development.intellectualDisability,
      language_disorder: languageDisorder,
      language_development: languageDevelopment,
      dysmorphism: dysmorphism,
      behaviour_disorder: behaviourDisorder,
      neurological_exam: assessments.neurologicalExam
    },
    metadata: caseId ? { patient_id: caseId } : undefined
  };
}

export function validateApiPayload(payload: AspireApiRequest): ValidationResult {
  const errors: string[] = [];
  const { struct_data } = payload;

  // Validate developmental_milestones
  if (!['N', 'G', 'M', 'C'].includes(struct_data.developmental_milestones)) {
    errors.push(
      `Invalid developmental_milestones: "${struct_data.developmental_milestones}". Must be N, G, M, or C.`
    );
  }

  // Validate iq_dq
  if (
    typeof struct_data.iq_dq !== 'number' ||
    struct_data.iq_dq < 20 ||
    struct_data.iq_dq > 150
  ) {
    errors.push(`Invalid iq_dq: "${struct_data.iq_dq}". Must be a number between 20 and 150.`);
  }

  // Validate intellectual_disability
  if (!['N', 'F70.0', 'F71', 'F72'].includes(struct_data.intellectual_disability)) {
    errors.push(
      `Invalid intellectual_disability: "${struct_data.intellectual_disability}". Must be N, F70.0, F71, or F72.`
    );
  }

  // Validate language_disorder
  if (!['N', 'Y'].includes(struct_data.language_disorder)) {
    errors.push(
      `Invalid language_disorder: "${struct_data.language_disorder}". Must be N or Y.`
    );
  }

  // Validate language_development
  if (!['N', 'delay', 'A'].includes(struct_data.language_development)) {
    errors.push(
      `Invalid language_development: "${struct_data.language_development}". Must be N, delay, or A.`
    );
  }

  // Validate dysmorphism
  if (!['NO', 'Y'].includes(struct_data.dysmorphism)) {
    errors.push(`Invalid dysmorphism: "${struct_data.dysmorphism}". Must be NO or Y.`);
  }

  // Validate behaviour_disorder
  if (!['N', 'Y'].includes(struct_data.behaviour_disorder)) {
    errors.push(
      `Invalid behaviour_disorder: "${struct_data.behaviour_disorder}". Must be N or Y.`
    );
  }

  // Validate neurological_exam
  if (!struct_data.neurological_exam || struct_data.neurological_exam.trim() === '') {
    errors.push('neurological_exam is required and cannot be empty.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, payload };
}

export async function callAspireApi(
  payload: AspireApiRequest
): Promise<AspireApiResponse> {
  if (!platformConfig.aspire.enabled) {
    throw new AspireNetworkError('Aspire API is disabled');
  }

  const url = `${platformConfig.aspire.apiUrl}/predict`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), platformConfig.aspire.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // The actual result is in data.result
    const result = data.result || data;

    if (!response.ok || result.status === 'error') {
      throw new AspireApiError(
        result.error_message || result.error || 'Unknown API error',
        result.error_code || 'UNKNOWN_ERROR',
        result.error_type || 'processing',
        result.request_id
      );
    }

    // Return just the result object with the prediction data
    return result as AspireApiResponse;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof AspireApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new AspireNetworkError(`Request timed out after ${platformConfig.aspire.timeoutMs}ms`);
      }
      throw new AspireNetworkError(error.message, error);
    }

    throw new AspireNetworkError('Unknown network error');
  }
}


export function generateMockPredictionResponse(
  payload: AspireApiRequest
): AspireApiResponse {
  // Generate a realistic mock response based on input data
  const { struct_data } = payload;

  // Calculate a mock probability based on risk factors
  let riskScore = 0;

  if (struct_data.developmental_milestones !== 'N') riskScore += 0.15;
  if (struct_data.intellectual_disability !== 'N') riskScore += 0.2;
  if (struct_data.language_disorder === 'Y') riskScore += 0.15;
  if (struct_data.language_development !== 'N') riskScore += 0.1;
  if (struct_data.dysmorphism === 'Y') riskScore += 0.1;
  if (struct_data.behaviour_disorder === 'Y') riskScore += 0.15;
  if (struct_data.iq_dq < 70) riskScore += 0.15;
  else if (struct_data.iq_dq < 85) riskScore += 0.05;

  // Add some randomness
  const jitter = (Math.random() - 0.5) * 0.1;
  const probability = Math.min(0.95, Math.max(0.05, riskScore + jitter));

  const prediction: 'Healthy' | 'ASD' = probability >= 0.5 ? 'ASD' : 'Healthy';
  const confidence = 0.7 + Math.random() * 0.25;

  let risk_level: RiskLevel;
  if (probability >= 0.7) {
    risk_level = 'high';
  } else if (probability >= 0.4) {
    risk_level = 'medium';
  } else {
    risk_level = 'low';
  }

  return {
    status: 'completed',
    request_id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    prediction,
    probability,
    confidence,
    risk_level,
    input_summary: struct_data,
    processed_at: new Date().toISOString(),
    processor_version: '0.1.0-mock',
    metadata: { mock: true }
  };
}
