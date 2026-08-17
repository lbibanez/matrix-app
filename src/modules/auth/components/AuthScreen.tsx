import { useState } from 'react';
import { authService } from '../../../core/auth/authService';

export function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      setLoading(true);
      setError('');
      if (isSignUp) {
        await authService.signUp(email, password);
        alert('Signed up! You can now sign in.');
        setIsSignUp(false); // Switch to sign in mode
        setPassword('');
      } else {
        await authService.signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: 24,
      background: '#F8F8F5' // var(--color-background)
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255,255,255,0.78)',
        border: '1px solid rgba(23,23,23,.055)',
        borderRadius: 22,
        padding: '32px 24px',
        boxShadow: '0 7px 24px rgba(23,23,23,.06)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            background: '#1F5A37', 
            borderRadius: 14, 
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '-1px'
          }}>
            Mx
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 650, letterSpacing: '-0.035em', color: '#171717', margin: 0, marginBottom: 6 }}>
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            {isSignUp ? 'Sign up to start organizing your life.' : 'Sign in to access your tasks.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ 
            background: '#FDF2F2', 
            color: '#A95757', 
            padding: '12px 16px', 
            borderRadius: 12, 
            fontSize: 14, 
            fontWeight: 500,
            marginBottom: 24,
            border: '1px solid #F6E1E1'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#171717', marginLeft: 4 }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                background: '#fff',
                fontSize: 15,
                color: '#171717',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#1F5A37';
                e.target.style.boxShadow = '0 0 0 3px rgba(31, 90, 55, 0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#171717', marginLeft: 4 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                background: '#fff',
                fontSize: 15,
                color: '#171717',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#1F5A37';
                e.target.style.boxShadow = '0 0 0 3px rgba(31, 90, 55, 0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: loading || !email.trim() || !password.trim() ? '#9CA3AF' : '#1F5A37',
              color: '#fff',
              fontSize: 15,
              fontWeight: 650,
              transition: 'background 0.2s, transform 0.1s',
              cursor: loading || !email.trim() || !password.trim() ? 'not-allowed' : 'pointer'
            }}
            onMouseDown={e => {
              if (!loading && email.trim() && password.trim()) e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: 8,
              transition: 'color 0.2s, background 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#171717';
              e.currentTarget.style.background = 'rgba(23,23,23,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#6B7280';
              e.currentTarget.style.background = 'none';
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
