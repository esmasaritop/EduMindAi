import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../layouts/AuthLayout';

const TIMEZONES = [
  { value: 'Europe/Istanbul', label: 'İstanbul (UTC+3)' },
  { value: 'Europe/London', label: 'Londra (UTC+0/+1)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1/+2)' },
  { value: 'America/New_York', label: 'New York (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8/-7)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'UTC', label: 'UTC' },
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    timezone: 'Europe/Istanbul',
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors({});
    try {
      const { data } = await register(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      await login({ email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message ?? 'Kayıt başarısız. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fe = (name) =>
    errors[name] ? <span style={s.fieldError}>{errors[name][0]}</span> : null;

  return (
    <AuthLayout>
      <div style={s.card}>
        <div style={s.header}>
          <h2 style={s.title}>Hesap oluşturun</h2>
          <p style={s.subtitle}>Ücretsiz kayıt olun, hemen başlayın</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.field}>
            <label style={s.label}>Ad Soyad</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Adınız Soyadınız"
              required
              style={{ ...s.input, ...(errors.name ? s.inputError : {}) }}
            />
            {fe('name')}
          </div>

          <div style={s.field}>
            <label style={s.label}>E-posta</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ornek@email.com"
              required
              style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
            />
            {fe('email')}
          </div>

          <div style={s.row}>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label}>Şifre</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 karakter"
                required
                style={{ ...s.input, ...(errors.password ? s.inputError : {}) }}
              />
              {fe('password')}
            </div>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label}>Şifre Tekrar</label>
              <input
                type="password"
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={handleChange}
                placeholder="Tekrar girin"
                required
                style={{ ...s.input, ...(errors.password_confirmation ? s.inputError : {}) }}
              />
              {fe('password_confirmation')}
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Saat Dilimi</label>
            <select
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              style={s.input}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} style={s.button}>
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div style={s.footer}>
          Zaten hesabınız var mı?{' '}
          <Link to="/login" style={s.link}>Giriş yapın</Link>
        </div>
      </div>
    </AuthLayout>
  );
}

const s = {
  card: {
    background: '#ffffff',
    borderRadius: 20,
    padding: '36px 36px',
    width: '100%',
    maxWidth: 480,
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
    animation: 'fadeInUp 0.5s ease both',
  },
  header: {
    marginBottom: 24,
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
    gap: 16,
  },
  row: {
    display: 'flex',
    gap: 12,
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
    gap: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '10px 14px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    color: '#0f172a',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#fca5a5',
    background: '#fef2f2',
  },
  fieldError: {
    fontSize: 12,
    color: '#dc2626',
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
    marginTop: 20,
    fontSize: 14,
    color: '#94a3b8',
    paddingTop: 16,
    borderTop: '1px solid #f1f5f9',
  },
  link: {
    color: '#6366f1',
    fontWeight: 700,
    textDecoration: 'none',
  },
};
