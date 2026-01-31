import { CaseList } from '@/components/case-list';
import { loadCaseRecords } from '@/lib/data-platform';
import { CaseRecord } from '@/lib/types';
import { Hero } from '@/components/hero';

// Force dynamic rendering (don't statically generate at build time)
export const dynamic = 'force-dynamic';

export default async function CasesPage() {
  const cases = await loadCaseRecords();
  const stats = computeStats(cases);

  return (
    <main className="page-shell">
      <Hero title="Case Library" />

      {/* Stats Summary */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem'
        }}
      >
        <StatCard label="Total Cases" value={stats.total} />
        <StatCard
          label="ASD Detected"
          value={stats.asd}
          color="rgb(220, 38, 38)"
          bgColor="rgba(239, 68, 68, 0.1)"
        />
        <StatCard
          label="Healthy"
          value={stats.healthy}
          color="rgb(22, 163, 74)"
          bgColor="rgba(34, 197, 94, 0.1)"
        />
        <StatCard
          label="High Risk"
          value={stats.highRisk}
          color="rgb(220, 38, 38)"
          bgColor="rgba(239, 68, 68, 0.08)"
        />
      </section>

      <CaseList title="All cases" cases={cases} showActions={true} enablePagination />
    </main>
  );
}

function StatCard({
  label,
  value,
  color = 'var(--color-text-primary)',
  bgColor = 'var(--color-card)'
}: {
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: bgColor,
        textAlign: 'center'
      }}
    >
      <span style={{
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--color-text-secondary)',
        fontWeight: 600
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        color,
        lineHeight: 1
      }}>
        {value}
      </span>
    </div>
  );
}

function computeStats(cases: CaseRecord[]) {
  let asd = 0;
  let healthy = 0;
  let highRisk = 0;

  cases.forEach((record) => {
    const inf = record.inference;
    if (!inf) return;

    const pred = typeof inf.prediction === 'string' ? inf.prediction
      : typeof (inf.prediction as any)?.prediction === 'string' ? (inf.prediction as any).prediction
      : null;

    if (pred === 'ASD') asd++;
    else if (pred === 'Healthy') healthy++;

    const risk = inf.riskLevel || (inf as any).risk_level;
    if (risk === 'high') highRisk++;
  });

  return { total: cases.length, asd, healthy, highRisk };
}

function aggregateCategories(cases: CaseRecord[]) {
  const categoryMap = new Map<string, number>();
  cases.forEach((record) => {
    // Handle both mapped inference and raw API response
    const categories = Array.isArray(record.inference?.categories)
      ? record.inference.categories
      : [];
    categories.forEach((category) => {
      if (category && typeof category.label === 'string' && typeof category.probability === 'number') {
        categoryMap.set(category.label, (categoryMap.get(category.label) ?? 0) + category.probability);
      }
    });
  });
  const count = cases.length || 1;
  return Array.from(categoryMap.entries())
    .map(([label, total]) => ({
      label,
      probability: total / count
    }))
    .sort((a, b) => b.probability - a.probability);
}
