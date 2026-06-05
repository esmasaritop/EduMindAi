import { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, BookOpen, ChevronDown, ChevronUp, Clock, Play, Square, RefreshCw, HelpCircle } from 'lucide-react';
import { getSubjects, createSubject, deleteSubject } from '../api/subjects';
import { getTopics, createTopic, updateTopic, addTopicTime, deleteTopic } from '../api/topics';
import { createSession } from '../api/studySessions';
import { confirmDelete } from '../utils/swal';

/* ─── Helpers ─── */
function fmtTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h > 0 && String(h).padStart(2, '0'), String(m).padStart(2, '0'), String(s).padStart(2, '0')]
    .filter(Boolean).join(':');
}

/* ─── Timer ─── */
function TopicTimer({ subject, topic, onSaved }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const startRef = useRef(null);

  const start = () => {
    startRef.current = new Date();
    setRunning(true);
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const stop = async () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const startedAt = startRef.current.toISOString().slice(0, 16);
    const endedAt = new Date().toISOString().slice(0, 16);
    try {
      await Promise.all([
        addTopicTime(topic.id, minutes),
        createSession({
          subject_id: subject.id,
          duration: minutes,
          started_at: startedAt,
          ended_at: endedAt,
          session_type: 'timer',
          notes: `Konu: ${topic.name}`,
        }),
      ]);
      onSaved(minutes);
    } catch (e) {
      console.error(e);
    }
    setElapsed(0);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
  };

  return (
    <div style={ts.wrap}>
      <span style={ts.time}>{fmtTime(elapsed)}</span>
      {!running
        ? <button onClick={start} style={ts.startBtn}><Play size={12} style={{ marginRight: 4 }} />Başlat</button>
        : <button onClick={stop} style={ts.stopBtn}><Square size={12} style={{ marginRight: 4 }} />Durdur & Kaydet</button>
      }
      {(elapsed > 0 && !running) && (
        <button onClick={reset} style={ts.resetBtn}><RefreshCw size={12} /></button>
      )}
    </div>
  );
}

