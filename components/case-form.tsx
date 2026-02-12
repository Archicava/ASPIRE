'use client';

import { type CSSProperties, FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { useToast } from '@/components/toast';
import type { CaseRecord, CaseSubmission, IntellectualDisability } from '@/lib/types';

const prenatalOptions = ['Natural', 'IVF', 'Twin', 'Complication'] as const;
const delayOptions = ['None', 'Motor', 'Language', 'Cognitive', 'Global'] as const;
const concernOptions = [
  'None',
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
  languageDisorder: 'Language disorder diagnosed',
  sensoryNotes: 'Sensory notes',
  notes: 'Clinical notes'
};

const fieldDescriptions: Record<string, string> = {
  caseLabel: 'A unique identifier for this case, such as patient initials and age. Used for your reference only.',
  ageMonths: 'Current age of the child in months. Provides developmental context for the assessment.',
  sex: 'Biological sex. ASD is more commonly diagnosed in males (4:1 ratio).',
  parentalAgeMother: 'Mother\'s age at the time of birth. Advanced parental age is associated with increased ASD risk.',
  parentalAgeFather: 'Father\'s age at the time of birth. Paternal age over 40 is linked to higher ASD likelihood.',
  diagnosticAgeMonths: 'Age when the ASD evaluation was conducted. Earlier diagnosis enables earlier intervention.',
  prenatalFactors: 'Pregnancy and birth circumstances that may influence neurodevelopment.',
  delays: 'Areas where developmental milestones were delayed. Select all that apply.',
  dysmorphicFeatures: 'Observable physical anomalies that may suggest underlying genetic conditions.',
  intellectualDisability: 'Formal classification of intellectual functioning based on ICD-10 criteria.',
  comorbidities: 'Other medical conditions present alongside the primary concern (e.g., epilepsy, GI issues).',
  regressionObserved: 'Loss of previously acquired skills, typically occurring between 15-24 months of age.',
  adosScore: 'Autism Diagnostic Observation Schedule - a standardized assessment measuring social and communication behaviors.',
  adirScore: 'Autism Diagnostic Interview-Revised - a structured parent interview covering developmental history.',
  iqDq: 'Measure of cognitive ability. Scores below 70 typically indicate intellectual disability.',
  eegAnomalies: 'Abnormal patterns in brain electrical activity detected through electroencephalography.',
  mriFindings: 'Results from brain imaging that may reveal structural differences or abnormalities.',
  neurologicalExam: 'Clinical assessment of nervous system function. Enter "N" for normal or describe any findings.',
  headCircumference: 'Head size measurement. Unusually large head size (macrocephaly) is observed in some children with ASD.',
  concerns: 'Behavioral patterns that may be relevant to the assessment. Select all that apply.',
  languageLevel: 'Current level of expressive and receptive language ability.',
  languageDisorder: 'Whether a formal language disorder diagnosis exists, separate from general language delays.',
  sensoryNotes: 'Observations about sensory processing, such as over- or under-sensitivity to stimuli.',
  notes: 'Additional clinical observations or context that may be relevant to the case.'
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
  languageDisorder: z.preprocess((val) => val ?? false, z.boolean()),
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
  delays: ['None'],
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
  concerns: ['None'],
  languageLevel: 'Functional',
  languageDisorder: false,
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

        // Special handling for fields with 'None' option (delays, concerns)
        if (key === 'delays' || key === 'concerns') {
          if (option === 'None') {
            // If selecting 'None', clear all others and set only 'None'
            // If deselecting 'None', just remove it
            return { ...prev, [key]: exists ? [] : ['None'] };
          } else {
            // If selecting another option, remove 'None' if present
            const withoutNone = arr.filter((item) => item !== 'None');
            const next = exists
              ? withoutNone.filter((item) => item !== option)
              : [...withoutNone, option];
            return { ...prev, [key]: next };
          }
        }

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
          <Field label="Case label" error={errors.caseLabel} info={fieldDescriptions.caseLabel}>
            <input
              value={values.caseLabel}
              onChange={textChange('caseLabel')}
              style={inputStyle}
              placeholder="Popescu, 4y"
            />
          </Field>
          <Field label="Age (months)" info={fieldDescriptions.ageMonths}>
            <input
              type="number"
              min={6}
              max={216}
              value={values.ageMonths}
              onChange={numericChange('ageMonths')}
              style={inputStyle}
            />
          </Field>
          <Field label="Sex" info={fieldDescriptions.sex}>
            <select value={values.sex} onChange={textChange('sex')} style={inputStyle}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
          <Field label="Diagnostic age (months)" info={fieldDescriptions.diagnosticAgeMonths}>
            <input
              type="number"
              min={6}
              max={216}
              value={values.diagnosticAgeMonths}
              onChange={numericChange('diagnosticAgeMonths')}
              style={inputStyle}
            />
          </Field>
          <Field label="Parental age - mother" info={fieldDescriptions.parentalAgeMother}>
            <input
              type="number"
              min={16}
              max={55}
              value={values.parentalAgeMother}
              onChange={numericChange('parentalAgeMother')}
              style={inputStyle}
            />
          </Field>
          <Field label="Parental age - father" info={fieldDescriptions.parentalAgeFather}>
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
          info={fieldDescriptions.prenatalFactors}
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
          info={fieldDescriptions.delays}
        />
        <div className="grid-two form-grid">
          <ToggleRow
            label="Dysmorphic features observed"
            value={values.dysmorphicFeatures}
            onChange={(val) => handleBoolean('dysmorphicFeatures', val)}
            info={fieldDescriptions.dysmorphicFeatures}
          />
          <ToggleRow
            label="Regression documented"
            value={values.regressionObserved}
            onChange={(val) => handleBoolean('regressionObserved', val)}
            info={fieldDescriptions.regressionObserved}
          />
          <Field label="Intellectual disability" info={fieldDescriptions.intellectualDisability}>
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
        <Field label="Comorbidities" info={fieldDescriptions.comorbidities}>
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
          <Field label="ADOS calibrated score" info={fieldDescriptions.adosScore}>
            <input
              type="number"
              min={1}
              max={30}
              value={values.adosScore}
              onChange={numericChange('adosScore')}
              style={inputStyle}
            />
          </Field>
          <Field label="ADI-R total" info={fieldDescriptions.adirScore}>
            <input
              type="number"
              min={1}
              max={40}
              value={values.adirScore}
              onChange={numericChange('adirScore')}
              style={inputStyle}
            />
          </Field>
          <Field label="Head circumference (cm)" info={fieldDescriptions.headCircumference}>
            <input
              type="number"
              min={40}
              max={60}
              value={values.headCircumference}
              onChange={numericChange('headCircumference')}
              style={inputStyle}
            />
          </Field>
          <Field label="IQ / Developmental Quotient" error={errors.iqDq} info={fieldDescriptions.iqDq}>
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
          info={fieldDescriptions.eegAnomalies}
        />
        <Field label="MRI findings" info={fieldDescriptions.mriFindings}>
          <textarea
            value={values.mriFindings ?? ''}
            onChange={textChange('mriFindings')}
            rows={3}
            style={textareaStyle}
            placeholder="Normal structural MRI"
          />
        </Field>
        <Field label="Neurological examination" error={errors.neurologicalExam} info={fieldDescriptions.neurologicalExam}>
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
          info={fieldDescriptions.concerns}
        />
        <Field label="Language level" info={fieldDescriptions.languageLevel}>
          <select value={values.languageLevel} onChange={textChange('languageLevel')} style={inputStyle}>
            <option value="Functional">Functional</option>
            <option value="Delayed">Delayed</option>
            <option value="Absent">Absent</option>
          </select>
        </Field>
        <ToggleRow
          label="Language disorder diagnosed"
          value={values.languageDisorder}
          onChange={(val) => handleBoolean('languageDisorder', val)}
          info={fieldDescriptions.languageDisorder}
        />
        <Field label="Sensory notes" info={fieldDescriptions.sensoryNotes}>
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
        <Field label="Notes" error={errors.notes} info={fieldDescriptions.notes}>
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

function InfoTooltip({ text }: { text: string }) {
  return (
    <span
      className="info-tooltip"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '0.4rem',
        cursor: 'help'
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="5" r="0.75" fill="currentColor" />
      </svg>
      <span
        className="tooltip-content"
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.6rem 0.8rem',
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '0.8rem',
          lineHeight: 1.4,
          color: 'var(--color-text-secondary)',
          width: 'max-content',
          maxWidth: '280px',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        {text}
      </span>
    </span>
  );
}

function Field({
  label,
  error,
  info,
  children
}: {
  label: string;
  error?: string;
  info?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
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
  error,
  info
}: {
  label: string;
  options: readonly string[];
  values: readonly string[];
  onToggle: (value: string) => void;
  error?: string;
  info?: string;
}) {
  return (
    <div style={{ display: 'grid', gap: '0.9rem' }}>
      <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
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
  onChange,
  info
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  info?: string;
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
      <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
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
      languageDisorder: values.languageDisorder,
      sensoryNotes: values.sensoryNotes?.trim() ?? ''
    },
    notes: values.notes.trim()
  };
}
