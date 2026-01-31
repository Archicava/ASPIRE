'use client';

import { type CSSProperties, FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { useToast } from '@/components/toast';
import type { CaseRecord, CaseSubmission, IntellectualDisability } from '@/lib/types';

const prenatalOptions = ['Natural', 'IVF', 'Twin', 'Complication'] as const;
const delayOptions = ['None', 'Motor', 'Language', 'Cognitive', 'Global'] as const;
const concernOptions = [
  'Aggressivity',
  'Self-injury',
  'Agitation',
  'Stereotypy',
  'Hyperactivity',
  'Sleep',
  'Sensory'
] as const;
const intellectualDisabilityOptions = [
  { value: 'N', label: 'None' },
  { value: 'F70.0', label: 'Mild (F70.0)' },
  { value: 'F71', label: 'Moderate (F71)' },
  { value: 'F72', label: 'Severe (F72)' }
] as const;

const fieldLabels: Record<string, string> = {
  caseLabel: 'Case label',
  ageMonths: 'Age (months)',
  sex: 'Sex',
  parentalAgeMother: 'Parental age - mother',
  parentalAgeFather: 'Parental age - father',
  diagnosticAgeMonths: 'Diagnostic age',
  prenatalFactors: 'Prenatal factors',
  delays: 'Developmental delays',
  dysmorphicFeatures: 'Dysmorphic features',
  intellectualDisability: 'Intellectual disability',
  comorbidities: 'Comorbidities',
  regressionObserved: 'Regression',
  adosScore: 'ADOS score',
  adirScore: 'ADI-R score',
  iqDq: 'IQ / Developmental Quotient',
  eegAnomalies: 'EEG anomalies',
  mriFindings: 'MRI findings',
  neurologicalExam: 'Neurological examination',
  headCircumference: 'Head circumference',
  concerns: 'Behavioral concerns',
  languageLevel: 'Language level',
  sensoryNotes: 'Sensory notes',
  notes: 'Clinical notes'
};

const schema = z.object({
  caseLabel: z.string().min(2),
  ageMonths: z.number().min(6).max(216),
  sex: z.enum(['Male', 'Female']),
  parentalAgeMother: z.number().min(16).max(55),
  parentalAgeFather: z.number().min(16).max(70),
  diagnosticAgeMonths: z.number().min(6).max(216),
  prenatalFactors: z.array(z.enum(prenatalOptions)).min(1),
  delays: z.array(z.enum(delayOptions)).min(1),
  dysmorphicFeatures: z.boolean(),
  intellectualDisability: z.enum(['N', 'F70.0', 'F71', 'F72']),
  comorbidities: z.string(),
  regressionObserved: z.boolean(),
  adosScore: z.number().min(1).max(30),
  adirScore: z.number().min(1).max(40),
  iqDq: z.number().min(20).max(150),
  eegAnomalies: z.boolean(),
  mriFindings: z.string().optional(),
  neurologicalExam: z.string().min(1),
  headCircumference: z.number().min(40).max(60),
  concerns: z.array(z.enum(concernOptions)).min(1),
  languageLevel: z.enum(['Functional', 'Delayed', 'Absent']),
  sensoryNotes: z.string().optional(),
  notes: z.string().min(10)
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  caseLabel: '',
  ageMonths: 48,
  sex: 'Male',
  parentalAgeMother: 32,
  parentalAgeFather: 35,
  diagnosticAgeMonths: 18,
  prenatalFactors: ['Natural'],
  delays: ['Language'],
  dysmorphicFeatures: false,
  intellectualDisability: 'N',
  comorbidities: '',
  regressionObserved: false,
  adosScore: 12,
  adirScore: 20,
  iqDq: 85,
  eegAnomalies: false,
  mriFindings: '',
  neurologicalExam: 'N',
  headCircumference: 50,
  concerns: ['Sensory'],
  languageLevel: 'Delayed',
  sensoryNotes: '',
  notes: ''
};

export function CaseForm() {
  const [values, setValues] = useState<FormValues>(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleToggle = <K extends keyof FormValues>(key: K, option: string) => {
    setValues((prev) => {
      const current = prev[key];
      if (Array.isArray(current)) {
        const arr = current as string[];
        const exists = arr.includes(option);
        const next = exists ? arr.filter((item) => item !== option) : [...arr, option];
        return { ...prev, [key]: next };
      }
      return prev;
    });
  };

  const handleBoolean = <K extends keyof FormValues>(key: K, value: boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const numericChange =
    <K extends keyof FormValues>(key: K) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [key]: Number(event.target.value) }));
    };

  const textChange =
    <K extends keyof FormValues>(key: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const validationErrors: Record<string, string> = {};
      const errorFields: string[] = [];
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        validationErrors[path] = issue.message;
        errorFields.push(fieldLabels[path] || path);
      });
      setErrors(validationErrors);
      console.error('[CaseForm] Validation errors:', validationErrors);
      toast.show({
        title: 'Validation failed',
        description: errorFields.length === 1
          ? `Please check: ${errorFields[0]}`
          : `Please check ${errorFields.length} fields: ${errorFields.slice(0, 3).join(', ')}${errorFields.length > 3 ? '...' : ''}`,
        tone: 'danger'
      });
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const submission = toSubmission(values);
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        throw new Error('Failed to submit case');
      }

      const created: CaseRecord = await response.json();

      toast.show({
        title: 'Case staged for inference',
        description: 'Submission persisted to Ratio1 CStore; awaiting edge node inference.',
        tone: 'success'
      });

      router.push(`/cases/${created.id}`);
    } catch (error) {
      console.error('Case submission failed', error);
      toast.show({
        title: 'Submission failed',
        description: 'Retry or check the platform logs for more detail.',
        tone: 'danger'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const computedComplexity = useMemo(() => {
    const factors = values.prenatalFactors.length + values.concerns.length;
    if (factors >= 5) return 'High complexity';
    if (factors >= 3) return 'Moderate complexity';
    return 'Targeted profile';
  }, [values.concerns.length, values.prenatalFactors.length]);

  return (
    <form
      onSubmit={handleSubmit}
      className="card fade-in"
      style={{
        padding: 'clamp(1.5rem, 4.5vw, 2rem)',
        display: 'grid',
        gap: 'clamp(1.5rem, 4.5vw, 2rem)'
      }}
    >
      <header style={{ display: 'grid', gap: '0.6rem' }}>
        <span className="pill">Case submission wizard</span>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 1.85rem)' }}>
          Describe the clinical presentation
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Capture the full ASD profile across prenatal history, developmental milestones, and
          neuro-behavioral assessments. Data stays on-device until you dispatch the Ratio1 job.
        </p>
        <span
          className="pill"
          style={{
            background: 'rgba(91, 108, 240, 0.1)',
            color: 'var(--color-accent)'
          }}
        >
          {computedComplexity}
        </span>
      </header>

      <section style={{ display: 'grid', gap: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Demographics</h2>
        <div className="grid-two form-grid">
          <Field label="Case label" error={errors.caseLabel}>
            <input
              value={values.caseLabel}
              onChange={textChange('caseLabel')}
              style={inputStyle}
              placeholder="Popescu, 4y"
            />
          </Field>
          <Field label="Age (months)">
            <input
              type="number"
              min={6}
              max={216}
              value={values.ageMonths}
              onChange={numericChange('ageMonths')}
              style={inputStyle}
            />
          </Field>
          <Field label="Sex">
            <select value={values.sex} onChange={textChange('sex')} style={inputStyle}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
          <Field label="Diagnostic age (months)">
            <input
              type="number"
              min={6}
              max={216}
              value={values.diagnosticAgeMonths}
              onChange={numericChange('diagnosticAgeMonths')}
              style={inputStyle}
            />
          </Field>
          <Field label="Parental age - mother">
            <input
              type="number"
              min={16}
              max={55}
              value={values.parentalAgeMother}
              onChange={numericChange('parentalAgeMother')}
              style={inputStyle}
            />
          </Field>
          <Field label="Parental age - father">
            <input
              type="number"
              min={16}
              max={70}
              value={values.parentalAgeFather}
              onChange={numericChange('parentalAgeFather')}
              style={inputStyle}
            />
          </Field>
        </div>
        <CheckboxGroup
          label="Prenatal and perinatal factors"
          options={prenatalOptions}
          values={values.prenatalFactors}
          onToggle={(option) => handleToggle('prenatalFactors', option)}
          error={errors.prenatalFactors}
        />
      </section>

      <section style={{ display: 'grid', gap: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Developmental profile</h2>
        <CheckboxGroup
          label="Developmental delays"
          options={delayOptions}
          values={values.delays}
          onToggle={(option) => handleToggle('delays', option)}
          error={errors.delays}
        />
        <div className="grid-two form-grid">
          <ToggleRow
            label="Dysmorphic features observed"
            value={values.dysmorphicFeatures}
            onChange={(val) => handleBoolean('dysmorphicFeatures', val)}
          />
          <ToggleRow
            label="Regression documented"
            value={values.regressionObserved}
            onChange={(val) => handleBoolean('regressionObserved', val)}
          />
          <Field label="Intellectual disability">
            <select
              value={values.intellectualDisability}
              onChange={textChange('intellectualDisability')}
              style={inputStyle}
            >
              {intellectualDisabilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Comorbidities">
          <input
            value={values.comorbidities}
            onChange={textChange('comorbidities')}
            style={inputStyle}
            placeholder="Epilepsy, GI disturbance"
          />
        </Field>
      </section>

      <section style={{ display: 'grid', gap: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Clinical assessments</h2>
        <div className="grid-two form-grid">
          <Field label="ADOS calibrated score">
            <input
              type="number"
              min={1}
              max={30}
              value={values.adosScore}
              onChange={numericChange('adosScore')}
              style={inputStyle}
            />
          </Field>
          <Field label="ADI-R total">
            <input
              type="number"
              min={1}
              max={40}
              value={values.adirScore}
              onChange={numericChange('adirScore')}
              style={inputStyle}
            />
          </Field>
          <Field label="Head circumference (cm)">
            <input
              type="number"
              min={40}
              max={60}
              value={values.headCircumference}
              onChange={numericChange('headCircumference')}
              style={inputStyle}
            />
          </Field>
          <Field label="IQ / Developmental Quotient" error={errors.iqDq}>
            <input
              type="number"
              min={20}
              max={150}
              value={values.iqDq}
              onChange={numericChange('iqDq')}
              style={inputStyle}
              placeholder="20-150"
            />
          </Field>
        </div>
        <ToggleRow
          label="EEG anomalies"
          value={values.eegAnomalies}
          onChange={(val) => handleBoolean('eegAnomalies', val)}
        />
        <Field label="MRI findings">
          <textarea
            value={values.mriFindings ?? ''}
            onChange={textChange('mriFindings')}
            rows={3}
            style={textareaStyle}
            placeholder="Normal structural MRI"
          />
        </Field>
        <Field label="Neurological examination" error={errors.neurologicalExam}>
          <textarea
            value={values.neurologicalExam}
            onChange={textChange('neurologicalExam')}
            rows={2}
            style={textareaStyle}
            placeholder="N for normal, or describe abnormalities (e.g., hypotonia, abnormal reflexes)"
          />
        </Field>
      </section>

      <section style={{ display: 'grid', gap: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Behavior and sensory profile</h2>
        <CheckboxGroup
          label="Behavioral concerns"
          options={concernOptions}
          values={values.concerns}
          onToggle={(option) => handleToggle('concerns', option)}
          error={errors.concerns}
        />
        <Field label="Language level">
          <select value={values.languageLevel} onChange={textChange('languageLevel')} style={inputStyle}>
            <option value="Functional">Functional</option>
            <option value="Delayed">Delayed</option>
            <option value="Absent">Absent</option>
          </select>
        </Field>
        <Field label="Sensory notes">
          <textarea
            value={values.sensoryNotes ?? ''}
            onChange={textChange('sensoryNotes')}
            rows={3}
            style={textareaStyle}
            placeholder="Seeks proprioceptive input, hypersensitive to auditory stimuli"
          />
        </Field>
      </section>

      <section style={{ display: 'grid', gap: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Clinical narrative</h2>
        <Field label="Notes" error={errors.notes}>
          <textarea
            value={values.notes}
            onChange={textChange('notes')}
            rows={5}
            style={textareaStyle}
            placeholder="Summarize primary concerns, intervention history, and family context."
          />
        </Field>
      </section>

      <footer className="form-footer">
        {Object.keys(errors).length > 0 && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              width: '100%'
            }}
          >
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'rgb(220, 38, 38)' }}>
              Please fix the following errors:
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'rgb(185, 28, 28)' }}>
              {Object.entries(errors).map(([field, message]) => (
                <li key={field} style={{ fontSize: '0.9rem' }}>
                  <strong>{fieldLabels[field] || field}:</strong> {message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p
          style={{
            margin: 0,
            color: 'var(--color-text-secondary)',
            fontSize: 'clamp(0.9rem, 2.5vw, 0.95rem)',
            lineHeight: 1.5
          }}
        >
          Submission encrypts data client-side and registers job metadata within CStore namespace ASD-RO-01.
        </p>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: 'clamp(0.75rem, 2.8vw, 0.95rem) clamp(1.6rem, 5vw, 2.1rem)',
            borderRadius: '999px',
            background: 'var(--color-accent)',
            color: 'white',
            fontWeight: 600,
            fontSize: 'clamp(0.95rem, 2.8vw, 1rem)',
            border: 'none',
            cursor: 'pointer',
            opacity: submitting ? 0.65 : 1
          }}
        >
          {submitting ? 'Queuing job…' : 'Dispatch inference'}
        </button>
      </footer>
    </form>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span style={{ fontWeight: 600 }}>{label}</span>
      {children}
      {error ? (
        <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{error}</span>
      ) : null}
    </label>
  );
}

function CheckboxGroup({
  label,
  options,
  values,
  onToggle,
  error
}: {
  label: string;
  options: readonly string[];
  values: readonly string[];
  onToggle: (value: string) => void;
  error?: string;
}) {
  return (
    <div style={{ display: 'grid', gap: '0.9rem' }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.65rem'
        }}
      >
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
          style={{
            padding: 'clamp(0.45rem, 2.2vw, 0.55rem) clamp(0.85rem, 3.6vw, 1.1rem)',
            borderRadius: '999px',
            border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
            background: active ? 'var(--color-accent-soft)' : 'rgba(226, 236, 255, 0.9)',
            color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error ? (
        <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{error}</span>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(0.75rem, 3vw, 0.9rem) clamp(0.95rem, 3.6vw, 1.2rem)',
        borderRadius: '0.9rem',
        border: '1px solid var(--color-border)',
        background: 'linear-gradient(135deg, rgba(222, 234, 255, 0.82), rgba(240, 247, 255, 0.94))',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}
    >
      <span style={{ fontWeight: 600 }}>{label}</span>
      <label style={{ position: 'relative', width: '42px', height: '24px' }}>
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
          style={{ display: 'none' }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '999px',
            background: value ? 'var(--color-accent)' : 'var(--color-border)',
            transition: 'all 150ms ease'
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: '3px',
            left: value ? '22px' : '3px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'var(--color-card)',
            transition: 'left 150ms ease',
            boxShadow: '0 4px 12px rgba(11, 28, 61, 0.2)'
          }}
        />
      </label>
    </div>
  );
}

const inputStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.85rem',
  border: '1px solid var(--color-border)',
  fontSize: 'clamp(0.95rem, 2.6vw, 1rem)',
  background: 'rgba(234, 242, 255, 0.95)',
  width: '100%'
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical'
};

function toSubmission(values: FormValues): CaseSubmission {
  return {
    demographics: {
      caseLabel: values.caseLabel,
      ageMonths: values.ageMonths,
      sex: values.sex,
      parentalAge: {
        mother: values.parentalAgeMother,
        father: values.parentalAgeFather
      },
      diagnosticAgeMonths: values.diagnosticAgeMonths,
      prenatalFactors: [...values.prenatalFactors]
    },
    development: {
      delays: [...values.delays],
      dysmorphicFeatures: values.dysmorphicFeatures,
      intellectualDisability: values.intellectualDisability as IntellectualDisability,
      comorbidities: values.comorbidities
        ? values.comorbidities.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
      regressionObserved: values.regressionObserved
    },
    assessments: {
      adosScore: values.adosScore,
      adirScore: values.adirScore,
      iqDq: values.iqDq,
      eegAnomalies: values.eegAnomalies,
      mriFindings: values.mriFindings?.trim() ? values.mriFindings.trim() : null,
      neurologicalExam: values.neurologicalExam.trim() || 'N',
      headCircumference: values.headCircumference
    },
    behaviors: {
      concerns: [...values.concerns],
      languageLevel: values.languageLevel,
      sensoryNotes: values.sensoryNotes?.trim() ?? ''
    },
    notes: values.notes.trim()
  };
}
