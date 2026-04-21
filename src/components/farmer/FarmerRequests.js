import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const FarmerRequests = () => {
  const [farmer, setFarmer] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedRequest, setExpandedRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const farmerData = sessionStorage.getItem('farmerData');
    if (!farmerData) {
      navigate('/farmer/login');
      return;
    }
    const parsedFarmer = JSON.parse(farmerData);
    setFarmer(parsedFarmer);

    // Real-time listener
    const q = query(
      collection(db, 'subsidy_requests'),
      where('farmerId', '==', parsedFarmer.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching requests:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/farmer/login');
  };

  const getFilteredRequests = () => {
    if (activeTab === 'all') return requests;
    return requests.filter(r => r.status === activeTab);
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: { bg: '#fff3cd', color: '#856404', icon: '⏳' },
      approved: { bg: '#d4edda', color: '#155724', icon: '✅' },
      rejected: { bg: '#f8d7da', color: '#721c24', icon: '❌' }
    };
    return styles[status] || styles.pending;
  };

  const toggleRequestExpand = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  if (loading) {
    return <div style={styles.loading}>Loading requests...</div>;
  }

  if (!farmer) {
    return <div style={styles.loading}>Please login first</div>;
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <span style={styles.navIcon}>👨‍🌾</span>
            <h1 style={styles.navTitle}>My Requests</h1>
          </div>
          <div style={styles.navButtons}>
            <button onClick={() => navigate('/farmer/dashboard')} style={styles.navButton}>
              New Request
            </button>
            <button onClick={() => navigate('/farmer/tokens')} style={styles.navButton}>
              My Tokens
            </button>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={styles.content}>
        {/* Statistics */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Total Requests</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div>
              <div style={styles.statValue}>{stats.pending}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div>
              <div style={styles.statValue}>{stats.approved}</div>
              <div style={styles.statLabel}>Approved</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>❌</div>
            <div>
              <div style={styles.statValue}>{stats.rejected}</div>
              <div style={styles.statLabel}>Rejected</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('all')}
            style={activeTab === 'all' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={activeTab === 'pending' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            style={activeTab === 'approved' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          >
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            style={activeTab === 'rejected' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        {/* Requests List */}
        <div style={styles.requestsList}>
          {getFilteredRequests().length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <p style={styles.emptyText}>No requests found</p>
            </div>
          ) : (
            getFilteredRequests().map(request => {
              const statusInfo = getStatusStyle(request.status);
              const isExpanded = expandedRequest === request.id;
              
              return (
                <div key={request.id} style={styles.requestCard}>
                  <div style={styles.requestHeader} onClick={() => toggleRequestExpand(request.id)}>
                    <div>
                      <h3 style={styles.requestTitle}>
                        Request #{request.id.substring(0, 8).toUpperCase()}
                      </h3>
                      <p style={styles.requestDate}>
                        {new Date(request.createdAt).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <div style={styles.categoriesBadges}>
                        {request.categories && request.categories.map(cat => (
                          <span key={cat} style={styles.categoryBadge}>{cat}</span>
                        ))}
                      </div>
                      <p style={styles.itemsSummary}>
                        {request.items.length} items • {request.categories ? request.categories.length : 1} categories
                      </p>
                    </div>
                    <div style={styles.requestHeaderRight}>
                      <div style={{
                        ...styles.statusBadge,
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color
                      }}>
                        {statusInfo.icon} {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </div>
                      <button style={styles.expandButton}>
                        {isExpanded ? '▼ Hide Details' : '▶ View Details'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      {/* Location Info */}
                      {request.location && (
                        <div style={styles.locationSection}>
                          <h4 style={styles.sectionTitle}>📍 Location</h4>
                          <div style={styles.locationInfo}>
                            <div style={styles.locationDetail}>
                              <strong>Latitude:</strong> {request.location.latitude.toFixed(6)}
                            </div>
                            <div style={styles.locationDetail}>
                              <strong>Longitude:</strong> {request.location.longitude.toFixed(6)}
                            </div>
                            <div style={styles.locationDetail}>
                              <strong>Accuracy:</strong> ±{Math.round(request.location.accuracy)}m
                            </div>
                            <a 
                              href={`https://www.google.com/maps?q=${request.location.latitude},${request.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.mapLink}
                            >
                              🗺️ View on Google Maps
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Crop Image */}
                      {request.cropImageUrl && (
                        <div style={styles.cropImageSection}>
                          <h4 style={styles.sectionTitle}>📷 Crop Image</h4>
                          <img 
                            src={request.cropImageUrl} 
                            alt="Crop" 
                            style={styles.cropImage}
                            onClick={() => window.open(request.cropImageUrl, '_blank')}
                          />
                        </div>
                      )}

                      <div style={styles.itemsSection}>
                        <h4 style={styles.sectionTitle}>Items Requested:</h4>
                        
                        {request.categorizedItems ? (
                          request.categorizedItems.map(group => (
                            <div key={group.category} style={styles.categoryGroup}>
                              <div style={styles.categoryGroupHeader}>{group.category}</div>
                              <div style={styles.itemsList}>
                                {group.items.map((item, idx) => (
                                  <div key={idx} style={styles.item}>
                                    <div style={styles.itemLeft}>
                                      <span style={styles.itemName}>{item.name}</span>
                                      <span style={styles.itemDetails}>
                                        {item.quantity} {item.unit} × ₹{item.price}
                                      </span>
                                    </div>
                                    <span style={styles.itemTotal}>
                                      ₹{(item.quantity * item.price).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={styles.itemsList}>
                            {request.items.map((item, idx) => (
                              <div key={idx} style={styles.item}>
                                <div style={styles.itemLeft}>
                                  <span style={styles.itemName}>{item.name}</span>
                                  <span style={styles.itemDetails}>
                                    {item.quantity} {item.unit} × ₹{item.price}
                                  </span>
                                </div>
                                <span style={styles.itemTotal}>
                                  ₹{(item.quantity * item.price).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={styles.amounts}>
                        <div style={styles.amountRow}>
                          <span>Total Amount:</span>
                          <span>₹{request.totalAmount.toLocaleString()}</span>
                        </div>
                        <div style={styles.amountRow}>
                          <span>Subsidy (40%):</span>
                          <span style={{color: '#10b981'}}>-₹{request.subsidyAmount.toLocaleString()}</span>
                        </div>
                        <div style={styles.totalRow}>
                          <span>You Pay:</span>
                          <span>₹{request.finalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {request.status === 'approved' && request.token && (
                        <div style={styles.tokenBox}>
                          <div style={styles.tokenLabel}>Token Generated:</div>
                          <div style={styles.tokenValue}>{request.token}</div>
                          <div style={styles.tokenNote}>
                            ✓ View this token in "My Tokens" section to print
                          </div>
                        </div>
                      )}

                      {request.status === 'rejected' && request.rejectionReason && (
                        <div style={styles.rejectionBox}>
                          <strong>Rejection Reason:</strong>
                          <div style={styles.rejectionReason}>{request.rejectionReason}</div>
                        </div>
                      )}

                      {request.processedAt && (
                        <div style={styles.processedInfo}>
                          Processed on {new Date(request.processedAt).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {request.processedBy && ` by ${request.processedBy}`}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
    color: '#666'
  },
  navbar: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '20px 0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px'
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
  navButtons: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  content: {
    maxWidth: '1200px',
    margin: '30px auto',
    padding: '0 20px'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  statIcon: {
    fontSize: '36px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#27ae60'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '25px',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#666'
  },
  activeTab: {
    backgroundColor: '#27ae60',
    color: 'white'
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '60px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  emptyText: {
    fontSize: '16px',
    color: '#666'
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: '20px',
    borderBottom: '2px solid #f0f0f0',
    cursor: 'pointer'
  },
  requestTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 8px 0'
  },
  requestDate: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 10px 0'
  },
  categoriesBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px'
  },
  categoryBadge: {
    padding: '4px 10px',
    backgroundColor: '#e8f8f5',
    color: '#27ae60',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  itemsSummary: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  requestHeaderRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  expandButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#666'
  },
  locationSection: {
    marginTop: '20px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '12px'
  },
  locationInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px'
  },
  locationDetail: {
    fontSize: '14px',
    color: '#666'
  },
  mapLink: {
    display: 'inline-block',
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600'
  },
  cropImageSection: {
    marginTop: '20px',
    marginBottom: '20px'
  },
  cropImage: {
    width: '100%',
    maxWidth: '500px',
    height: 'auto',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '2px solid #e5e7eb'
  },
  itemsSection: {
    marginTop: '20px',
    marginBottom: '20px'
  },
  categoryGroup: {
    marginBottom: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  categoryGroupHeader: {
    padding: '12px 15px',
    backgroundColor: '#f9fafb',
    fontSize: '15px',
    fontWeight: '600',
    color: '#27ae60',
    borderBottom: '1px solid #e5e7eb'
  },
  itemsList: {
    padding: '10px'
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    alignItems: 'center'
  },
  itemLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  itemDetails: {
    fontSize: '13px',
    color: '#666'
  },
  itemTotal: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#27ae60'
  },
  amounts: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '15px',
    color: '#666'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '15px',
    marginTop: '10px',
    borderTop: '2px solid #e0e0e0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#27ae60'
  },
  tokenBox: {
    padding: '20px',
    backgroundColor: '#d4edda',
    borderRadius: '8px',
    marginBottom: '15px',
    textAlign: 'center'
  },
  tokenLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#155724',
    marginBottom: '10px'
  },
  tokenValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#155724',
    letterSpacing: '2px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '6px',
    marginBottom: '10px'
  },
  tokenNote: {
    fontSize: '13px',
    color: '#155724'
  },
  rejectionBox: {
    padding: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  rejectionReason: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#721c24',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '6px'
  },
  processedInfo: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px'
  }
};

export default FarmerRequests;