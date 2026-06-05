export default function AuthLayout({ children }) {
  return (
    <div style={s.wrapper}>
      {/* SOL — Animasyonlu panel */}
      <div style={s.left}>
        {/* Arka plan blob'ları */}
        <div style={{ ...s.blob, ...s.blob1 }} />
        <div style={{ ...s.blob, ...s.blob2 }} />
        <div style={{ ...s.blob, ...s.blob3 }} />

        {/* Hareketli geometrik şekiller */}
        <div style={{ ...s.shape, ...s.shape1 }} />
        <div style={{ ...s.shape, ...s.shape2 }} />
        <div style={{ ...s.shape, ...s.shape3 }} />
        <div style={{ ...s.shape, ...s.shape4 }} />
        <div style={{ ...s.shape, ...s.shape5 }} />

        {/* Ring animasyonu */}
        <div style={s.ringWrap}>
          <div style={s.ring} />
          <div style={{ ...s.ring, ...s.ring2 }} />
        </div>

        {/* İçerik */}
        <div style={s.leftContent}>
          <img src="/logo.png" alt="EduMind AI" style={s.logo} />
          <h1 style={s.brand}>EduMind <span style={s.brandAi}>AI</span></h1>
          <p style={s.tagline}>Akıllı çalışma takip sistemi</p>

          <div style={s.featureList}>
            {[
              { icon: '⏱', text: 'Çalışma sürelerini takip et' },
              { icon: '🎯', text: 'Günlük ve haftalık hedefler belirle' },
              { icon: '📊', text: 'Performansını analiz et' },
              { icon: '🤖', text: 'AI destekli öneriler al' },
            ].map((f, i) => (
              <div key={i} style={{ ...s.featureItem, animationDelay: `${i * 0.12}s` }}>
                <div style={s.featureIcon}>{f.icon}</div>
                <span style={s.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SAĞ — Form alanı */}
      <div style={s.right}>
        {children}
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9',
  },

  /* ── Sol Panel ── */
  left: {
    flex: '0 0 48%',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  blob: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(60px)',
    opacity: 0.25,
  },
  blob1: {
    width: 380, height: 380,
    background: '#a78bfa',
    top: '-80px', left: '-80px',
    animation: 'drift 8s ease-in-out infinite',
  },
  blob2: {
    width: 300, height: 300,
    background: '#38bdf8',
    bottom: '-60px', right: '-60px',
    animation: 'drift 10s ease-in-out infinite reverse',
  },
  blob3: {
    width: 220, height: 220,
    background: '#f0abfc',
    top: '40%', left: '55%',
    animation: 'float3 7s ease-in-out infinite',
  },

  shape: {
    position: 'absolute',
    border: '2px solid rgba(255,255,255,0.18)',
    borderRadius: 16,
  },
  shape1: {
    width: 90, height: 90,
    top: '12%', left: '10%',
    borderRadius: '50%',
    animation: 'float1 5s ease-in-out infinite',
  },
  shape2: {
    width: 60, height: 60,
    top: '25%', right: '14%',
    transform: 'rotate(30deg)',
    animation: 'float2 6s ease-in-out infinite',
  },
  shape3: {
    width: 44, height: 44,
    bottom: '22%', left: '18%',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.25)',
    animation: 'float3 4.5s ease-in-out infinite',
  },
  shape4: {
    width: 110, height: 110,
    bottom: '10%', right: '10%',
    transform: 'rotate(15deg)',
    animation: 'float1 7s ease-in-out infinite 1s',
  },
  shape5: {
    width: 30, height: 30,
    top: '60%', left: '8%',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    border: 'none',
    animation: 'float2 3.5s ease-in-out infinite',
  },

  ringWrap: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  ring: {
    width: 420, height: 420,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.1)',
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'pulse-ring 3s ease-out infinite',
  },
  ring2: {
    width: 580, height: 580,
    animation: 'pulse-ring 3s ease-out infinite 1.5s',
  },

  leftContent: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    padding: '0 40px',
    animation: 'fadeInUp 0.6s ease both',
  },
  logo: {
    width: 100, height: 100,
    objectFit: 'contain',
    filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))',
    marginBottom: 8,
  },
  brand: {
    fontSize: 36,
    fontWeight: 800,
    color: '#fff',
    marginBottom: 6,
  },
  brandAi: {
    color: '#bfdbfe',
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 40,
    fontWeight: 400,
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    textAlign: 'left',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 12,
    padding: '12px 16px',
    animation: 'fadeInUp 0.5s ease both',
  },
  featureIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 500,
  },

  /* ── Sağ Panel ── */
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    overflowY: 'auto',
  },
};
