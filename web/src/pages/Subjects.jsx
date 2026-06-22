import { useEffect, useState } from 'react';
import { Plus, Trash2, BookOpen, ChevronDown, ChevronUp, Clock, HelpCircle, Pencil, X, Save } from 'lucide-react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../api/subjects';
import { getTopics, createTopic, updateTopic, deleteTopic } from '../api/topics';
import { confirmDelete } from '../utils/swal';

/* ─── EditNameModal ─── */
function EditNameModal({ title, initialName, maxLength, onClose, onSave }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed === initialName.trim()) {
      onClose();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(trimmed);
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : 'Güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, width: 380 }} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>{title}</span>
          <button onClick={onClose} style={s.iconBtn}><X size={16} /></button>
        </div>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={s.errorBox}>{error}</div>}
          <div>
            <label style={s.label}>Ad</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={maxLength}
              autoFocus
              style={s.input}
            />
          </div>
          <button type="submit" disabled={saving || !name.trim()} style={s.saveBtn}>
            <Save size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── TopicRow ─── */
function TopicRow({ topic, onDeleted, onUpdated }) {
  const [editing, setEditing] = useState(false);

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

  const saveName = async (name) => {
    const res = await updateTopic(topic.id, { name });
    onUpdated(res.data.data);
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
        <button
          onClick={toggleTrack}
          title={topic.track_questions ? 'Soru takibini kapat' : 'Soru takibini aç'}
          style={{ ...s.trackBtn, ...(topic.track_questions ? s.trackBtnOn : {}) }}
        >
          <HelpCircle size={12} style={{ marginRight: 3 }} />
          {topic.track_questions ? 'Takipte' : 'Soru Takibi'}
        </button>

        <button onClick={() => setEditing(true)} style={s.editBtn} title="Konuyu düzenle">
          <Pencil size={13} />
        </button>
        <button onClick={del} style={s.deleteSmBtn} title="Konuyu sil">
          <Trash2 size={13} />
        </button>
      </div>

      {editing && (
        <EditNameModal
          title="Konuyu Düzenle"
          initialName={topic.name}
          maxLength={200}
          onClose={() => setEditing(false)}
          onSave={saveName}
        />
      )}
    </div>
  );
}

/* ─── SubjectCard ─── */
function SubjectCard({ subject, onDeleted, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
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

  const saveSubjectName = async (name) => {
    const res = await updateSubject(subject.id, { name });
    onUpdated(res.data.data);
  };

  return (
    <div style={s.subjectCard}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            style={s.editBtn}
            title="Dersi düzenle"
          >
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDeleted(subject.id); }} style={s.deleteBtn} title="Dersi sil">
            <Trash2 size={14} />
          </button>
          {open ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </div>
      </div>

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
                <TopicRow key={t.id} topic={t} onDeleted={handleDeleted} onUpdated={handleUpdated} />
              ))}

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

      {editing && (
        <EditNameModal
          title="Dersi Düzenle"
          initialName={subject.name}
          maxLength={100}
          onClose={() => setEditing(false)}
          onSave={saveSubjectName}
        />
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

  const handleUpdateSubject = (updated) => {
    setSubjects((prev) => prev.map((s) => s.id === updated.id ? updated : s));
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
            <SubjectCard
              key={subject.id}
              subject={subject}
              onDeleted={handleDeleteSubject}
              onUpdated={handleUpdateSubject}
            />
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
  input: { padding: '9px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' },
  addBtn: { padding: '9px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 },
  subjectCard: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  subjectHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' },
  subjectLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  subjectIconBox: { width: 40, height: 40, background: '#eef2ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 },
  subjectName: { fontSize: 15, fontWeight: 600, color: '#0f172a' },
  subjectDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#94a3b8' },
  editBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#6366f1', display: 'flex' },
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
  deleteSmBtn: { padding: '4px 8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', display: 'flex' },
  addTopicToggleBtn: { display: 'flex', alignItems: 'center', padding: '7px 14px', background: '#eef2ff', color: '#4f46e5', border: '1px dashed #a5b4fc', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start', marginTop: 4 },
  addTopicForm: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  addTopicBtn: { padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  cancelSmBtn: { padding: '8px 12px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: 13 },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modal: { background: '#fff', borderRadius: 14, padding: '24px 28px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6, display: 'flex' },
  label: { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' },
  saveBtn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, alignSelf: 'flex-end' },
  center: { textAlign: 'center', color: '#94a3b8', paddingTop: 60 },
  empty: { textAlign: 'center', paddingTop: 40 },
  emptyHint: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
};
