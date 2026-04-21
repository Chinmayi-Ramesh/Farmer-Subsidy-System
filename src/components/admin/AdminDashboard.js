import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';

const AdminDashboard = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    aadhar: '',
    landSize: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/admin/login');
      return;
    }
    fetchFarmers();
  }, [navigate]);

  const fetchFarmers = async () => {
    try {
      const q = query(collection(db, 'farmers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const farmersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFarmers(farmersData);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddFarmer = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    // Validation
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      setFormLoading(false);
      return;
    }

    if (formData.aadhar.length !== 12) {
      setFormError('Aadhar number must be 12 digits');
      setFormLoading(false);
      return;
    }

    try {
      // Create farmer in Firestore
      await addDoc(collection(db, 'farmers'), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        aadhar: formData.aadhar,
        landSize: formData.landSize,
        password: formData.password, // Store password for farmer login
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.email,
        status: 'active'
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        aadhar: '',
        landSize: ''
      });
      
      setShowAddModal(false);
      fetchFarmers();
      
      showNotification('✅ Farmer added successfully!');
    } catch (error) {
      console.error('Error adding farmer:', error);
      if (error.code === 'permission-denied') {
        setFormError('This email is already registered');
      } else {
        setFormError('Failed to add farmer. Please try again.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFarmer = async (farmerId, farmerName) => {
    if (window.confirm(`Are you sure you want to delete farmer "${farmerName}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'farmers', farmerId));
        fetchFarmers();
        showNotification('✅ Farmer deleted successfully!');
      } catch (error) {
        console.error('Error deleting farmer:', error);
        alert('Failed to delete farmer. Please try again.');
      }
    }
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
      z-index: 10000;
      font-weight: 600;
      font-size: 16px;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <span style={styles.navIcon}>👨‍💼</span>
            <h1 style={styles.navTitle}>Admin Portal</h1>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>Farmer Management</h2>
            <p style={styles.pageSubtitle}>Create and manage farmer accounts</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={styles.addButton}>
            + Add New Farmer
          </button>
        </div>

        {/* Statistics Cards */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👨‍🌾</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{farmers.length}</div>
              <div style={styles.statLabel}>Total Farmers</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{farmers.filter(f => f.status === 'active').length}</div>
              <div style={styles.statLabel}>Active Farmers</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🌾</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>
                {farmers.reduce((sum, f) => sum + parseFloat(f.landSize || 0), 0).toFixed(2)}
              </div>
              <div style={styles.statLabel}>Total Land (Acres)</div>
            </div>
          </div>
        </div>

        {/* Farmers List */}
        <div style={styles.farmersSection}>
          <h3 style={styles.sectionTitle}>Registered Farmers</h3>
          
          {farmers.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👨‍🌾</div>
              <p style={styles.emptyText}>No farmers registered yet. Click "Add New Farmer" to get started.</p>
            </div>
          ) : (
            <div style={styles.farmersGrid}>
              {farmers.map(farmer => (
                <div key={farmer.id} style={styles.farmerCard}>
                  <div style={styles.farmerHeader}>
                    <div style={styles.farmerAvatar}>👨‍🌾</div>
                    <div style={styles.farmerInfo}>
                      <h4 style={styles.farmerName}>{farmer.name}</h4>
                      <p style={styles.farmerEmail}>{farmer.email}</p>
                    </div>
                  </div>
                  
                  <div style={styles.farmerDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>📱 Phone:</span>
                      <span style={styles.detailValue}>{farmer.phone}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>🏠 Address:</span>
                      <span style={styles.detailValue}>{farmer.address}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>🆔 Aadhar:</span>
                      <span style={styles.detailValue}>{farmer.aadhar}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>🌾 Land Size:</span>
                      <span style={styles.detailValue}>{farmer.landSize} acres</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>📅 Registered:</span>
                      <span style={styles.detailValue}>
                        {new Date(farmer.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteFarmer(farmer.id, farmer.name)}
                    style={styles.deleteButton}
                  >
                    🗑️ Delete Farmer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Farmer Modal */}
      {showAddModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Farmer</h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setFormError('');
                }} 
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFarmer} style={styles.modalForm}>
              {formError && <div style={styles.error}>{formError}</div>}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter farmer's full name"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="farmer@example.com"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password * (Min 6 characters)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter password"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter 10-digit phone number"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Aadhar Number * (12 digits)</label>
                <input
                  type="text"
                  name="aadhar"
                  value={formData.aadhar}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter 12-digit Aadhar number"
                  maxLength="12"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Land Size (in acres) *</label>
                <input
                  type="number"
                  name="landSize"
                  value={formData.landSize}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter land size"
                  step="0.01"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  style={{...styles.input, minHeight: '80px'}}
                  placeholder="Enter complete address"
                  required
                />
              </div>

              <div style={styles.modalButtons}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormError('');
                  }} 
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={formLoading ? {...styles.submitButton, ...styles.buttonDisabled} : styles.submitButton}
                  disabled={formLoading}
                >
                  {formLoading ? 'Creating...' : 'Create Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loading: {
    fontSize: '20px',
    color: '#666',
    fontWeight: '600'
  },
  navbar: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px 0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  navIcon: {
    fontSize: '32px'
  },
  navTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700'
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#ff4757',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '30px 20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 5px 0'
  },
  pageSubtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0
  },
  addButton: {
    padding: '14px 30px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  statIcon: {
    fontSize: '48px'
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500'
  },
  farmersSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '20px'
  },
  emptyState: {
    padding: '60px 40px',
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  emptyText: {
    fontSize: '16px',
    color: '#666'
  },
  farmersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  farmerCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb'
  },
  farmerHeader: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e5e7eb'
  },
  farmerAvatar: {
    width: '60px',
    height: '60px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '32px',
    flexShrink: 0
  },
  farmerInfo: {
    flex: 1
  },
  farmerName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 5px 0'
  },
  farmerEmail: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  farmerDetails: {
    marginBottom: '15px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px'
  },
  detailLabel: {
    color: '#666',
    fontWeight: '600'
  },
  detailValue: {
    color: '#333',
    fontWeight: '500',
    textAlign: 'right'
  },
  deleteButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#ff4757',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    margin: 0
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f0f0f0',
    color: '#666',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalForm: {
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
    boxSizing: 'border-box',
    outline: 'none'
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
  modalButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px'
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  submitButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    cursor: 'not-allowed'
  }
};

export default AdminDashboard;