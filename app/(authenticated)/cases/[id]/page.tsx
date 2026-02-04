import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProbabilityBars } from '@/components/probability-bars';
import { RetryButton } from '@/components/retry-button';
import { loadCaseRecord, loadInferenceJob } from '@/lib/data-platform';
import { formatDate } from '@/lib/format';
import { Hero } from '@/components/hero';
import type { InferenceResult, RiskLevel } from '@/lib/types';

// Normalize inference data - extract values from raw API response or mapped result
function normalizeInference(inference: any): InferenceResult {
  if (!inference || typeof inference !== 'object') {
    return {
      topPrediction: 'Pending',
      categories: [],
      explanation: 'Analysis pending.',
      recommendedActions: []
    };
  }

  // Check if topPrediction/prediction contains the raw API response (nested object)
  const rawData = inference.topPrediction?.request_id ? inference.topPrediction :
                  inference.prediction?.request_id ? inference.prediction :
                  inference.request_id ? inference : null;

  if (rawData) {
    // Extract from raw API response
    const prediction = rawData.prediction;
    const probability = Number(rawData.probability);
    const confidence = Number(rawData.confidence);
    const riskLevel = rawData.risk_level;

    return {
      topPrediction: prediction,
      prediction,
      probability,
      confidence,
      riskLevel,
      categories: [
        { label: prediction, probability },
        { label: prediction === 'ASD' ? 'Healthy' : 'ASD', probability: 1 - probability }
      ],
      explanation: `${prediction} with ${(probability * 100).toFixed(1)}% probability.`,
      recommendedActions: []
    };
  }

  // Already properly formatted
  return inference;
}

const riskLevelStyles: Record<RiskLevel, { background: string; color: string; border: string }> = {
  low: {
    background: 'rgba(34, 197, 94, 0.1)',
    color: 'rgb(22, 163, 74)',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  },
  medium: {
    background: 'rgba(245, 158, 11, 0.1)',
    color: 'rgb(217, 119, 6)',
    border: '1px solid rgba(245, 158, 11, 0.3)'
  },
  high: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'rgb(220, 38, 38)',
    border: '1px solid rgba(239, 68, 68, 0.3)'
  }
};

const intellectualDisabilityLabels: Record<string, string> = {
  N: 'None',
  'F70.0': 'Mild (F70.0)',
  F71: 'Moderate (F71)',
  F72: 'Severe (F72)'
};

// Force dynamic rendering (don't statically generate at build time)
export const dynamic = 'force-dynamic';

