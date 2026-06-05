import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Save, BookOpen, Hash, ArrowRight } from 'lucide-react';
import { getQuestions, upsertQuestionStat } from '../api/questions';

function StatInput({ label, value, color, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: 64, padding: '8px 0', textAlign: 'center',
          background: '#f8fafc', border: `2px solid ${color}55`, borderRadius: 8,
          fontSize: 16, fontWeight: 700, color, outline: 'none',
        }}
      />
    </div>
  );
}

function QuestionCard({ stat, onSaved }) {
  const [form, setForm] = useState({
    total_questions: stat.total_questions ?? 0,
    correct: stat.correct ?? 0,
    wrong: stat.wrong ?? 0,
    empty: stat.empty ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key) => (val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await upsertQuestionStat(stat.topic_id, form);
      onSaved(res.data.data);
      setDirty(false);
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const total = form.correct + form.wrong + form.empty;
  const correctPct = total > 0 ? Math.round((form.correct / total) * 100) : 0;
  const wrongPct   = total > 0 ? Math.round((form.wrong   / total) * 100) : 0;
  const emptyPct   = total > 0 ? Math.round((form.empty   / total) * 100) : 0;
  const isNew = total === 0 && form.total_questions === 0;

  return (
    <div style={s.qCard}>
      <div style={s.qCardHeader}>
        <div>
          <div style={s.qSubject}>
            <BookOpen size={13} style={{ marginRight: 5 }} />
            {stat.topic?.subject?.name ?? '—'}
          </div>
          <div style={s.qTopic}>
            <Hash size={12} style={{ marginRight: 4 }} />
            {stat.topic?.name ?? '—'}
          </div>
        </div>
        <div style={s.qTotal}>
          <span style={s.qTotalNum}>{form.total_questions}</span>
          <span style={s.qTotalLabel}>Toplam Soru</span>
        </div>
      </div>

      {isNew && (
        <div style={s.hintBox}>
          Aşağıdaki 4 kutuya sayıları yazın, sonra <b>Kaydet</b> butonuna basın.
        </div>
      )}

      {total > 0 && (
        <div style={s.progressBar}>
          <div style={{ ...s.progressSeg, background: '#16a34a', width: `${correctPct}%` }} title={`Doğru: ${correctPct}%`} />
          <div style={{ ...s.progressSeg, background: '#ef4444', width: `${wrongPct}%` }} title={`Yanlış: ${wrongPct}%`} />
          <div style={{ ...s.progressSeg, background: '#94a3b8', width: `${emptyPct}%` }} title={`Boş: ${emptyPct}%`} />
        </div>
      )}

      <div style={s.qInputRow}>
        <StatInput label="Toplam" value={form.total_questions} color="#6366f1" onChange={set('total_questions')} />
        <StatInput label="Doğru"  value={form.correct}         color="#16a34a" onChange={set('correct')} />
        <StatInput label="Yanlış" value={form.wrong}           color="#ef4444" onChange={set('wrong')} />
        <StatInput label="Boş"    value={form.empty}           color="#94a3b8" onChange={set('empty')} />
      </div>

      {total > 0 && (
        <div style={s.pctRow}>
          <span style={{ color: '#16a34a' }}>✓ {correctPct}%</span>
          <span style={{ color: '#ef4444' }}>✗ {wrongPct}%</span>
          <span style={{ color: '#94a3b8' }}>○ {emptyPct}%</span>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        style={{
          ...s.saveBtn,
          background: dirty ? '#6366f1' : saved ? '#059669' : '#94a3b8',
        }}
      >
        <Save size={13} style={{ marginRight: 5 }} />
        {saving ? 'Kaydediliyor...' : saved && !dirty ? 'Kaydedildi ✓' : 'Kaydet'}
      </button>
    </div>
  );
}

export default function Questions() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    getQuestions()
      .then((res) => setStats(res.data.data ?? []))
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  const handleSaved = (updated) => {
    setStats((prev) => prev.map((item) => (
      item.topic_id === updated.topic_id ? { ...item, ...updated } : item
    )));
  };

  if (loading) return <div style={s.center}>Yükleniyor...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Sorularım</h2>
          <p style={s.subtitle}>Konu bazında doğru / yanlış / boş sayılarını buradan girin</p>
        </div>
        <span style={s.count}>{stats.length} konu takipte</span>
      </div>

      {stats.length === 0 ? (
        <div style={s.empty}>
          <HelpCircle size={52} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>Henüz takip edilen konu yok</div>
          <div style={s.emptyHint}>
            1. <Link to="/subjects" style={s.link}>Derslerim</Link> sayfasına gidin<br />
            2. Bir konunun <b>Soru Takibi</b> butonuna tıklayın (mor <b>Takipte</b> olur)<br />
            3. Bu sayfaya geri dönün — konu kartı ve sayı kutuları burada görünür
          </div>
          <Link to="/subjects" style={s.emptyBtn}>
            Derslerime Git <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </Link>
        </div>
      ) : (
        <div style={s.grid}>
          {stats.map((stat) => (
            <QuestionCard key={stat.topic_id ?? stat.id} stat={stat} onSaved={handleSaved} />
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  count: { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '3px 12px', borderRadius: 12, fontSize: 13, flexShrink: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  qCard: { background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 14 },
  qCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  qSubject: { display: 'flex', alignItems: 'center', fontSize: 13, color: '#6366f1', fontWeight: 700 },
  qTopic: { display: 'flex', alignItems: 'center', fontSize: 15, color: '#0f172a', fontWeight: 700, marginTop: 4 },
  qTotal: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  qTotalNum: { fontSize: 26, fontWeight: 800, color: '#6366f1' },
  qTotalLabel: { fontSize: 11, color: '#94a3b8' },
  hintBox: { background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#92400e', lineHeight: 1.5 },
  progressBar: { display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', background: '#f1f5f9' },
  progressSeg: { height: '100%', transition: 'width 0.4s ease' },
  qInputRow: { display: 'flex', justifyContent: 'space-between', gap: 8 },
  pctRow: { display: 'flex', gap: 14, fontSize: 12, fontWeight: 700 },
  saveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%' },
  center: { textAlign: 'center', color: '#94a3b8', paddingTop: 60 },
  empty: { textAlign: 'center', padding: '40px 24px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' },
  emptyHint: { fontSize: 14, color: '#64748b', lineHeight: 2, marginBottom: 20 },
  link: { color: '#6366f1', fontWeight: 600, textDecoration: 'none' },
  emptyBtn: { display: 'inline-flex', alignItems: 'center', padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' },
};
