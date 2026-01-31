import { platformConfig } from '@/lib/config';
import type {
  AspireApiRequest,
  AspireApiResponse,
  AspireApiErrorResponse,
  CaseSubmission,
  InferenceResult,
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
  console.log(`[callAspireApi] Calling ${url}`);

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

    if (!response.ok || data.status === 'error') {
      const errorData = data as AspireApiErrorResponse;
      throw new AspireApiError(
        errorData.error_message || errorData.error || 'Unknown API error',
        errorData.error_code || 'UNKNOWN_ERROR',
        errorData.error_type || 'processing',
        errorData.request_id
      );
    }

    return data as AspireApiResponse;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof AspireApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new AspireNetworkError(
          `Request timed out after ${platformConfig.aspire.timeoutMs}ms`
        );
      }

      // Provide more detailed error messages
      const cause = (error as any).cause;
      let detailedMessage = error.message;

      if (cause?.code === 'ECONNREFUSED') {
        detailedMessage = `Connection refused - is the Aspire API running at ${platformConfig.aspire.apiUrl}?`;
      } else if (cause?.code === 'ENOTFOUND') {
        detailedMessage = `Host not found: ${platformConfig.aspire.apiUrl}`;
      } else if (cause?.code === 'ETIMEDOUT') {
        detailedMessage = `Connection timed out to ${platformConfig.aspire.apiUrl}`;
      } else if (cause) {
        detailedMessage = `${error.message} (${cause.code || cause.message || 'unknown cause'})`;
      }

      console.error(`[callAspireApi] Network error details:`, {
        message: error.message,
        cause: cause,
        url: url
      });

      throw new AspireNetworkError(detailedMessage, error);
    }

    throw new AspireNetworkError('Unknown network error');
  }
}

export function mapApiResponseToInferenceResult(response: AspireApiResponse): InferenceResult {
  console.log('[mapApiResponseToInferenceResult] Raw response:', JSON.stringify(response, null, 2));

  // Handle different possible field names and formats
  const rawResponse = response as Record<string, unknown>;

  const prediction = (response.prediction || rawResponse['Prediction'] || rawResponse['result'] || 'Unknown') as 'Healthy' | 'ASD';

  // Try multiple possible field names for probability
  let probability = response.probability;
  if (probability === undefined || probability === null || isNaN(Number(probability))) {
    probability = rawResponse['Probability'] as number
      ?? rawResponse['prob'] as number
      ?? rawResponse['score'] as number
      ?? 0.5;
  }
  probability = Number(probability);
  if (isNaN(probability)) probability = 0.5;

  // Try multiple possible field names for confidence
  let confidence = response.confidence;
  if (confidence === undefined || confidence === null || isNaN(Number(confidence))) {
    confidence = rawResponse['Confidence'] as number ?? 0.8;
  }
  confidence = Number(confidence);
  if (isNaN(confidence)) confidence = 0.8;

  // Try multiple possible field names for risk_level
  let riskLevel: RiskLevel = response.risk_level
    || rawResponse['risk_level'] as RiskLevel
    || rawResponse['riskLevel'] as RiskLevel
    || rawResponse['Risk_Level'] as RiskLevel;

  if (!riskLevel) {
    // Calculate from probability if not provided
    if (probability >= 0.7) {
      riskLevel = 'high';
    } else if (probability >= 0.4) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    console.log('[mapApiResponseToInferenceResult] risk_level not in response, calculated:', riskLevel);
  }

  console.log('[mapApiResponseToInferenceResult] Parsed values:', { prediction, probability, confidence, riskLevel });

  // Generate explanation based on risk level and prediction
  const probPercent = isNaN(probability) ? 'N/A' : `${(probability * 100).toFixed(1)}%`;
  const explanationMap: Record<RiskLevel, string> = {
    low: `The screening indicates a low probability (${probPercent}) of ASD markers. This suggests typical developmental patterns based on the clinical data provided.`,
    medium: `The screening indicates a moderate probability (${probPercent}) of ASD markers. Further clinical assessment may be warranted to clarify the developmental profile.`,
    high: `The screening indicates a high probability (${probPercent}) of ASD markers. A comprehensive specialist evaluation is strongly recommended.`
  };

  // Generate recommended actions based on prediction and risk level
  const actionsMap: Record<RiskLevel, string[]> = {
    low: [
      'Continue routine developmental monitoring.',
      'Schedule standard follow-up appointments.',
      'Inform caregivers of typical developmental expectations.'
    ],
    medium: [
      'Consider additional developmental assessments.',
      'Monitor for emerging behavioral patterns.',
      'Discuss findings with a developmental specialist.',
      'Schedule follow-up evaluation in 3-6 months.'
    ],
    high: [
      'Refer to a developmental pediatrician or child psychiatrist.',
      'Initiate comprehensive ASD evaluation.',
      'Consider early intervention services while awaiting formal diagnosis.',
      'Provide family with ASD educational resources.',
      'Schedule urgent specialist consultation.'
    ]
  };

  // Build categories - ensure probability is a valid number
  const safeProbability = isNaN(probability) ? 0.5 : probability;
  const categories = [
    {
      label: prediction === 'ASD' ? 'ASD' : 'Healthy',
      probability: prediction === 'ASD' ? safeProbability : (1 - safeProbability),
      narrative:
        prediction === 'ASD'
          ? 'Elevated markers consistent with Autism Spectrum Disorder patterns.'
          : 'Clinical profile within typical developmental range.'
    },
    {
      label: prediction === 'ASD' ? 'Healthy' : 'ASD',
      probability: prediction === 'ASD' ? (1 - safeProbability) : safeProbability,
      narrative:
        prediction === 'ASD'
          ? 'Typical development indicators present.'
          : 'Some markers may warrant monitoring.'
    }
  ];

  return {
    topPrediction: prediction || 'Unknown',
    prediction,
    probability: safeProbability,
    confidence: isNaN(confidence) ? 0.8 : confidence,
    riskLevel,
    categories,
    explanation: explanationMap[riskLevel] || 'Analysis complete. Please consult with a healthcare professional for interpretation.',
    recommendedActions: actionsMap[riskLevel] || ['Consult with a qualified healthcare professional for guidance.']
  };
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
