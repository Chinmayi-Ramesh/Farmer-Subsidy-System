import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
const FarmerLogin = () => {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const navigate = useNavigate();
const handleLogin = async (e) => {
e.preventDefault();
setError('');
setLoading(true);
try {
  // Check if farmer exists in Firestore
  const q = query(
    collection(db, 'farmers'),
    where('email', '==', email.trim()),
    where('password', '==', password)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    setError('Invalid email or password. Please contact admin if you need help.');
    setLoading(false);
    return;
  }

  const farmerData = querySnapshot.docs[0].data();
  const farmerId = querySnapshot.docs[0].id;
  
  if (farmerData.status !== 'active') {
    setError('Your account is inactive. Please contact admin.');
    setLoading(false);
    return;
  }

  // Store farmer data in sessionStorage
  sessionStorage.setItem('farmerId', farmerId);
  sessionStorage.setItem('farmerData', JSON.stringify({
    id: farmerId,
    ...farmerData
  }));
  
  navigate('/farmer/dashboard');
} catch (err) {
  console.error('Login error:', err);
  setError('Login failed. Please try again.');
} finally {
  setLoading(false);
}
};
return (
<div style={styles.container}>
<div style={styles.card}>
<div style={styles.header}>
<div style={styles.badge}>
<span style={styles.badgeIcon}>👨‍🌾</span>
</div>
<h1 style={styles.title}>Farmer Portal</h1>
<h2 style={styles.subtitle}>Government Subsidy System</h2>
</div>
    <form onSubmit={handleLogin} style={styles.form}>
      {error && <div style={styles.error}>{error}</div>}
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          placeholder="Enter your registered email"
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
        {loading ? 'Logging in...' : 'Login to Portal'}
      </button>

      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          ℹ️ Your account is created by the Admin Government. 
          If you don't have credentials, please contact your local government office.
        </p>
      </div>

      <div style={styles.links}>
        <Link to="/admin/login" style={styles.link}>
          ← Admin Login
        </Link>
        <Link to="/shop/login" style={styles.link}>
          government officer login →
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
background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
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
backgroundColor: '#27ae60',
borderRadius: '50%',
display: 'flex',
justifyContent: 'center',
alignItems: 'center',
margin: '0 auto 20px',
boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)'
},
badgeIcon: {
fontSize: '40px'
},
title: {
color: '#27ae60',
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
backgroundColor: '#27ae60',
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
backgroundColor: '#e8f8f5',
padding: '15px',
borderRadius: '8px',
marginTop: '20px',
border: '1px solid #a9dfbf'
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
color: '#27ae60',
textDecoration: 'none',
fontSize: '14px',
fontWeight: '500'
}
};
export default FarmerLogin;