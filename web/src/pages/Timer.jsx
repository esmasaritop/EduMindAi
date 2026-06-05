import { useEffect, useRef, useState } from 'react';
import { Play, Square, RefreshCw, BookOpen, Hash, Timer, Clock } from 'lucide-react';
import { getSubjects } from '../api/subjects';
import { getTopics, addTopicTime } from '../api/topics';
import { createSession } from '../api/studySessions';

function fmtTime(secs) {
  const safe = Math.max(0, secs);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const sc = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
}

const COUNTDOWN_PRESETS = [
  { label: '2 saat', hours: 2, minutes: 0 },
  { label: '2,5 saat', hours: 2, minutes: 30 },
  { label: '3 saat', hours: 3, minutes: 0 },
];

function TimerPanel({
  mode,
  title,
  subtitle,
  icon: Icon,
  accent,
  displaySeconds,
  displayColor,
  running,
  canStart,
  canSave,
  saving,
  message,
  saved,
  onStart,
  onStop,
  onSave,
  onReset,
  children,
}) {
  return (
    <div style={{ ...panel.card, borderColor: running ? accent : '#e2e8f0', boxShadow: running ? `0 0 0 3px ${accent}22` : panel.card.boxShadow }}>
      <div style={panel.header}>
        <div style={{ ...panel.iconWrap, background: `${accent}18`, color: accent }}>
          <Icon size={20} />
        </div>
        <div>
          <div style={panel.title}>{title}</div>
          <div style={panel.subtitle}>{subtitle}</div>
        </div>
      </div>

      {children}

      <div style={{ ...panel.clock, color: displayColor }}>
        {fmtTime(displaySeconds)}
      </div>

      <div style={panel.btns}>
        {!running ? (
          <button
            onClick={onStart}
            disabled={!canStart}
            style={{
              ...panel.bigBtn,
              background: canStart ? accent : '#e2e8f0',
              color: canStart ? '#fff' : '#94a3b8',
            }}
          >
            <Play size={16} style={{ marginRight: 6 }} />Başlat
          </button>
        ) : (
          <button onClick={onStop} style={{ ...panel.bigBtn, background: '#ef4444' }}>
            <Square size={16} style={{ marginRight: 6 }} />Durdur
          </button>
        )}

        {canSave && !running && (
          <button onClick={onSave} disabled={saving} style={panel.saveBtn}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        )}

        {canSave && (
          <button onClick={onReset} style={panel.resetBtn}>
            <RefreshCw size={15} />
          </button>
        )}
      </div>

      {message && (
        <div style={{
          ...panel.msgBox,
          background: saved ? '#f0fdf4' : '#fef2f2',
          color: saved ? '#16a34a' : '#ef4444',
          borderColor: saved ? '#bbf7d0' : '#fecaca',
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default function TimerPage() {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');

  const [activeMode, setActiveMode] = useState(null);

  // Geri sayım (zamanlayıcı)
  const [countdownHours, setCountdownHours] = useState(2);
  const [countdownMinutes, setCountdownMinutes] = useState(30);
  const [countdownTarget, setCountdownTarget] = useState(0);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [countdownRunning, setCountdownRunning] = useState(false);
  const [countdownMessage, setCountdownMessage] = useState('');
  const [countdownSaved, setCountdownSaved] = useState(false);

  // Kronometre
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchMessage, setStopwatchMessage] = useState('');
  const [stopwatchSaved, setStopwatchSaved] = useState(false);

  const [savingMode, setSavingMode] = useState(null);

  const countdownStartRef = useRef(null);
  const stopwatchStartRef = useRef(null);

  useEffect(() => {
    getSubjects().then((res) => setSubjects(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setTopicId('');
    if (!subjectId) { setTopics([]); return; }
    getTopics(Number(subjectId)).then((res) => setTopics(res.data.data)).catch(() => setTopics([]));
  }, [subjectId]);

  const targetSeconds = countdownHours * 3600 + countdownMinutes * 60;
  const countdownElapsed = countdownTarget > 0 ? countdownTarget - countdownRemaining : 0;
  const selectionLocked = activeMode !== null;

  useEffect(() => {
    if (!countdownRunning) return undefined;
    const id = setInterval(() => {
      setCountdownRemaining((prev) => {
        if (prev <= 1) {
          setCountdownRunning(false);
          setActiveMode(null);
          setCountdownMessage('Süre doldu! Kaydet butonuna basarak oturumu kaydedebilirsiniz.');
          setCountdownSaved(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdownRunning]);

  useEffect(() => {
    if (!stopwatchRunning) return undefined;
    const id = setInterval(() => setStopwatchElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [stopwatchRunning]);

  const startCountdown = () => {
    if (!subjectId || targetSeconds < 1 || activeMode) return;
    countdownStartRef.current = new Date();
    setCountdownTarget(targetSeconds);
    setCountdownRemaining(targetSeconds);
    setCountdownRunning(true);
    setActiveMode('countdown');
    setCountdownSaved(false);
    setCountdownMessage('');
  };

  const stopCountdown = () => {
    setCountdownRunning(false);
    setActiveMode(null);
  };

  const resetCountdown = () => {
    setCountdownRunning(false);
    setActiveMode(null);
    setCountdownTarget(0);
    setCountdownRemaining(0);
    setCountdownSaved(false);
    setCountdownMessage('');
  };

  const startStopwatch = () => {
    if (!subjectId || activeMode) return;
    stopwatchStartRef.current = new Date();
    setStopwatchRunning(true);
    setActiveMode('stopwatch');
    setStopwatchSaved(false);
    setStopwatchMessage('');
  };

  const stopStopwatch = () => {
    setStopwatchRunning(false);
    setActiveMode(null);
  };

  const resetStopwatch = () => {
    setStopwatchRunning(false);
    setActiveMode(null);
    setStopwatchElapsed(0);
    setStopwatchSaved(false);
    setStopwatchMessage('');
  };

  const applyPreset = (hours, minutes) => {
    if (selectionLocked) return;
    setCountdownHours(hours);
    setCountdownMinutes(minutes);
  };

  const saveSession = async (mode) => {
    const elapsedSeconds = mode === 'countdown' ? countdownElapsed : stopwatchElapsed;
    if (elapsedSeconds < 1) return;

    setSavingMode(mode);
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const startRef = mode === 'countdown' ? countdownStartRef : stopwatchStartRef;
    const startedAt = startRef.current?.toISOString().slice(0, 16) ?? new Date().toISOString().slice(0, 16);
    const endedAt = new Date().toISOString().slice(0, 16);
    const topicName = topics.find((t) => String(t.id) === topicId)?.name ?? '';
    const modeLabel = mode === 'countdown' ? 'Geri sayım' : 'Kronometre';
    const notes = [modeLabel, topicName ? `Konu: ${topicName}` : ''].filter(Boolean).join(' · ');

    try {
      const promises = [
        createSession({
          subject_id: Number(subjectId),
          duration: minutes,
          started_at: startedAt,
          ended_at: endedAt,
          session_type: 'timer',
          notes,
        }),
      ];
      if (topicId) promises.push(addTopicTime(Number(topicId), minutes));
      await Promise.all(promises);

      if (mode === 'countdown') {
        setCountdownSaved(true);
        setCountdownMessage(`${minutes} dakika kaydedildi!`);
        resetCountdown();
      } else {
        setStopwatchSaved(true);
        setStopwatchMessage(`${minutes} dakika kaydedildi!`);
        resetStopwatch();
      }
    } catch {
      if (mode === 'countdown') {
        setCountdownMessage('Kaydedilirken bir hata oluştu.');
        setCountdownSaved(false);
      } else {
        setStopwatchMessage('Kaydedilirken bir hata oluştu.');
        setStopwatchSaved(false);
      }
    } finally {
      setSavingMode(null);
    }
  };

  const selectedSubject = subjects.find((s) => String(s.id) === subjectId);
  const selectedTopic = topics.find((t) => String(t.id) === topicId);

  return (
    <div style={s.page}>
      <div>
        <h2 style={s.title}>Zamanlayıcı & Kronometre</h2>
        <p style={s.subtitle}>Deneme için geri sayım veya serbest çalışma için kronometre kullanın</p>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Ders & Konu Seç</h3>
        {(selectedSubject || selectionLocked) && (
          <div style={s.activeInfo}>
            <span style={s.activeSubject}>{selectedSubject?.name}</span>
            {selectedTopic && <span style={s.activeTopic}>→ {selectedTopic.name}</span>}
          </div>
        )}
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}><BookOpen size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Ders</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={s.select} disabled={selectionLocked}>
              <option value="">— Ders seçin —</option>
              {subjects.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}><Hash size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Konu (isteğe bağlı)</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} style={s.select} disabled={selectionLocked || !subjectId}>
              <option value="">— Konu seçin —</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={s.grid}>
        <TimerPanel
          mode="countdown"
          title="Zamanlayıcı"
          subtitle="Geri sayım — deneme süresi ayarlayın"
          icon={Timer}
          accent="#6366f1"
          displaySeconds={countdownRunning || countdownElapsed > 0 ? countdownRemaining : targetSeconds}
          displayColor={countdownRunning ? '#6366f1' : countdownRemaining === 0 && countdownElapsed > 0 ? '#dc2626' : '#0f172a'}
          running={countdownRunning}
          canStart={!!subjectId && targetSeconds > 0 && !activeMode}
          canSave={countdownElapsed > 0}
          saving={savingMode === 'countdown'}
          message={countdownMessage}
          saved={countdownSaved}
          onStart={startCountdown}
          onStop={stopCountdown}
          onSave={() => saveSession('countdown')}
          onReset={resetCountdown}
        >
          <div style={panel.setup}>
            <div style={panel.durationRow}>
              <div style={panel.durationField}>
                <label style={panel.durationLabel}>Saat</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={countdownHours}
                  onChange={(e) => setCountdownHours(Math.max(0, Number(e.target.value)))}
                  disabled={selectionLocked}
                  style={panel.durationInput}
                />
              </div>
              <div style={panel.durationField}>
                <label style={panel.durationLabel}>Dakika</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={countdownMinutes}
                  onChange={(e) => setCountdownMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                  disabled={selectionLocked}
                  style={panel.durationInput}
                />
              </div>
            </div>
            <div style={panel.presets}>
              {COUNTDOWN_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.hours, preset.minutes)}
                  disabled={selectionLocked}
                  style={panel.presetBtn}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </TimerPanel>

        <TimerPanel
          mode="stopwatch"
          title="Kronometre"
          subtitle="Yukarı sayım — serbest çalışma"
          icon={Clock}
          accent="#0891b2"
          displaySeconds={stopwatchElapsed}
          displayColor={stopwatchRunning ? '#0891b2' : stopwatchElapsed > 0 ? '#ea580c' : '#0f172a'}
          running={stopwatchRunning}
          canStart={!!subjectId && !activeMode}
          canSave={stopwatchElapsed > 0}
          saving={savingMode === 'stopwatch'}
          message={stopwatchMessage}
          saved={stopwatchSaved}
          onStart={startStopwatch}
          onStop={stopStopwatch}
          onSave={() => saveSession('stopwatch')}
          onReset={resetStopwatch}
        />
      </div>

      <div style={s.tipCard}>
        <div style={s.tipTitle}>Nasıl kullanılır?</div>
        <div style={s.tipGrid}>
          <div>
            <strong>Zamanlayıcı (sol):</strong> Deneme süresi ayarlayın (ör. 2,5 saat), başlatın. Süre bitince uyarı alırsınız.
          </div>
          <div>
            <strong>Kronometre (sağ):</strong> Süre sınırı olmadan çalışın; durdurup geçen süreyi kaydedin.
          </div>
        </div>
      </div>
    </div>
  );
}

const panel = {
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '24px 20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 0,
  },
  header: { display: 'flex', alignItems: 'center', gap: 12, alignSelf: 'stretch' },
  iconWrap: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  setup: { alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 10 },
  durationRow: { display: 'flex', gap: 10 },
  durationField: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  durationLabel: { fontSize: 11, fontWeight: 600, color: '#64748b' },
  durationInput: { padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none' },
  presets: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  presetBtn: { padding: '5px 10px', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  clock: { fontSize: 52, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', transition: 'color 0.3s' },
  btns: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  bigBtn: { display: 'flex', alignItems: 'center', padding: '11px 22px', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff' },
  saveBtn: { padding: '10px 18px', background: '#059669', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  resetBtn: { padding: '10px', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', display: 'flex' },
  msgBox: { padding: '8px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 600, textAlign: 'center', alignSelf: 'stretch' },
};

const s = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  title: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 12px 0' },
  activeInfo: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  activeSubject: { fontSize: 14, fontWeight: 700, color: '#6366f1' },
  activeTopic: { fontSize: 13, color: '#94a3b8' },
  row: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  field: { flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  select: { padding: '9px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 14, outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 },
  tipCard: { background: '#fffbeb', borderRadius: 12, padding: '16px 20px', border: '1px solid #fcd34d' },
  tipTitle: { fontWeight: 700, color: '#92400e', marginBottom: 10, fontSize: 14 },
  tipGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, color: '#78350f', fontSize: 13, lineHeight: 1.5 },
};