const ts = {
  wrap: { display: 'flex', alignItems: 'center', gap: 6 },
  time: { fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 13, color: '#6366f1', minWidth: 52 },
  startBtn: { display: 'flex', alignItems: 'center', padding: '4px 10px', background: '#ecfdf5', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  stopBtn: { display: 'flex', alignItems: 'center', padding: '4px 10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  resetBtn: { padding: '4px 8px', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', display: 'flex' },
};

/* ─── ManualTimeModal ─── */
function ManualTimeModal({ topic, onClose, onSaved }) {
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const total = (Number(hours) * 60) + Number(mins);
    if (total < 1) return;
    setSaving(true);
    try {
      await addTopicTime(topic.id, total);
      onSaved(total);
      onClose();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, width: 320 }} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>Süre Ekle – {topic.name}</span>
          <button onClick={onClose} style={s.iconBtn}>✕</button>
        </div>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Saat</label>
              <input type="number" min="0" max="23" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" style={s.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Dakika</label>
              <input type="number" min="0" max="59" value={mins} onChange={(e) => setMins(e.target.value)} placeholder="30" style={s.input} />
            </div>
          </div>
          <button type="submit" disabled={saving || (Number(hours) * 60 + Number(mins)) < 1} style={s.saveBtn}>
            {saving ? 'Kaydediliyor...' : 'Ekle'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── TopicRow ─── */
function TopicRow({ subject, topic, onDeleted, onUpdated }) {
  const [manualOpen, setManualOpen] = useState(false);

  const handleTimerSaved = (mins) => onUpdated({ ...topic, study_time_minutes: topic.study_time_minutes + mins });
  const handleManualSaved = (mins) => { onUpdated({ ...topic, study_time_minutes: topic.study_time_minutes + mins }); };

  const toggleTrack = async () => {
    try {
      const res = await updateTopic(topic.id, { track_questions: !topic.track_questions });
      onUpdated(res.data.data);
    } catch (e) { console.error(e); }
  };

  const del = async () => {
    const confirmed = await confirmDelete({
      title: 'Konuyu sil?',
      text: `"${topic.name}" konusu kalıcı olarak silinecek.`,
    });
    if (!confirmed) return;
    await deleteTopic(topic.id);
    onDeleted(topic.id);
  };

  const totalMins = topic.study_time_minutes || 0;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const timeStr = h > 0 ? `${h}s ${m}dk` : `${m}dk`;

  return (
    <div style={s.topicRow}>
      <div style={s.topicLeft}>
        <div style={s.topicDot} />
        <div>
          <span style={s.topicName}>{topic.name}</span>
          <div style={s.topicMeta}>
            <Clock size={11} style={{ marginRight: 3 }} />
            {totalMins > 0 ? timeStr : '0 dk'}
          </div>
        </div>
      </div>

      <div style={s.topicActions}>
        {/* Soru takibi toggle */}
        <button
          onClick={toggleTrack}
          title={topic.track_questions ? 'Soru takibini kapat' : 'Soru takibini aç'}
          style={{ ...s.trackBtn, ...(topic.track_questions ? s.trackBtnOn : {}) }}
        >
          <HelpCircle size={12} style={{ marginRight: 3 }} />
          {topic.track_questions ? 'Takipte' : 'Soru Takibi'}
        </button>

        {/* Manuel süre */}
        <button onClick={() => setManualOpen(true)} style={s.manualBtn}>
          <Plus size={12} style={{ marginRight: 3 }} />
          Süre Ekle
        </button>

        {/* Timer */}
        <TopicTimer subject={subject} topic={topic} onSaved={handleTimerSaved} />

        {/* Sil */}
        <button onClick={del} style={s.deleteSmBtn}><Trash2 size={13} /></button>
      </div>

      {manualOpen && (
        <ManualTimeModal topic={topic} onClose={() => setManualOpen(false)} onSaved={handleManualSaved} />
      )}
    </div>
  );
}

/* ─── SubjectCard ─── */
function SubjectCard({ subject, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [trackNew, setTrackNew] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);

  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const res = await getTopics(subject.id);
      setTopics(res.data.data);
    } catch (e) { setTopics([]); }
    finally { setLoadingTopics(false); }
  };

  const toggle = () => {
    if (!open) fetchTopics();
    setOpen(!open);
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setAddingTopic(true);
    try {
      const res = await createTopic(subject.id, { name: newTopicName.trim(), track_questions: trackNew });
      setTopics((prev) => [...prev, res.data.data]);
      setNewTopicName('');
      setTrackNew(false);
      setShowTopicForm(false);
    } catch (err) { console.error(err); }
    finally { setAddingTopic(false); }
  };

  const handleDeleted = (id) => setTopics((prev) => prev.filter((t) => t.id !== id));
  const handleUpdated = (updated) => setTopics((prev) => prev.map((t) => t.id === updated.id ? updated : t));

  return (
    <div style={s.subjectCard}>
      {/* Header */}
      <div style={s.subjectHeader} onClick={toggle}>
        <div style={s.subjectLeft}>
          <div style={s.subjectIconBox}><BookOpen size={18} strokeWidth={1.8} /></div>
          <div>
            <div style={s.subjectName}>{subject.name}</div>
            <div style={s.subjectDate}>
              {new Date(subject.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde eklendi
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={(e) => { e.stopPropagation(); onDeleted(subject.id); }} style={s.deleteBtn} title="Dersi sil">
            <Trash2 size={14} />
          </button>
          {open ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </div>
      </div>

      {/* Topics */}
      {open && (
        <div style={s.topicsWrap}>
          {loadingTopics ? (
            <div style={s.topicsLoading}>Konular yükleniyor...</div>
          ) : (
            <>
              {topics.length === 0 && (
                <div style={s.topicsEmpty}>Henüz konu eklenmemiş. Aşağıdan ekleyin.</div>
              )}
              {topics.map((t) => (
                <TopicRow key={t.id} subject={subject} topic={t} onDeleted={handleDeleted} onUpdated={handleUpdated} />
              ))}

              {/* Add Topic */}
              {!showTopicForm ? (
                <button onClick={() => setShowTopicForm(true)} style={s.addTopicToggleBtn}>
                  <Plus size={13} style={{ marginRight: 4 }} />Konu Ekle
                </button>
              ) : (
                <form onSubmit={handleAddTopic} style={s.addTopicForm}>
                  <input
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Konu adı (ör: Türev, Üslü Sayılar...)"
                    style={{ ...s.input, flex: 1 }}
                    autoFocus
                  />
                  <label style={s.checkLabel}>
                    <input type="checkbox" checked={trackNew} onChange={(e) => setTrackNew(e.target.checked)} />
                    Soru takibi
                  </label>
                  <button type="submit" disabled={addingTopic || !newTopicName.trim()} style={s.addTopicBtn}>
                    {addingTopic ? '...' : 'Ekle'}
                  </button>
                  <button type="button" onClick={() => { setShowTopicForm(false); setNewTopicName(''); }} style={s.cancelSmBtn}>
                    İptal
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Subjects Page ─── */
export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchSubjects = () => {
    setLoading(true);
    getSubjects()
      .then((res) => setSubjects(res.data.data))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createSubject({ name: newName.trim() });
      setNewName('');
      fetchSubjects();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : 'Bir hata oluştu.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteSubject = async (id) => {
    const confirmed = await confirmDelete({
      title: 'Dersi sil?',
      text: 'Bu ders ve tüm konuları kalıcı olarak silinecek.',
    });
    if (!confirmed) return;
    await deleteSubject(id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Derslerim</h2>
        <span style={s.count}>{subjects.length} ders</span>
      </div>

      <div style={s.addCard}>
        <h3 style={s.cardTitle}>Yeni Ders Ekle</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text" value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
            placeholder="Ders adı (ör: Matematik, Fizik, İngilizce...)"
            maxLength={100} style={{ ...s.input, flex: 1 }}
          />
          <button type="submit" disabled={submitting || !newName.trim()} style={s.addBtn}>
            {submitting ? '...' : <><Plus size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Ekle</>}
          </button>
        </form>
        {error && <div style={s.errorBox}>{error}</div>}
      </div>

      {loading ? (
        <div style={s.center}>Yükleniyor...</div>
      ) : subjects.length === 0 ? (
        <div style={s.empty}>
          <BookOpen size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, color: '#374151' }}>Henüz ders eklemediniz</div>
          <div style={s.emptyHint}>Yukarıdan ilk dersinizi ekleyin.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} onDeleted={handleDeleteSubject} />
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 },
  count: { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '3px 12px', borderRadius: 12, fontSize: 13 },
  addCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 12px 0' },
  input: { padding: '9px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 14, outline: 'none' },
  addBtn: { padding: '9px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' },
  errorBox: { marginTop: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 },
  /* Subject Card */
  subjectCard: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  subjectHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' },
  subjectLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  subjectIconBox: { width: 40, height: 40, background: '#eef2ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 },
  subjectName: { fontSize: 15, fontWeight: 600, color: '#0f172a' },
  subjectDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#94a3b8' },
  /* Topics */
  topicsWrap: { borderTop: '1px solid #f1f5f9', padding: '12px 18px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  topicsLoading: { color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '10px 0' },
  topicsEmpty: { color: '#94a3b8', fontSize: 13, padding: '4px 0 8px' },
  topicRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 },
  topicLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  topicDot: { width: 7, height: 7, background: '#a5b4fc', borderRadius: '50%', flexShrink: 0 },
  topicName: { fontSize: 14, fontWeight: 600, color: '#1e293b' },
  topicMeta: { display: 'flex', alignItems: 'center', fontSize: 11, color: '#94a3b8', marginTop: 2 },
  topicActions: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  trackBtn: { display: 'flex', alignItems: 'center', padding: '4px 10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  trackBtnOn: { background: '#eef2ff', color: '#4f46e5', border: '1px solid #a5b4fc' },
  manualBtn: { display: 'flex', alignItems: 'center', padding: '4px 10px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  deleteSmBtn: { padding: '4px 8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', display: 'flex' },
  addTopicToggleBtn: { display: 'flex', alignItems: 'center', padding: '7px 14px', background: '#eef2ff', color: '#4f46e5', border: '1px dashed #a5b4fc', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start', marginTop: 4 },
  addTopicForm: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  addTopicBtn: { padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  cancelSmBtn: { padding: '8px 12px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: 13 },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' },
  /* Modal */
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modal: { background: '#fff', borderRadius: 14, padding: '24px 28px', width: 380, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' },
  saveBtn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  center: { textAlign: 'center', color: '#94a3b8', paddingTop: 60 },
  empty: { textAlign: 'center', paddingTop: 40 },
  emptyHint: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
};
