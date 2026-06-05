export const NOTIFICATION_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'goal_approaching', label: 'Hedefe Yakın' },
  { id: 'goal_completed', label: 'Tamamlanan' },
  { id: 'goal_deadline', label: 'Süre Uyarısı' },
  { id: 'goal_behind', label: 'Geride' },
  { id: 'topic_weekly_reminder', label: 'Konu Hatırlatma' },
  { id: 'topic_weekly_summary', label: 'Haftalık Özet' },
];

export const NOTIFICATION_META = {
  goal_approaching: { label: 'Hedefe Yakın', color: '#4f46e5', bg: '#eef2ff', icon: '🎯' },
  goal_completed: { label: 'Tamamlandı', color: '#059669', bg: '#ecfdf5', icon: '🎉' },
  goal_deadline: { label: 'Süre Uyarısı', color: '#dc2626', bg: '#fef2f2', icon: '⏰' },
  goal_behind: { label: 'Geride', color: '#ea580c', bg: '#fff7ed', icon: '📉' },
  topic_weekly_reminder: { label: 'Konu Hatırlatma', color: '#0891b2', bg: '#ecfeff', icon: '📚' },
  topic_weekly_summary: { label: 'Haftalık Özet', color: '#7c3aed', bg: '#f5f3ff', icon: '📊' },
  general: { label: 'Genel', color: '#64748b', bg: '#f1f5f9', icon: '🔔' },
};

export function getNotificationMeta(type) {
  return NOTIFICATION_META[type] ?? NOTIFICATION_META.general;
}

export function getProgressColor(percent) {
  if (percent >= 100) return '#059669';
  if (percent >= 75) return '#4f46e5';
  if (percent >= 50) return '#0891b2';
  return '#ea580c';
}

export function getGoalStatusLabel(status) {
  const labels = {
    completed: 'Tamamlandı',
    approaching: 'Hedefe yakın',
    deadline: 'Süre doluyor',
    behind: 'Geride',
    on_track: 'Yolunda',
  };
  return labels[status] ?? 'Devam ediyor';
}
