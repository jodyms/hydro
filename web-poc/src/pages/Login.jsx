import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import './Login.css';

const LOGO_PATH = '/hui-logo.png'; 

function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if(data.status === 'success') {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));

            if (setUser) setUser(data.user);

            setTimeout(() => {
                navigate('/');
            }, 1000);
        } else {
            setLoginError(data.message);
        }
    } catch {
        setLoginError('Gagal menghubungi server. Silakan coba lagi.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass-card">
        
        <div className="login-logo">
          <img src={LOGO_PATH} alt="HUI Water Solution Logo" />
        </div>
        
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Login to Access Hydromart Sales Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              className="form-input" 
              placeholder="Enter your username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="form-input" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Log In Securely'}
          </button>

          {loginError && (
            <div className="conn-status error" style={{ marginTop: '12px' }}>
              <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <AlertCircle size={16} /> {loginError}
              </span>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}

export default Login;
