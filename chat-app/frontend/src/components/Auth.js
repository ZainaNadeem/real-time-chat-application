import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:5001'

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const url = isLogin ? `${API}/auth/login` : `${API}/auth/register`
      const body = isLogin
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password }

      const res = await axios.post(url, body)
      onLogin(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💬 ChatApp</h1>
        <h2 style={styles.subtitle}>{isLogin ? 'Welcome back' : 'Create account'}</h2>

        {!isLogin && (
          <input
            style={styles.input}
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        )}
        <input
          style={styles.input}
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>

        <p style={styles.toggle}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span style={styles.link} onClick={() => { setIsLogin(!isLogin); setError('') }}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  card: { background: '#16213e', padding: '2rem', borderRadius: '12px', width: '360px', display: 'flex', flexDirection: 'column', gap: '12px' },
  title: { textAlign: 'center', fontSize: '2rem' },
  subtitle: { textAlign: 'center', color: '#aaa', fontWeight: 'normal', fontSize: '1rem' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: '1rem', outline: 'none' },
  button: { padding: '12px', borderRadius: '8px', border: 'none', background: '#e94560', color: '#fff', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' },
  error: { color: '#e94560', fontSize: '0.9rem', textAlign: 'center' },
  toggle: { textAlign: 'center', color: '#aaa', fontSize: '0.9rem' },
  link: { color: '#e94560', cursor: 'pointer' }
}

export default Auth