import { useEffect, useState } from 'react';
import { Plus, X, Target } from 'lucide-react';
import { getGoals, createGoal } from '../api/goals';
import { getSubjects } from '../api/subjects';
import { getTopics } from '../api/topics';
import { getProgressColor, getGoalStatusLabel } from '../utils/notifications';
import { getGoalScopeLabel, getGoalScopeBadge, getGoalTypeLabel } from '../utils/goals';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const EMPTY_FORM = {
  scope: 'general',
  type: 'weekly',
  subject_id: '',
  topic_id: '',
  target_duration: '',
  start_date: '',
  end_date: '',
};

function calcEndDate(startDate, type) {
  if (!startDate) return '';
  const d = new Date(startDate);
  if (type === 'daily') d.setDate(d.getDate() + 1);
  if (type === 'weekly') d.setDate(d.getDate() + 7);
  if (type === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = () => {
    setLoading(true);
    getGoals()
      .then((res) => setGoals(res.data.data))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGoals();
    getSubjects().then((res) => setSubjects(res.data.data)).catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    if (!form.subject_id || form.scope === 'general') {
      setTopics([]);
      return;
    }
    getTopics(Number(form.subject_id))
      .then((res) => setTopics(res.data.data))
      .catch(() => setTopics([]));
  }, [form.subject_id, form.scope]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormError('');

    if (name === 'scope') {
      setForm((prev) => ({
        ...prev,
        scope: value,
        subject_id: '',
        topic_id: '',
        type: value === 'general' ? prev.type : (prev.type === 'daily' ? 'weekly' : prev.type),
      }));
    } else if (name === 'subject_id') {
      setForm((prev) => ({ ...prev, subject_id: value, topic_id: '' }));
    } else if (name === 'start_date') {
      setForm((prev) => ({
        ...prev,
        start_date: value,
        end_date: calcEndDate(value, prev.type),
      }));
    } else if (name === 'type') {
      setForm((prev) => ({
        ...prev,
        type: value,
        end_date: calcEndDate(prev.start_date, value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        scope: form.scope,
        type: form.type,
        target_duration: Number(form.target_duration),
        start_date: form.start_date,
        end_date: form.end_date,
        subject_id: form.scope !== 'general' ? Number(form.subject_id) : null,
        topic_id: form.scope === 'topic' ? Number(form.topic_id) : null,
      };
      await createGoal(payload);
      setForm(EMPTY_FORM);
      setTopics([]);
      setShowForm(false);
      fetchGoals();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setFormError(errors ? Object.values(errors).flat().join(' ') : 'Bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const isActive = (goal) => {
    const today = new Date().toISOString().split('T')[0];
    return goal.start_date <= today && goal.end_date >= today;
  };

  const typeOptions = form.scope === 'general'
    ? [
        { value: 'daily', label: 'Günlük' },
        { value: 'weekly', label: 'Haftalık' },
        { value: 'monthly', label: 'Aylık' },
      ]
    : [
        { value: 'weekly', label: 'Haftalık' },
        { value: 'monthly', label: 'Aylık' },
      ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Hedefler</h2>
          <p style={styles.subtitle}>Genel, ders veya konu bazında çalışma hedefi belirleyin</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={showForm ? styles.cancelBtn : styles.addBtn}>
          {showForm
            ? <><X size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />İptal</>
            : <><Plus size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />Yeni Hedef</>
          }
        </button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Yeni Hedef Ekle</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            {formError && <div style={styles.errorBox}>{formError}</div>}

            <div style={styles.scopeTabs}>
              {[
                { id: 'general', label: 'Genel', desc: 'Tüm çalışmalar' },
                { id: 'subject', label: 'Ders', desc: 'Belirli ders' },
                { id: 'topic', label: 'Konu', desc: 'Belirli konu' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'scope', value: item.id } })}
                  style={{
                    ...styles.scopeTab,
                    ...(form.scope === item.id ? styles.scopeTabActive : {}),
                  }}
                >
                  <div style={styles.scopeTabLabel}>{item.label}</div>
                  <div style={styles.scopeTabDesc}>{item.desc}</div>
                </button>
              ))}
            </div>

            <div style={styles.formGrid}>
              {form.scope !== 'general' && (
                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Ders</label>
                  <select name="subject_id" value={form.subject_id} onChange={handleChange} required style={styles.input}>
                    <option value="">— Ders seçin —</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {form.scope === 'topic' && (
                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Konu</label>
                  <select
                    name="topic_id"
                    value={form.topic_id}
                    onChange={handleChange}
                    required
                    disabled={!form.subject_id}
                    style={styles.input}
                  >
                    <option value="">— Konu seçin —</option>
                    {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {form.subject_id && topics.length === 0 && (
                    <span style={styles.hint}>Bu derste konu yok. Derslerim sayfasından ekleyin.</span>
                  )}
                </div>
              )}

              <div style={styles.field}>
                <label style={styles.label}>Periyot</label>
                <select name="type" value={form.type} onChange={handleChange} style={styles.input}>
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Hedef Süre (dakika)</label>
                <input name="target_duration" type="number" min="1" value={form.target_duration} onChange={handleChange} required placeholder="120" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Başlangıç Tarihi</label>
                <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Bitiş Tarihi</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="end_date"
                    type="date"
                    value={form.end_date}
                    readOnly
                    required
                    style={{ ...styles.input, background: '#f1f5f9', color: '#64748b', cursor: 'default', width: '100%' }}
                  />
                  {form.end_date && <span style={styles.autoTag}>otomatik</span>}
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={styles.center}>Yükleniyor...</div>
      ) : goals.length === 0 ? (
        <div style={styles.empty}>
          <Target size={44} color="#cbd5e1" style={{ marginBottom: 10 }} />
          <div>Henüz hedef yok. İlk hedefini belirle!</div>
        </div>
      ) : (
        <div style={styles.goalGrid}>
          {goals.map((goal) => {
            const scopeBadge = getGoalScopeBadge(goal.scope);
            return (
              <div key={goal.id} style={{ ...styles.goalCard, ...(isActive(goal) ? styles.goalCardActive : {}) }}>
                <div style={styles.goalHeader}>
                  <div style={styles.badgeRow}>
                    <span style={{ ...styles.scopeBadge, background: scopeBadge.bg, color: scopeBadge.color }}>
                      {scopeBadge.label}
                    </span>
                    <span style={
                      goal.type === 'daily' ? styles.badgeDaily
                      : goal.type === 'weekly' ? styles.badgeWeekly
                      : styles.badgeMonthly
                    }>
                      {getGoalTypeLabel(goal.type)}
                    </span>
                  </div>
                  {isActive(goal) && <span style={styles.activeBadge}>● Aktif</span>}
                </div>

                <div style={styles.goalTarget}>{getGoalScopeLabel(goal)}</div>
                <div style={styles.goalDuration}>{goal.target_duration} <span style={styles.goalUnit}>dakika</span></div>

                {isActive(goal) && goal.progress_percent !== undefined && (
                  <div style={styles.progressSection}>
                    <div style={styles.progressHeader}>
                      <span style={{ ...styles.progressStatus, color: getProgressColor(goal.progress_percent) }}>
                        {getGoalStatusLabel(goal.status)}
                      </span>
                      <span style={styles.progressText}>{goal.current_duration} / {goal.target_duration} dk</span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${goal.progress_percent}%`,
                        background: getProgressColor(goal.progress_percent),
                      }} />
                    </div>
                    {goal.progress_percent < 100 && (
                      <div style={styles.progressRemaining}>{goal.remaining_minutes} dakika kaldı</div>
                    )}
                  </div>
                )}

                <div style={styles.goalDate}>{formatDate(goal.start_date)} – {formatDate(goal.end_date)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  title: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  addBtn: { padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, flexShrink: 0 },
  cancelBtn: { padding: '8px 18px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, flexShrink: 0 },
  card: { background: '#ffffff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  scopeTabs: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  scopeTab: { padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', textAlign: 'left' },
  scopeTabActive: { background: '#eef2ff', borderColor: '#a5b4fc', boxShadow: '0 0 0 2px #eef2ff' },
  scopeTabLabel: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  scopeTabDesc: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, color: '#374151', fontWeight: 600 },
  hint: { fontSize: 11, color: '#94a3b8' },
  input: { padding: '9px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, color: '#0f172a', fontSize: 14, outline: 'none' },
  submitBtn: { padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', color: '#dc2626', fontSize: 13 },
  goalGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 },
  goalCard: { background: '#ffffff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  goalCardActive: { border: '1px solid #a5b4fc', boxShadow: '0 0 0 3px #eef2ff' },
  goalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  scopeBadge: { padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 },
  badgeDaily: { background: '#eef2ff', color: '#4f46e5', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  badgeWeekly: { background: '#ecfeff', color: '#0891b2', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  badgeMonthly: { background: '#fdf4ff', color: '#9333ea', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  autoTag: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    fontSize: 10, fontWeight: 600, color: '#6366f1', background: '#eef2ff',
    padding: '1px 7px', borderRadius: 99, pointerEvents: 'none',
  },
  activeBadge: { color: '#16a34a', fontSize: 12, fontWeight: 600, flexShrink: 0 },
  goalTarget: { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 },
  goalDuration: { fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 6 },
  progressSection: { marginBottom: 10 },
  progressHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  progressStatus: { fontSize: 12, fontWeight: 700 },
  progressText: { fontSize: 12, color: '#64748b', fontWeight: 600 },
  progressTrack: { height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, transition: 'width 0.4s ease' },
  progressRemaining: { fontSize: 11, color: '#94a3b8', marginTop: 5 },
  goalUnit: { fontSize: 14, fontWeight: 400, color: '#94a3b8' },
  goalDate: { fontSize: 12, color: '#94a3b8' },
  center: { textAlign: 'center', color: '#94a3b8', paddingTop: 60 },
  empty: { textAlign: 'center', color: '#94a3b8', paddingTop: 40 },
};
