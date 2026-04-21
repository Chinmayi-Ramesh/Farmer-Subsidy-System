import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate, Link } from 'react-router-dom';

const ShopLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check if it's a shop email
    if (!email.endsWith('@shop.gov.in')) {
      setError('Please use a valid government shop email address (@shop.gov.in)');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/shop/dashboard');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badge}>
            <span style={styles.badgeIcon}>🏪</span>
          </div>
          <h1 style={styles.title}>Government Officer Portal</h1>
          <h2 style={styles.subtitle}>Subsidy Management</h2>
        </div>
        
        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Shop Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="shop@shop.gov.in"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login to Government officer portal'}
          </button>

          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              🔒 This portal is for authorized government officer only. 
              Access is logged and monitored.
            </p>
          </div>

          <div style={styles.links}>
            <Link to="/admin/login" style={styles.link}>
              ← Admin Login
            </Link>
            <Link to="/farmer/login" style={styles.link}>
              Farmer Login →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    padding: '40px',
    width: '100%',
    maxWidth: '450px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  badge: {
    width: '80px',
    height: '80px',
    backgroundColor: '#3498db',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 20px',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
  },
  badgeIcon: {
    fontSize: '40px'
  },
  title: {
    color: '#3498db',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 10px 0'
  },
  subtitle: {
    color: '#666',
    fontSize: '18px',
    fontWeight: '500',
    margin: '0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#333',
    fontWeight: '600',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
    outline: 'none'
  },
  button: {
    padding: '14px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '10px'
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    cursor: 'not-allowed'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fcc'
  },
  infoBox: {
    backgroundColor: '#e8f4fd',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '20px',
    border: '1px solid #b3d9f5'
  },
  infoText: {
    fontSize: '13px',
    color: '#555',
    margin: 0,
    lineHeight: '1.5'
  },
  links: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px'
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default ShopLogin;