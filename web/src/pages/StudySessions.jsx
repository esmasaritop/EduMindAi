import { useEffect, useState } from 'react';
import { Plus, X, Trash2, BookOpen, Hash } from 'lucide-react';
import { getSessions, createSession, deleteSession } from '../api/studySessions';
import { getSubjects } from '../api/subjects';
import { getTopics, addTopicTime } from '../api/topics';
import { confirmDelete } from '../utils/swal';

const EMPTY_FORM = { subject_id: '', topic_id: '', duration: '', started_at: '', ended_at: '', session_type: 'manual', notes: '' };

function extractTopicFromNotes(notes) {
  if (!notes) return null;
  const match = notes.match(/Konu:\s*([^·]+)/);
  return match ? match[1].trim() : null;
}

export default function StudySessions() {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = () => {
    setLoading(true);
    getSessions()
      .then((res) => setSessions(res.data.data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
    getSubjects().then((res) => setSubjects(res.data.data)).catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    if (!form.subject_id) {
      setTopics([]);
      return;
    }
    getTopics(Number(form.subject_id))
      .then((res) => setTopics(res.data.data))
      .catch(() => setTopics([]));
  }, [form.subject_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'subject_id') {
      setForm({ ...form, subject_id: value, topic_id: '' });
    } else {
      setForm({ ...form, [name]: value });
    }
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject_id) { setFormError('Lütfen bir ders seçin.'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      const topicName = topics.find((t) => String(t.id) === form.topic_id)?.name;
      const userNotes = form.notes.trim();
      const notes = topicName
        ? (userNotes ? `Konu: ${topicName} · ${userNotes}` : `Konu: ${topicName}`)
        : userNotes;

      const duration = Number(form.duration);
      const promises = [
        createSession({
          subject_id: Number(form.subject_id),
          duration,
          started_at: form.started_at,
          ended_at: form.ended_at || null,
          session_type: form.session_type,
          notes: notes || null,
        }),
      ];

      if (form.topic_id) {
        promises.push(addTopicTime(Number(form.topic_id), duration));
      }

      await Promise.all(promises);
      setForm(EMPTY_FORM);
      setTopics([]);
      setShowForm(false);
      fetchSessions();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setFormError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message ?? 'Bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete({
      title: 'Seansı sil?',
      text: 'Bu çalışma seansı kalıcı olarak silinecek.',
    });
    if (!confirmed) return;
    await deleteSession(id);
    fetchSessions();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Çalışma Seansları</h2>
        <button onClick={() => setShowForm(!showForm)} style={showForm ? styles.cancelBtn : styles.addBtn}>
          {showForm
            ? <><X size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />İptal</>
            : <><Plus size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />Yeni Seans</>
          }
        </button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Yeni Seans Ekle</h3>

          {subjects.length === 0 && (
            <div style={styles.warningBox}>
              ⚠️ Henüz ders eklemediniz. Önce <b>Derslerim</b> sayfasından ders ekleyin.
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {formError && <div style={styles.errorBox}>{formError}</div>}
            <div style={styles.formGrid}>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Ders</label>
                <select name="subject_id" value={form.subject_id} onChange={handleChange} required style={styles.input} disabled={subjects.length === 0}>
                  <option value="">— Ders seçin —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>
                  <Hash size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                  Konu (isteğe bağlı)
                </label>
                <select
                  name="topic_id"
                  value={form.topic_id}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={!form.subject_id || topics.length === 0}
                >
                  <option value="">— Konu seçin —</option>
                  {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {form.subject_id && topics.length === 0 && (
                  <span style={styles.hint}>Bu derste henüz konu yok. Derslerim sayfasından ekleyebilirsiniz.</span>
                )}
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Süre (dakika)</label>
                <input name="duration" type="number" value={form.duration} onChange={handleChange} required min="1" placeholder="60" style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tür</label>
                <select name="session_type" value={form.session_type} onChange={handleChange} style={styles.input}>
                  <option value="manual">Manuel</option>
                  <option value="timer">Zamanlayıcı</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Başlangıç</label>
                <input name="started_at" type="datetime-local" value={form.started_at} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Bitiş</label>
                <input name="ended_at" type="datetime-local" value={form.ended_at} onChange={handleChange} style={styles.input} />
              </div>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Notlar</label>
                <input name="notes" value={form.notes} onChange={handleChange} placeholder="İsteğe bağlı..." style={styles.input} />
              </div>
            </div>
            <button type="submit" disabled={submitting || subjects.length === 0} style={styles.submitBtn}>
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={styles.center}>Yükleniyor...</div>
      ) : sessions.length === 0 ? (
        <div style={styles.empty}>
          <BookOpen size={44} color="#cbd5e1" style={{ marginBottom: 10 }} />
          <div>Henüz seans yok. İlk seansını ekle!</div>
        </div>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {['Ders', 'Konu', 'Süre', 'Başlangıç', 'Tür', 'Notlar', ''].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const topicName = extractTopicFromNotes(s.notes);
                const displayNotes = s.notes?.replace(/Konu:\s*[^·]+(·\s*)?/, '').trim() || '—';
                return (
                <tr key={s.id} style={styles.tr}>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#4f46e5' }}>{s.subject?.name ?? '—'}</td>
                  <td style={{ ...styles.td, color: topicName ? '#0891b2' : '#94a3b8' }}>{topicName ?? '—'}</td>
                  <td style={styles.td}>{s.duration} dk</td>
                  <td style={styles.td}>
                    {new Date(s.started_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={styles.td}>
                    <span style={s.session_type === 'timer' ? styles.badgeTimer : styles.badgeManual}>
                      {s.session_type === 'timer' ? 'Zamanlayıcı' : 'Manuel'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: '#94a3b8', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayNotes}
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => handleDelete(s.id)} style={styles.deleteBtn}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 },
  addBtn: { padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  cancelBtn: { padding: '8px 18px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  card: { background: '#ffffff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' },
  warningBox: { background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', color: '#92400e', fontSize: 13, marginBottom: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, color: '#374151', fontWeight: 600 },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  input: { padding: '9px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, color: '#0f172a', fontSize: 14, outline: 'none' },
  submitBtn: { padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', color: '#dc2626', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: 11, fontWeight: 700, borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
  td: { padding: '13px 12px', color: '#374151', fontSize: 14 },
  badgeManual: { background: '#eef2ff', color: '#4f46e5', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  badgeTimer: { background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  deleteBtn: { padding: '4px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  center: { textAlign: 'center', color: '#94a3b8', paddingTop: 60 },
  empty: { textAlign: 'center', color: '#94a3b8', paddingTop: 40 },
};