type CaseDetailPageProps = {
  params: { id: string };
};

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const record = await loadCaseRecord(params.id);
  if (!record) {
    notFound();
  }

  const job = record.jobId ? await loadInferenceJob(record.jobId) : undefined;

  // Normalize inference data in case it's stored as raw API response
  console.log('[CaseDetailPage] Raw record.inference:', JSON.stringify(record.inference, null, 2));
  const inference = normalizeInference(record.inference);
  console.log('[CaseDetailPage] Normalized inference:', JSON.stringify(inference, null, 2));

  return (
    <main className="page-shell">
      <Hero title="Case Detail" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/cases" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
          ← Back to cases
        </Link>
        <Link
          href={`/predict?caseId=${record.id}`}
          style={{
            padding: '0.6rem 1.1rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--color-border)',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'var(--color-accent)'
          }}
        >
          Open predictive lab →
        </Link>
      </div>
      <header
        className="card"
        style={{ padding: 'clamp(1.4rem, 4.5vw, 1.8rem)', display: 'grid', gap: '0.6rem' }}
      >
        <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 1.9rem)' }}>{record.demographics.caseLabel}</h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
          Submitted {formatDate(record.submittedAt)} · {record.demographics.ageMonths} months ·{' '}
          {record.demographics.sex}
        </p>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-secondary)' }}>{record.notes}</p>
      </header>

      {job ? (
        <section
          className="card"
          style={{ padding: 'clamp(1.35rem, 4vw, 1.7rem)', display: 'grid', gap: '1rem' }}
        >
          <header>
            <p className="section-title">Inference job</p>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.15rem, 3.4vw, 1.3rem)', fontWeight: 600 }}>
              Ratio1 execution details
            </h2>
          </header>
          <dl
            style={{
              margin: 0,
              display: 'grid',
              gap: '0.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
            }}
          >
            <div>
              <dt style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                Job ID
              </dt>
              <dd style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{job.id}</dd>
            </div>
            <div>
              <dt style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                Status
              </dt>
              <dd style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{job.status}</dd>
            </div>
            <div>
              <dt style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                Payload CID
              </dt>
              <dd style={{ margin: '0.2rem 0 0', fontWeight: 600, overflowWrap: 'anywhere' }}>
                {job.payloadCid ? <code style={{ wordBreak: 'break-all' }}>{job.payloadCid}</code> : '-'}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                Submitted
              </dt>
              <dd style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{formatDate(job.submittedAt)}</dd>
            </div>
            {job.edgeNode ? (
              <div>
                <dt style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                  Edge node
                </dt>
                <dd style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{job.edgeNode}</dd>
              </div>
            ) : null}
          </dl>
          {job.statusHistory && job.statusHistory.length ? (
            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: '1rem',
                display: 'grid',
                gap: '0.5rem'
              }}
            >
              <p className="section-title" style={{ fontSize: '0.75rem' }}>
                Status history
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.4rem' }}>
                {job.statusHistory.map((entry) => (
                  <li key={`${entry.status}-${entry.timestamp}`} style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{entry.status}</strong> · {formatDate(entry.timestamp)}
                    {entry.message ? ` – ${entry.message}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {job.status === 'failed' && (
            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                The analysis failed. You can retry the prediction request.
              </p>
              <RetryButton caseId={record.id} />
            </div>
          )}
        </section>
      ) : null}

      <section className="grid-two" style={{ alignItems: 'start' }}>
        <article
          className="card"
          style={{ padding: 'clamp(1.35rem, 4vw, 1.7rem)', display: 'grid', gap: '1rem' }}
        >
          <header>
            <p className="section-title">Inference outcome</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.2rem, 3.4vw, 1.4rem)', fontWeight: 600 }}>
                {typeof inference.prediction === 'string' ? inference.prediction :
                 typeof inference.topPrediction === 'string' ? inference.topPrediction : 'Analysis Complete'}
              </h2>
              {inference.riskLevel && typeof inference.riskLevel === 'string' && riskLevelStyles[inference.riskLevel] && (
                <span
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    ...riskLevelStyles[inference.riskLevel]
                  }}
                >
                  {inference.riskLevel} risk
                </span>
              )}
            </div>
          </header>
          {inference.probability !== undefined && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '1rem'
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                  Probability
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>
                  {(inference.probability * 100).toFixed(1)}%
                </p>
              </div>
              {inference.confidence !== undefined && (
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    Confidence
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>
                    {(inference.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}
          {inference.categories && Array.isArray(inference.categories) && inference.categories.length > 0 && (
            <ProbabilityBars categories={inference.categories} />
          )}
          {inference.explanation && typeof inference.explanation === 'string' && (
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {inference.explanation}
            </p>
          )}
        </article>
        <article
          className="card"
          style={{ padding: 'clamp(1.35rem, 4vw, 1.7rem)', display: 'grid', gap: '0.75rem' }}
        >
          <p className="section-title">Recommended next steps</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.5rem' }}>
            {(Array.isArray(inference.recommendedActions) ? inference.recommendedActions : []).map((action, idx) => (
              <li key={typeof action === 'string' ? action : idx} style={{ lineHeight: 1.55 }}>
                {typeof action === 'string' ? action : 'See healthcare professional'}
              </li>
            ))}
            {(!inference.recommendedActions || inference.recommendedActions.length === 0) && (
              <li style={{ lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>
                Consult with a qualified healthcare professional for guidance.
              </li>
            )}
          </ul>
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.85rem',
              borderRadius: '0.75rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}
          >
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgb(180, 83, 9)', lineHeight: 1.5 }}>
              <strong>Clinical Disclaimer:</strong> This is a screening tool, not a diagnostic instrument.
              Results should be interpreted by qualified healthcare professionals.
              Clinical follow-up is recommended regardless of the screening outcome.
            </p>
          </div>
        </article>
      </section>

      <section
        className="card"
        style={{ padding: 'clamp(1.35rem, 4vw, 1.7rem)', display: 'grid', gap: '1.4rem' }}
      >
        <header>
          <p className="section-title">Clinical profile</p>
          <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.15rem, 3.3vw, 1.35rem)', fontWeight: 600 }}>
            Data shared with Ratio1 Edge Node
          </h2>
        </header>
        <div className="grid-two">
          <DataList
            title="Demographics"
            items={[
              ['Prenatal factors', record.demographics.prenatalFactors.join(', ')],
              ['Diagnostic age', `${record.demographics.diagnosticAgeMonths} months`],
              [
                'Parental age',
                `Mother ${record.demographics.parentalAge.mother}, Father ${record.demographics.parentalAge.father}`
              ]
            ]}
          />
          <DataList
            title="Development & behavior"
            items={[
              ['Delays', record.development.delays.join(', ')],
              ['Dysmorphic features', record.development.dysmorphicFeatures ? 'Yes' : 'No'],
              ['Intellectual disability', intellectualDisabilityLabels[record.development.intellectualDisability] || record.development.intellectualDisability || '-'],
              ['Regression', record.development.regressionObserved ? 'Yes' : 'No'],
              ['Comorbidities', record.development.comorbidities.join(', ') || '-'],
              ['Behavioral concerns', record.behaviors.concerns.join(', ')],
              ['Language level', record.behaviors.languageLevel],
              ['Sensory notes', record.behaviors.sensoryNotes || '-']
            ]}
          />
          <DataList
            title="Assessments"
            items={[
              ['ADOS score', record.assessments.adosScore.toString()],
              ['ADI-R score', record.assessments.adirScore.toString()],
              ['IQ / DQ', record.assessments.iqDq?.toString() ?? '-'],
              ['EEG anomalies', record.assessments.eegAnomalies ? 'Detected' : 'None'],
              ['MRI findings', record.assessments.mriFindings ?? '-'],
              ['Neurological exam', record.assessments.neurologicalExam || '-'],
              ['Head circumference', `${record.assessments.headCircumference} cm`]
            ]}
          />
        </div>
      </section>
    </main>
  );
}

function DataList({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div
      style={{
        padding: 'clamp(0.95rem, 3.5vw, 1.1rem)',
        borderRadius: '1rem',
        border: '1px solid var(--color-border)',
        display: 'grid',
        gap: '0.6rem',
        background: 'linear-gradient(135deg, rgba(220, 233, 255, 0.82), rgba(240, 246, 255, 0.95))'
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{title}</p>
      <dl style={{ margin: 0, display: 'grid', gap: '0.4rem' }}>
        {items.map(([label, value]) => (
          <div key={label} className="data-item">
            <dt style={{ color: 'var(--color-text-secondary)' }}>{label}</dt>
            <dd className="data-value">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
