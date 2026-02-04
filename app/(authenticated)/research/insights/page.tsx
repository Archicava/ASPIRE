import { InsightHighlight } from '@/components/insight-highlight';
import { getCohortStats } from '@/lib/cohort-data';
import { Hero } from '@/components/hero';

const researchChapters = [
  {
    title: 'Prenatal & perinatal risk factors',
    takeaways: [
      'IVF pregnancies were not independently linked to ASD after controlling for parental age; complications like preeclampsia and threatened abortion showed stronger correlation.',
      'Twin gestations presented elevated risk for neonatal complications, reinforcing the need to capture birth order and peripartum events within the case intake.',
      'Maternal age above 35 surfaced as a notable signal, mirroring recent BMC Psychology meta-analyses on parental age effects.'
    ]
  },
  {
    title: 'Developmental trajectories',
    takeaways: [
      'Early regression was documented in roughly one-quarter of cases, often following febrile episodes; capturing regression timing helps the inference model separate profound ASD from complex delays.',
      'Language outcomes clustered into functional, delayed, and absent groups, with the minimally verbal subset aligning to the 26% rate reported in the study.',
      'Motor planning deficits were more prevalent in later-diagnosed (Group 2) individuals, informing the stepped motor assessments in the UI.'
    ]
  },
  {
    title: 'Neurobiology & comorbidities',
    takeaways: [
      'EEG anomalies appeared in up to 2.1x the rate seen in typical pediatric cohorts, substantiating the EEG toggle in the case form and monitoring dashboards.',
      'MRI findings were usually subtle but syndromic presentations (19% of the cohort) displayed dysmorphic traits or structural variants, which our interface flags within the development section.',
      'Common comorbidities included GI disturbances, feeding issues, and cardiac anomalies, emphasising the need for structured comorbidity capture for personalized recommendations.'
    ]
  },
  {
    title: 'Operational insights',
    takeaways: [
      'Median diagnostic age for early-identified cases was 18 months, underscoring the benefit of milestone surveillance and parental concern logging.',
      'Behavioral challenges such as aggressivity and self-injury demanded clear intervention recommendations, hence the emphasis on actionable inference narratives.',
      'Auditability via Ratio1’s CStore ensures each inference job retains immutable proofs-critical for cross-institutional studies and regulatory reviews.'
    ]
  }
];

const roadmap = [
  {
    phase: 'Q3 2024',
    focus: 'Longitudinal outcomes & intervention mapping',
    detail:
      'Collect post-intervention data (language gains, adaptive scores) to model which therapies yield the strongest improvements per phenotype.'
  },
  {
    phase: 'Q4 2024',
    focus: 'Biomarker enrichment',
    detail:
      'Integrate blood, immune, and microbiome markers to test emerging hypotheses outlined in the Romanian cohort analysis.'
  },
  {
    phase: '2025',
    focus: 'Personalized recommendation engine',
    detail:
      'Use Ratio1 federated learning to match patient archetypes with interventions that delivered measurable gains in similar profiles.'
  }
];

