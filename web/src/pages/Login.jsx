import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../layouts/AuthLayout';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Giriş başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={s.card}>
        <div style={s.header}>
          <h2 style={s.title}>Tekrar hoş geldiniz</h2>
          <p style={s.subtitle}>Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.field}>
            <label style={s.label}>E-posta</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ornek@email.com"
              required
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Şifre</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={s.input}
            />
          </div>

          <button type="submit" disabled={loading} style={s.button}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div style={s.footer}>
          Hesabınız yok mu?{' '}
          <Link to="/register" style={s.link}>Kayıt olun</Link>
        </div>
      </div>
    </AuthLayout>
  );
}

const s = {
  card: {
    background: '#ffffff',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
    animation: 'fadeInUp 0.5s ease both',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '12px 14px',
    color: '#dc2626',
    fontSize: 14,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '11px 14px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    color: '#0f172a',
    fontSize: 14,
    outline: 'none',
  },
  button: {
    padding: '13px',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
  },
  footer: {
    textAlign: 'center',
    marginTop: 22,
    fontSize: 14,
    color: '#94a3b8',
    paddingTop: 18,
    borderTop: '1px solid #f1f5f9',
  },
  link: {
    color: '#6366f1',
    fontWeight: 700,
    textDecoration: 'none',
  },
};
