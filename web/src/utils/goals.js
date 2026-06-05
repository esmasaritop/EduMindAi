export function getGoalScopeLabel(goal) {
  const scope = goal.scope ?? 'general';
  if (scope === 'subject') return goal.subject_name ?? 'Ders';
  if (scope === 'topic') return goal.topic_name ?? 'Konu';
  return 'Genel';
}

export function getGoalScopeBadge(scope = 'general') {
  const badges = {
    general: { label: 'Genel', bg: '#f1f5f9', color: '#475569' },
    subject: { label: 'Ders', bg: '#fff7ed', color: '#ea580c' },
    topic: { label: 'Konu', bg: '#ecfeff', color: '#0891b2' },
  };
  return badges[scope] ?? badges.general;
}

export function getGoalTypeLabel(type) {
  const labels = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };
  return labels[type] ?? type;
}