export default function ResearchInsightsPage() {
  const stats = getCohortStats();

  return (
    <main className="page-shell">
      <Hero title="Research" />
      <section
        className="card"
        style={{ padding: 'clamp(1.4rem, 4.5vw, 1.9rem)', display: 'grid', gap: '1rem' }}
      >
        <span className="pill">Romanian ASD cohort synthesis</span>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4.2vw, 1.9rem)' }}>
          Translating clinical research into Aspire product decisions
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
          Insights distilled from the “Analysis of Autism Case Database and Research Context” whitepaper
          drive the structure of this application. Each UI module maps to evidence-backed requirements,
          ensuring parity with the academic dataset while preparing for decentralized inference workflows.
        </p>
      </section>

      <section
        className="card"
        style={{ padding: 'clamp(1.3rem, 4vw, 1.6rem)', display: 'grid', gap: '1rem' }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <p className="section-title">Cohort KPIs</p>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.15rem, 3.3vw, 1.35rem)', fontWeight: 600 }}>
              Clinical dataset at a glance
            </h2>
          </div>
          <span className="pill">{stats.totalCases} cases</span>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' }}>
          <MetricCard label="Gender split" value={`${stats.gender.male}M / ${stats.gender.female}F`} description="72% of records are male, mirroring the cohort publication." />
          <MetricCard label="Pregnancy profile" value={`${stats.pregnancy.natural} natural / ${stats.pregnancy.ivf} IVF`} description={`${stats.pregnancy.twin} twin gestations; ${stats.pregnancy.abnormalEvolution} flagged with complications.`} />
          <MetricCard label="Median diagnosis age" value={`${stats.diagnosisAge.median ?? '-'} months`} description="Used as the early-diagnosis benchmark in the workspace view." />
          <MetricCard label="Minimally verbal" value={`${Math.round((stats.language.absent / stats.totalCases) * 100)}%`} description="Language status informs AAC planning inside Ratio1 workflows." />
          <MetricCard label="EEG anomalies" value={`${stats.eegAnomalyRate}%`} description="Rate of focal/bilateral EEG findings across the cohort." />
          <MetricCard label="MRI anomalies" value={`${stats.mriAnomalyRate}%`} description="Structural MRI anomalies present within the cohort dataset." />
        </div>
      </section>

      <InsightHighlight />

      {researchChapters.map((chapter) => (
        <article
          key={chapter.title}
          className="card"
          style={{ padding: 'clamp(1.3rem, 4vw, 1.6rem)', display: 'grid', gap: '1rem' }}
        >
          <header>
            <p className="section-title">Focus area</p>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.2rem, 3.4vw, 1.4rem)', fontWeight: 600 }}>
              {chapter.title}
            </h2>
          </header>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.6rem' }}>
            {chapter.takeaways.map((item) => (
              <li key={item} style={{ lineHeight: 1.6 }}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      ))}

      <section
        className="card"
        style={{ padding: 'clamp(1.3rem, 4vw, 1.6rem)', display: 'grid', gap: '1rem' }}
      >
        <header>
          <p className="section-title">Research roadmap</p>
          <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.2rem, 3.4vw, 1.4rem)', fontWeight: 600 }}>
            Extending the Aspire ASD program
          </h2>
        </header>
        <div
          style={{
            display: 'grid',
            gap: '0.9rem'
          }}
        >
          {roadmap.map((item) => (
            <div
              key={item.phase}
              style={{
                padding: 'clamp(0.95rem, 3.4vw, 1.1rem) clamp(1.1rem, 3.8vw, 1.3rem)',
                borderRadius: '1rem',
                border: '1px solid var(--color-border)',
                background: 'linear-gradient(135deg, rgba(220, 233, 255, 0.82), rgba(240, 246, 255, 0.95))',
                display: 'grid',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <span className="pill" style={{ background: 'var(--color-accent-soft)' }}>
                  {item.phase}
                </span>
                <strong>{item.focus}</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}


function MetricCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div
      style={{
        borderRadius: '1rem',
        border: '1px solid var(--color-border)',
        padding: 'clamp(0.95rem, 3.4vw, 1.1rem)',
        background: 'linear-gradient(135deg, rgba(220, 233, 255, 0.82), rgba(240, 246, 255, 0.95))',
        display: 'grid',
        gap: '0.4rem'
      }}
    >
      <p className="section-title" style={{ fontSize: '0.8rem' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 'clamp(1.2rem, 3.8vw, 1.5rem)', fontWeight: 700 }}>{value}</p>
      <p
        style={{
          margin: 0,
          color: 'var(--color-text-secondary)',
          fontSize: 'clamp(0.85rem, 2.4vw, 0.9rem)',
          lineHeight: 1.45
        }}
      >
        {description}
      </p>
    </div>
  );
}
