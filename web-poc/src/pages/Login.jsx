import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Login.css';

// Ensure the logo path is correct relative to public directory since it's in the root
const LOGO_PATH = '/hui-logo.png'; 

function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Connection tester state
  const [dbStatus, setDbStatus] = useState('loading');
  const [dbMessage, setDbMessage] = useState('Checking database connection...');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Memanggil API backend PHP untuk mengecek status database
    const testConnection = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth.php?action=test-db`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setDbStatus('success');
          setDbMessage(data.message);
        } else {
          setDbStatus('error');
          setDbMessage(data.message);
        }
      } catch (err) {
        setDbStatus('error');
        setDbMessage('❌ Backend API terputus. Pastikan konfigurasi VITE_API_URL benar.');
      }
    };
    
    testConnection();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if(data.status === 'success') {
            setDbStatus('success');
            setDbMessage(data.message);
            
            // Simpan Session Data
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            
            // Sync dengan App state
            if (setUser) setUser(data.user);
            
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } else {
            setDbStatus('error');
            setDbMessage(data.message);
        }
    } catch(err) {
        setDbStatus('error');
        setDbMessage('Gagal menghubungi backend PHP.');
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
            disabled={isLoading || dbStatus === 'error'}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Log In Securely'}
          </button>
        </form>

        <div className={`conn-status ${dbStatus}`}>
          {dbStatus === 'loading' && <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><Loader2 className="animate-spin" size={16} /> {dbMessage}</span>}
          {dbStatus === 'success' && <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><CheckCircle2 size={16} /> {dbMessage}</span>}
          {dbStatus === 'error' && <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><AlertCircle size={16} /> {dbMessage}</span>}
        </div>

      </div>
    </div>
  );
}

export default Login;
