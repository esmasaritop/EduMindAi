import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame, Target, Bell, X, Save } from 'lucide-react';
import { getDashboard } from '../api/dashboard';
import { updateGoal } from '../api/goals';
import { getProgressColor, getGoalStatusLabel } from '../utils/notifications';
import { getGoalScopeLabel, getGoalScopeBadge } from '../utils/goals';

/* ─── helpers ─── */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function buildWeekDays(stats) {
  const map = {};
  (stats || []).forEach((s) => { map[s.date?.slice(0, 10)] = s.total_duration; });

  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      dayName: DAY_NAMES[i],
      dateStr: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' }),
      duration: map[key] ?? 0,
      isToday: key === today.toISOString().slice(0, 10),
    };
  });
}

/* ─── StatCard ─── */
function StatCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIcon, background: bg, color }}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <div style={s.statValue}>{value}</div>
        <div style={s.statLabel}>{label}</div>
        {sub && <div style={s.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── WeeklyTopicBar ─── */
function WeeklyTopicBar({ stats }) {
  const items = (stats || []).filter((s) => s.weekly_minutes > 0).slice(0, 8);
  const max = Math.max(...items.map((s) => s.weekly_minutes), 1);

  if (!stats?.length) {
    return (
      <div style={s.card}>
        <h3 style={s.cardTitle}>Haftalık Konu Çalışması</h3>
        <p style={s.cardSub}>Bu hafta henüz konu bazlı çalışma kaydı yok. Zamanlayıcıdan konu seçerek başlayın.</p>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <h3 style={s.cardTitle}>Haftalık Konu Çalışması</h3>
      <p style={s.cardSub}>Bu hafta konu bazında harcanan süreler</p>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Bu hafta henüz konu çalışması yok.</p>
      ) : (
        <div style={s.topicList}>
          {items.map((item) => (
            <div key={item.topic_id} style={s.topicRow}>
              <div style={s.topicInfo}>
                <div style={s.topicName}>{item.topic_name}</div>
                <div style={s.topicSubject}>{item.subject_name}</div>
              </div>
              <div style={s.topicBarWrap}>
                <div style={{
                  ...s.topicBarFill,
                  width: `${(item.weekly_minutes / max) * 100}%`,
                }} />
              </div>
              <div style={s.topicMinutes}>{item.weekly_minutes} dk</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── GoalProgress ─── */
function GoalProgress({ goal }) {
  const percent = goal.progress_percent ?? 0;
  const color = getProgressColor(percent);

  return (
    <div style={s.progressWrap}>
      <div style={s.progressHeader}>
        <span style={{ ...s.progressStatus, color }}>{getGoalStatusLabel(goal.status)}</span>
        <span style={s.progressText}>{goal.current_duration ?? 0} / {goal.target_duration} dk</span>
      </div>
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${percent}%`, background: color }} />
      </div>
      {percent < 100 && (
        <div style={s.progressRemaining}>{goal.remaining_minutes ?? 0} dakika kaldı</div>
      )}
    </div>
  );
}

/* ─── WeeklyBar ─── */
function WeeklyBar({ stats }) {
  const days = buildWeekDays(stats);
  const max = Math.max(...days.map((d) => d.duration), 1);

  return (
    <div style={s.card}>
      <h3 style={s.cardTitle}>Haftalık Çalışma</h3>
      <p style={s.cardSub}>Son 7 günün özeti</p>
      <div style={s.barChart}>
        {days.map((day) => (
          <div key={day.key} style={s.barItem}>
            <div style={s.barOuter}>
              <div style={{
                ...s.barFill,
                height: `${(day.duration / max) * 100}%`,
                background: day.isToday ? '#4f46e5' : '#6366f1',
                opacity: day.isToday ? 1 : 0.65,
              }} />
            </div>
            <div style={{ ...s.barDayName, fontWeight: day.isToday ? 700 : 500, color: day.isToday ? '#4f46e5' : '#94a3b8' }}>
              {day.dayName}
            </div>
            <div style={s.barDate}>{day.dateStr}</div>
            <div style={s.barValue}>{day.duration > 0 ? `${day.duration}dk` : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── EditGoalModal ─── */
function EditGoalModal({ goal, onClose, onSaved }) {
  const [form, setForm] = useState({
    type: goal.type,
    target_duration: goal.target_duration,
    start_date: goal.start_date,
    end_date: goal.end_date,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateGoal(goal.id, { ...form, target_duration: Number(form.target_duration) });
      onSaved();
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>Hedefi Düzenle</span>
          <button onClick={onClose} style={s.iconBtn}><X size={16} /></button>
        </div>
        <form onSubmit={save} style={s.modalForm}>
          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.field}>
            <label style={s.label}>Hedef Türü</label>
            <select name="type" value={form.type} onChange={handle} style={s.input}>
              <option value="daily">Günlük</option>
              <option value="weekly">Haftalık</option>
              <option value="monthly">Aylık</option>
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>Hedef Süre (dakika)</label>
            <input name="target_duration" type="number" min="1" value={form.target_duration} onChange={handle} required style={s.input} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Başlangıç Tarihi</label>
            <input name="start_date" type="date" value={form.start_date} onChange={handle} required style={s.input} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Bitiş Tarihi</label>
            <input name="end_date" type="date" value={form.end_date} onChange={handle} required style={s.input} />
          </div>
          <button type="submit" disabled={saving} style={s.saveBtn}>
            <Save size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => setError('Veriler yüklenemedi.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <div style={s.center}>Yükleniyor...</div>;
  if (error)   return <div style={s.errorText}>{error}</div>;

  return (
    <div style={s.page}>
      {/* Stat Cards */}
      <div style={s.statGrid}>
        <StatCard icon={Clock}  label="Bugün Çalışma"  value={`${data.today.total_duration} dk`}      sub={`${data.today.session_count} seans`}                        color="#4f46e5" bg="#eef2ff" />
        <StatCard icon={Flame}  label="Güncel Seri"    value={`${data.streak.current_streak} gün`}    sub={`En uzun: ${data.streak.longest_streak} gün`}               color="#ea580c" bg="#fff7ed" />
        <StatCard icon={Target} label="Aktif Hedef"    value={data.active_goals.length}                sub="devam eden hedef"                                           color="#059669" bg="#ecfdf5" />
        <Link to="/notifications" style={{ textDecoration: 'none' }}>
          <StatCard icon={Bell}   label="Okunmamış"      value={data.unread_notification_count}          sub="bildirim — tıkla"                                             color="#dc2626" bg="#fef2f2" />
        </Link>
      </div>

      {/* Weekly Chart */}
      <WeeklyBar stats={data.weekly_stats} />
      <WeeklyTopicBar stats={data.weekly_topic_stats} />

      {/* Active Goals */}
      {data.active_goals.length > 0 && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Aktif Hedefler</h3>
          <p style={s.cardSub}>Devam eden çalışma hedeflerin</p>
          <div style={s.goalList}>
            {data.active_goals.map((goal) => {
              const scopeBadge = getGoalScopeBadge(goal.scope);
              return (
              <div key={goal.id} style={s.goalItem}>
                <div style={{ flex: 1 }}>
                  <div style={s.goalLeft}>
                    <span style={{ ...s.scopeBadge, background: scopeBadge.bg, color: scopeBadge.color }}>
                      {scopeBadge.label}
                    </span>
                    <span style={goal.type === 'daily' ? s.badgeDaily : s.badgeWeekly}>
                      {goal.type === 'daily' ? 'Günlük' : goal.type === 'weekly' ? 'Haftalık' : 'Aylık'}
                    </span>
                    <div>
                      <div style={s.goalScopeName}>{getGoalScopeLabel(goal)}</div>
                      <div style={s.goalDuration}>{goal.target_duration} dakika hedef</div>
                      <div style={s.goalDate}>
                        {formatDate(goal.start_date)} – {formatDate(goal.end_date)}
                      </div>
                    </div>
                  </div>
                  <GoalProgress goal={goal} />
                </div>
                <button onClick={() => setEditingGoal(goal)} style={s.editBtn}>
                  Düzenle
                </button>
              </div>
            );})}
          </div>
        </div>
      )}

      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSaved={fetchDashboard}
        />
      )}
    </div>
  );
}

const s = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  center: { textAlign: 'center', color: '#94a3b8', paddingTop: 60 },
  errorText: { color: '#ef4444', textAlign: 'center', paddingTop: 60 },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
  statCard: { background: '#fff', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: 26, fontWeight: 700, color: '#0f172a' },
  statLabel: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 },
  cardSub: { fontSize: 12, color: '#94a3b8', marginTop: 3, marginBottom: 18 },
  barChart: { display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 },
  barItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%' },
  barOuter: { flex: 1, width: '100%', background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6, minHeight: 4, transition: 'height 0.4s ease' },
  barDayName: { fontSize: 11, marginTop: 4 },
  barDate: { fontSize: 10, color: '#cbd5e1' },
  barValue: { fontSize: 10, color: '#94a3b8' },
  goalList: { display: 'flex', flexDirection: 'column', gap: 10 },
  goalItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' },
  goalLeft: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  scopeBadge: { padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' },
  goalScopeName: { fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 },
  progressWrap: { marginTop: 4 },
  progressHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  progressStatus: { fontSize: 12, fontWeight: 700 },
  progressText: { fontSize: 12, color: '#64748b', fontWeight: 600 },
  progressTrack: { height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, transition: 'width 0.4s ease' },
  progressRemaining: { fontSize: 11, color: '#94a3b8', marginTop: 5 },
  topicList: { display: 'flex', flexDirection: 'column', gap: 10 },
  topicRow: { display: 'grid', gridTemplateColumns: '1fr 120px 48px', alignItems: 'center', gap: 12 },
  topicInfo: { minWidth: 0 },
  topicName: { fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  topicSubject: { fontSize: 11, color: '#94a3b8' },
  topicBarWrap: { height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' },
  topicBarFill: { height: '100%', background: 'linear-gradient(90deg, #6366f1, #7c3aed)', borderRadius: 99, minWidth: 4 },
  topicMinutes: { fontSize: 12, fontWeight: 700, color: '#4f46e5', textAlign: 'right' },
  badgeDaily: { background: '#eef2ff', color: '#4f46e5', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' },
  badgeWeekly: { background: '#ecfeff', color: '#0891b2', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' },
  goalDuration: { fontSize: 14, color: '#374151', fontWeight: 600 },
  goalDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  editBtn: { padding: '6px 14px', background: '#fff', color: '#6366f1', border: '1px solid #a5b4fc', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  /* modal */
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, animation: 'fadeIn 0.15s ease' },
  modal: { background: '#fff', borderRadius: 14, padding: '24px 28px', width: 420, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', animation: 'slideUp 0.15s ease' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6, display: 'flex' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  input: { padding: '9px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, color: '#0f172a', fontSize: 14, outline: 'none' },
  saveBtn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, alignSelf: 'flex-end', marginTop: 4 },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 },
};
