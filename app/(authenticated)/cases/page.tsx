import { CaseList } from '@/components/case-list';
import { ProbabilityBars } from '@/components/probability-bars';
import { loadCaseRecords } from '@/lib/data-platform';
import { CaseRecord } from '@/lib/types';
import { Hero } from '@/components/hero';

// Force dynamic rendering (don't statically generate at build time)
export const dynamic = 'force-dynamic';

export default async function CasesPage() {
  const cases = await loadCaseRecords();
  const aggregatedCategories = aggregateCategories(cases);

  return (
    <main className="page-shell">
      <Hero title="Case Library" />
      <section
        className="card"
        style={{
          padding: 'clamp(1.35rem, 4vw, 1.7rem)',
          display: 'grid',
          gap: '1.2rem'
        }}
      >
        <header>
          <span className="pill">Cohort distribution</span>
          <h1 style={{ margin: '0.7rem 0 0', fontSize: 'clamp(1.35rem, 3.8vw, 1.6rem)' }}>
            Inference phenotype mix
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Each case routes through a multinomial classifier; probabilities shown are averaged across the
            stored cohort. Use this view to monitor the balance between profound ASD, high-functioning,
            and syndromic presentations.
          </p>
        </header>
        <ProbabilityBars categories={aggregatedCategories} />
      </section>
      <CaseList title="All cases" cases={cases} showActions={true} enablePagination />
    </main>
  );
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
