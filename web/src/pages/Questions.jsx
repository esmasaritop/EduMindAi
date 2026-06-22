import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Save, BookOpen, Hash, ArrowRight, Plus, X, PlusCircle } from 'lucide-react';
import { getQuestions, upsertQuestionStat, addQuestionStat } from '../api/questions';
import { getSubjects } from '../api/subjects';
import { getTopics, createTopic, updateTopic } from '../api/topics';

function StatInput({ label, value, color, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <input
        type="number"
        min="0"
        value={value}
        placeholder={placeholder}
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

function AddTopicModal({ onClose, onAdded }) {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [topics, setTopics] = useState([]);
  const [mode, setMode] = useState('new');
  const [topicName, setTopicName] = useState('');
  const [existingTopicId, setExistingTopicId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSubjects()
      .then((res) => {
        const list = res.data.data ?? [];
        setSubjects(list);
        if (list.length > 0) setSubjectId(String(list[0].id));
      })
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    if (!subjectId) return;
    getTopics(subjectId)
      .then((res) => {
        const untracked = (res.data.data ?? []).filter((t) => !t.track_questions);
        setTopics(untracked);
        setExistingTopicId(untracked.length > 0 ? String(untracked[0].id) : '');
        setMode(untracked.length > 0 ? 'existing' : 'new');
      })
      .catch(() => setTopics([]));
  }, [subjectId]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'existing') {
        if (!existingTopicId) {
          setError('Takibe alınacak konu seçin.');
          return;
        }
        const res = await updateTopic(Number(existingTopicId), { track_questions: true });
        onAdded(res.data.data);
      } else {
        if (!topicName.trim()) {
          setError('Konu adı girin.');
          return;
        }
        if (!subjectId) {
          setError('Ders seçin.');
          return;
        }
        const res = await createTopic(Number(subjectId), {
          name: topicName.trim(),
          track_questions: true,
        });
        onAdded(res.data.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Konu eklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>Konu Ekle</h3>
          <button type="button" onClick={onClose} style={s.modalClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit} style={s.modalForm}>
          <label style={s.modalLabel}>
            Ders
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              style={s.modalSelect}
            >
              {subjects.length === 0 && <option value="">Ders yok</option>}
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </label>

          {subjects.length === 0 ? (
            <p style={s.modalHint}>
              Önce <Link to="/subjects" style={s.link}>Derslerim</Link> sayfasından bir ders ekleyin.
            </p>
          ) : (
            <>
              <div style={s.modeTabs}>
                {topics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMode('existing')}
                    style={{ ...s.modeTab, ...(mode === 'existing' ? s.modeTabActive : {}) }}
                  >
                    Mevcut Konu
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  style={{ ...s.modeTab, ...(mode === 'new' ? s.modeTabActive : {}) }}
                >
                  Yeni Konu
                </button>
              </div>

              {mode === 'existing' ? (
                <label style={s.modalLabel}>
                  Takibe Alınacak Konu
                  <select
                    value={existingTopicId}
                    onChange={(e) => setExistingTopicId(e.target.value)}
                    style={s.modalSelect}
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <label style={s.modalLabel}>
                  Konu Adı
                  <input
                    type="text"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="Örn. Türev"
                    style={s.modalInput}
                  />
                </label>
              )}
            </>
          )}

          {error && <p style={s.modalError}>{error}</p>}

          <div style={s.modalActions}>
            <button type="button" onClick={onClose} style={s.modalCancelBtn}>İptal</button>
            <button type="submit" disabled={loading || subjects.length === 0} style={s.modalSubmitBtn}>
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionCard({ stat, onSaved }) {
  const [mode, setMode] = useState('add');
  const [savedValues, setSavedValues] = useState({
    total_questions: stat.total_questions ?? 0,
    correct: stat.correct ?? 0,
    wrong: stat.wrong ?? 0,
    empty: stat.empty ?? 0,
  });
  const [editForm, setEditForm] = useState({ ...savedValues });
  const [addForm, setAddForm] = useState({ total_questions: 0, correct: 0, wrong: 0, empty: 0 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next = {
      total_questions: stat.total_questions ?? 0,
      correct: stat.correct ?? 0,
      wrong: stat.wrong ?? 0,
      empty: stat.empty ?? 0,
    };
    setSavedValues(next);
    setEditForm(next);
  }, [stat.total_questions, stat.correct, stat.wrong, stat.empty]);

  const setEdit = (key) => (val) => {
    setEditForm((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const setAdd = (key) => (val) => {
    setAddForm((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await upsertQuestionStat(stat.topic_id, editForm);
      onSaved(res.data.data);
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const saveAdd = async () => {
    const hasValue = addForm.total_questions + addForm.correct + addForm.wrong + addForm.empty > 0;
    if (!hasValue) return;

    setSaving(true);
    try {
      const res = await addQuestionStat(stat.topic_id, addForm);
      onSaved(res.data.data);
      setAddForm({ total_questions: 0, correct: 0, wrong: 0, empty: 0 });
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const display = savedValues;
  const answered = display.correct + display.wrong + display.empty;
  const correctPct = answered > 0 ? Math.round((display.correct / answered) * 100) : 0;
  const wrongPct   = answered > 0 ? Math.round((display.wrong   / answered) * 100) : 0;
  const emptyPct   = answered > 0 ? Math.round((display.empty   / answered) * 100) : 0;
  const isNew = answered === 0 && display.total_questions === 0;
  const addTotal = addForm.correct + addForm.wrong + addForm.empty;
  const canAdd = addForm.total_questions + addForm.correct + addForm.wrong + addForm.empty > 0;

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
          <span style={s.qTotalNum}>{display.total_questions}</span>
          <span style={s.qTotalLabel}>Toplam Soru</span>
        </div>
      </div>

      {answered > 0 && (
        <>
          <div style={s.currentStats}>
            <span style={{ color: '#6366f1' }}>Toplam: {display.total_questions}</span>
            <span style={{ color: '#16a34a' }}>Doğru: {display.correct}</span>
            <span style={{ color: '#ef4444' }}>Yanlış: {display.wrong}</span>
            <span style={{ color: '#94a3b8' }}>Boş: {display.empty}</span>
          </div>
          <div style={s.progressBar}>
            <div style={{ ...s.progressSeg, background: '#16a34a', width: `${correctPct}%` }} title={`Doğru: ${correctPct}%`} />
            <div style={{ ...s.progressSeg, background: '#ef4444', width: `${wrongPct}%` }} title={`Yanlış: ${wrongPct}%`} />
            <div style={{ ...s.progressSeg, background: '#94a3b8', width: `${emptyPct}%` }} title={`Boş: ${emptyPct}%`} />
          </div>
          <div style={s.pctRow}>
            <span style={{ color: '#16a34a' }}>✓ {correctPct}%</span>
            <span style={{ color: '#ef4444' }}>✗ {wrongPct}%</span>
            <span style={{ color: '#94a3b8' }}>○ {emptyPct}%</span>
          </div>
        </>
      )}

      <div style={s.modeTabs}>
        <button
          type="button"
          onClick={() => { setMode('add'); setSaved(false); }}
          style={{ ...s.modeTab, ...(mode === 'add' ? s.modeTabActive : {}) }}
        >
          <PlusCircle size={13} style={{ marginRight: 4 }} />
          Soru Ekle
        </button>
        <button
          type="button"
          onClick={() => { setMode('edit'); setSaved(false); }}
          style={{ ...s.modeTab, ...(mode === 'edit' ? s.modeTabActive : {}) }}
        >
          <Save size={13} style={{ marginRight: 4 }} />
          Düzenle
        </button>
      </div>

      {mode === 'add' ? (
        <>
          <div style={s.hintBox}>
            {isNew
              ? <>İlk kaydınızı yapın: çözdüğünüz soru sayılarını yazıp <b>Ekle</b> butonuna basın.</>
              : <>Yeni çözdüğünüz soruları ekleyin — mevcut sayılara <b>eklenir</b>, üzerine yazılmaz.</>}
          </div>
          <div style={s.qInputRow}>
            <StatInput label="Toplam" value={addForm.total_questions} color="#6366f1" placeholder="0" onChange={setAdd('total_questions')} />
            <StatInput label="Doğru"  value={addForm.correct}         color="#16a34a" placeholder="0" onChange={setAdd('correct')} />
            <StatInput label="Yanlış" value={addForm.wrong}           color="#ef4444" placeholder="0" onChange={setAdd('wrong')} />
            <StatInput label="Boş"    value={addForm.empty}           color="#94a3b8" placeholder="0" onChange={setAdd('empty')} />
          </div>
          {addTotal > 0 && addForm.total_questions === 0 && (
            <p style={s.addHint}>Toplam boş bırakılırsa doğru + yanlış + boş otomatik toplam sayılır.</p>
          )}
          <button
            onClick={saveAdd}
            disabled={saving || !canAdd}
            style={{
              ...s.saveBtn,
              background: canAdd ? '#6366f1' : '#94a3b8',
            }}
          >
            <Plus size={13} style={{ marginRight: 5 }} />
            {saving ? 'Ekleniyor...' : saved && !canAdd ? 'Eklendi ✓' : 'Ekle'}
          </button>
        </>
      ) : (
        <>
          <div style={s.hintBox}>
            Tüm sayıları doğrudan güncelleyin. Yanlış kayıt düzeltmek için kullanın.
          </div>
          <div style={s.qInputRow}>
            <StatInput label="Toplam" value={editForm.total_questions} color="#6366f1" onChange={setEdit('total_questions')} />
            <StatInput label="Doğru"  value={editForm.correct}         color="#16a34a" onChange={setEdit('correct')} />
            <StatInput label="Yanlış" value={editForm.wrong}           color="#ef4444" onChange={setEdit('wrong')} />
            <StatInput label="Boş"    value={editForm.empty}           color="#94a3b8" onChange={setEdit('empty')} />
          </div>
          <button
            onClick={saveEdit}
            disabled={saving}
            style={{
              ...s.saveBtn,
              background: saved ? '#059669' : '#6366f1',
            }}
          >
            <Save size={13} style={{ marginRight: 5 }} />
            {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi ✓' : 'Kaydet'}
          </button>
        </>
      )}
    </div>
  );
}

export default function Questions() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleTopicAdded = () => {
    fetchStats();
  };

  if (loading) return <div style={s.center}>Yükleniyor...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Sorularım</h2>
          <p style={s.subtitle}>Konu bazında soru sayılarını ekleyin veya güncelleyin</p>
        </div>
        <div style={s.headerActions}>
          <button type="button" onClick={() => setShowAddModal(true)} style={s.addBtn}>
            <Plus size={15} style={{ marginRight: 6 }} />
            Konu Ekle
          </button>
          <span style={s.count}>{stats.length} konu takipte</span>
        </div>
      </div>

      {stats.length === 0 ? (
        <div style={s.empty}>
          <HelpCircle size={52} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>Henüz takip edilen konu yok</div>
          <div style={s.emptyHint}>
            <b>Konu Ekle</b> butonuyla buradan yeni konu ekleyebilir veya<br />
            <Link to="/subjects" style={s.link}>Derslerim</Link> sayfasından bir konunun <b>Soru Takibi</b>ni açabilirsiniz.
          </div>
          <button type="button" onClick={() => setShowAddModal(true)} style={s.emptyBtn}>
            <Plus size={14} style={{ marginRight: 6 }} />
            Konu Ekle
          </button>
        </div>
      ) : (
        <div style={s.grid}>
          {stats.map((stat) => (
            <QuestionCard key={stat.topic_id ?? stat.id} stat={stat} onSaved={handleSaved} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTopicModal onClose={() => setShowAddModal(false)} onAdded={handleTopicAdded} />
      )}
    </div>
  );
}

const s = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  headerActions: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  title: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  count: { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '3px 12px', borderRadius: 12, fontSize: 13 },
  addBtn: { display: 'inline-flex', alignItems: 'center', padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  qCard: { background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 14 },
  qCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  qSubject: { display: 'flex', alignItems: 'center', fontSize: 13, color: '#6366f1', fontWeight: 700 },
  qTopic: { display: 'flex', alignItems: 'center', fontSize: 15, color: '#0f172a', fontWeight: 700, marginTop: 4 },
  qTotal: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  qTotalNum: { fontSize: 26, fontWeight: 800, color: '#6366f1' },
  qTotalLabel: { fontSize: 11, color: '#94a3b8' },
  currentStats: { display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, fontWeight: 600 },
  hintBox: { background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#92400e', lineHeight: 1.5 },
  addHint: { fontSize: 12, color: '#64748b', margin: 0 },
  progressBar: { display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', background: '#f1f5f9' },
  progressSeg: { height: '100%', transition: 'width 0.4s ease' },
  qInputRow: { display: 'flex', justifyContent: 'space-between', gap: 8 },
  pctRow: { display: 'flex', gap: 14, fontSize: 12, fontWeight: 700 },
  modeTabs: { display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 8 },
  modeTab: { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 10px', border: 'none', borderRadius: 6, background: 'transparent', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  modeTabActive: { background: '#fff', color: '#6366f1', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  saveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%' },
  center: { textAlign: 'center', color: '#94a3b8', paddingTop: 60 },
  empty: { textAlign: 'center', padding: '40px 24px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' },
  emptyHint: { fontSize: 14, color: '#64748b', lineHeight: 2, marginBottom: 20 },
  link: { color: '#6366f1', fontWeight: 600, textDecoration: 'none' },
  emptyBtn: { display: 'inline-flex', alignItems: 'center', padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #e2e8f0' },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 },
  modalForm: { padding: 20, display: 'flex', flexDirection: 'column', gap: 14 },
  modalLabel: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151' },
  modalSelect: { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' },
  modalInput: { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' },
  modalHint: { fontSize: 13, color: '#64748b', margin: 0 },
  modalError: { fontSize: 13, color: '#ef4444', margin: 0 },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  modalCancelBtn: { padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' },
  modalSubmitBtn: { padding: '9px 16px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};
