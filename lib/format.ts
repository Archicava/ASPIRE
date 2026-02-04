export function formatDate(isoString: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(isoString));
}

export function formatTimeDistance(submittedAt: string, completedAt?: string) {
  if (!completedAt) {
    return '-';
  }
  const start = new Date(submittedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffSeconds = Math.max(0, Math.round((end - start) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds}s`;
  }
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export function formatProbability(probability: number) {
  return `${Math.round(probability * 100)}%`;
}

