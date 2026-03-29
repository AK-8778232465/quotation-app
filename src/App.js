import { useEffect, useMemo, useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';

const SESSION_KEY = 'quotation_app_auth_session';
const SESSION_DURATION_MS = 60 * 60 * 1000;
const STATIC_PASSWORD = 'IamAK@123';

function App() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);

  const expiresAtLabel = useMemo(() => {
    if (!expiresAt) {
      return '';
    }

    return new Date(expiresAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [expiresAt]);

  useEffect(() => {
    const checkSession = () => {
      const savedExpiry = Number(window.localStorage.getItem(SESSION_KEY));

      if (savedExpiry && savedExpiry > Date.now()) {
        setIsUnlocked(true);
        setExpiresAt(savedExpiry);
        return;
      }

      window.localStorage.removeItem(SESSION_KEY);
      setIsUnlocked(false);
      setExpiresAt(null);
    };

    checkSession();

    const intervalId = window.setInterval(checkSession, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleUnlock = (event) => {
    event.preventDefault();

    if (password !== STATIC_PASSWORD) {
      setError('Incorrect password. Please try again.');
      return;
    }

    const nextExpiry = Date.now() + SESSION_DURATION_MS;
    window.localStorage.setItem(SESSION_KEY, String(nextExpiry));
    setExpiresAt(nextExpiry);
    setPassword('');
    setError('');
    setIsUnlocked(true);
  };

  if (!isUnlocked) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <span className="auth-badge">Protected Access</span>
          <h1>Quotation App</h1>
          <p className="auth-copy">Enter the password to continue. Access stays active for 1 hour after login.</p>

          <form className="auth-form" onSubmit={handleUnlock}>
            <div className="field">
              <label htmlFor="app-password">Password</label>
              <input
                id="app-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoFocus
                required
              />
            </div>

            {error ? <p className="message message--error">{error}</p> : null}

            <button className="btn btn-primary auth-button" type="submit">
              Unlock
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <>
      <HomePage />
      {expiresAtLabel ? <div className="session-pill">Session active until {expiresAtLabel}</div> : null}
    </>
  );
}

export default App;
