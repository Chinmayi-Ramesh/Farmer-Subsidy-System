import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';

const ShopDashboard = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerRequests, setFarmerRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/shop/login');
    }
  }, [navigate]);

  const handleSearchFarmer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSelectedFarmer(null);
    setFarmerRequests([]);
    setActiveTab('all');

    try {
      const farmersQuery = query(
        collection(db, 'farmers'),
        where('email', '==', searchEmail.trim())
      );
      
      const farmersSnapshot = await getDocs(farmersQuery);
      
      if (farmersSnapshot.empty) {
        alert('No farmer found with this email address');
        setLoading(false);
        return;
      }

      const farmerData = farmersSnapshot.docs[0].data();
      const farmerId = farmersSnapshot.docs[0].id;
      setSelectedFarmer({ id: farmerId, ...farmerData });

      setupRequestsListener(farmerId);
      setLoading(false);
    } catch (error) {
      console.error('Error searching farmer:', error);
      alert('Error searching for farmer. Please try again.');
      setLoading(false);
    }
  };

  const setupRequestsListener = (farmerId) => {
    if (window.requestsUnsubscribe) {
      window.requestsUnsubscribe();
    }

    const requestsQuery = query(
      collection(db, 'subsidy_requests'),
      where('farmerId', '==', farmerId)
    );
    
    window.requestsUnsubscribe = onSnapshot(requestsQuery, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFarmerRequests(requests);
    }, (error) => {
      console.error('Error fetching requests:', error);
    });
  };

  const handleLogout = async () => {
    if (window.requestsUnsubscribe) {
      window.requestsUnsubscribe();
    }
    
    try {
      await signOut(auth);
      navigate('/shop/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (window.requestsUnsubscribe) {
        window.requestsUnsubscribe();
      }
    };
  }, []);

  const getFilteredRequests = () => {
    if (activeTab === 'all') return farmerRequests;
    return farmerRequests.filter(r => r.status === activeTab);
  };

  const stats = {
    total: farmerRequests.length,
    pending: farmerRequests.filter(r => r.status === 'pending').length,
    approved: farmerRequests.filter(r => r.status === 'approved').length,
    rejected: farmerRequests.filter(r => r.status === 'rejected').length
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <span style={styles.navIcon}>🏪</span>
            <h1 style={styles.navTitle}>Government Officer Portal</h1>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.content}>
        {/* Search Section */}
        <div style={styles.searchSection}>
          <h2 style={styles.sectionTitle}>🔍 Search Farmer by Email</h2>
          <p style={styles.searchSubtitle}>
            Enter farmer's email to view their profile and subsidy requests
          </p>
          <form onSubmit={handleSearchFarmer} style={styles.searchForm}>
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter farmer email address"
              style={styles.searchInput}
              required
            />
            <button 
              type="submit" 
              style={loading ? {...styles.searchButton, ...styles.buttonDisabled} : styles.searchButton}
              disabled={loading}
            >
              {loading ? 'Searching...' : '🔍 Search Farmer'}
            </button>
          </form>
        </div>

        {selectedFarmer ? (
          <>
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

            {/* Farmer Profile */}
            <div style={styles.farmerProfile}>
              <h3 style={styles.profileTitle}>👨‍🌾 Farmer Profile</h3>
              <div style={styles.profileDetails}>
                <div style={styles.profileRow}>
                  <span style={styles.profileLabel}>Name:</span>
                  <span style={styles.profileValue}>{selectedFarmer.name}</span>
                </div>
                <div style={styles.profileRow}>
                  <span style={styles.profileLabel}>Email:</span>
                  <span style={styles.profileValue}>{selectedFarmer.email}</span>
                </div>
                <div style={styles.profileRow}>
                  <span style={styles.profileLabel}>Phone:</span>
                  <span style={styles.profileValue}>{selectedFarmer.phone}</span>
                </div>
                <div style={styles.profileRow}>
                  <span style={styles.profileLabel}>Address:</span>
                  <span style={styles.profileValue}>{selectedFarmer.address}</span>
                </div>
                <div style={styles.profileRow}>
                  <span style={styles.profileLabel}>Aadhar:</span>
                  <span style={styles.profileValue}>{selectedFarmer.aadhar}</span>
                </div>
                <div style={styles.profileRow}>
                  <span style={styles.profileLabel}>Land Size:</span>
                  <span style={styles.profileValue}>{selectedFarmer.landSize} acres</span>
                </div>
              </div>
            </div>

            {/* Requests Section */}
            <div style={styles.requestsSection}>
              <h3 style={styles.sectionTitle}>📋 Subsidy Requests</h3>
              
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
                    <div style={styles.emptyIcon}>📦</div>
                    <p style={styles.emptyText}>No requests found</p>
                  </div>
                ) : (
                  getFilteredRequests().map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={styles.emptySearch}>
            <div style={styles.emptySearchIcon}>🔍</div>
            <h3 style={styles.emptySearchTitle}>Search for a Farmer</h3>
            <p style={styles.emptySearchText}>
              Enter a farmer's email address above to view their profile and subsidy requests.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const RequestCard = ({ request }) => {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const generateToken = () => {
    const categories = request.categories ? request.categories.join('-') : 'SUBSIDY';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${categories}-${timestamp}-${random}`;
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const token = generateToken();
      await updateDoc(doc(db, 'subsidy_requests', request.id), {
        status: 'approved',
        token: token,
        processedAt: new Date().toISOString(),
        processedBy: auth.currentUser.email
      });
      
      setShowApproveModal(false);
      showNotification('✅ Request approved successfully! Token generated.');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await updateDoc(doc(db, 'subsidy_requests', request.id), {
        status: 'rejected',
        rejectionReason: rejectionReason,
        processedAt: new Date().toISOString(),
        processedBy: auth.currentUser.email
      });
      
      setShowRejectModal(false);
      setRejectionReason('');
      showNotification('Request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    } finally {
      setProcessing(false);
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
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: { bg: '#fff3cd', color: '#856404', icon: '⏳' },
      approved: { bg: '#d4edda', color: '#155724', icon: '✅' },
      rejected: { bg: '#f8d7da', color: '#721c24', icon: '❌' }
    };
    return styles[status] || styles.pending;
  };

  const statusInfo = getStatusStyle(request.status);

  return (
    <div style={styles.requestCard}>
      <div style={styles.requestHeader} onClick={() => setExpanded(!expanded)}>
        <div>
          <h4 style={styles.requestTitle}>
            Request #{request.id.substring(0, 8).toUpperCase()}
          </h4>
          <p style={styles.requestDate}>
            {new Date(request.createdAt).toLocaleString('en-IN')}
          </p>
          <div style={styles.categoriesBadges}>
            {request.categories && request.categories.map(cat => (
              <span key={cat} style={styles.categoryBadge}>{cat}</span>
            ))}
          </div>
          <p style={styles.requestSummary}>
            {request.items.length} items • {request.categories ? request.categories.length : 1} categories
          </p>
        </div>
        <div style={styles.headerRight}>
          <div style={{
            ...styles.statusBadge,
            backgroundColor: statusInfo.bg,
            color: statusInfo.color
          }}>
            {statusInfo.icon} {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </div>
          <button style={styles.expandBtn}>
            {expanded ? '▼ Hide' : '▶ View'}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Location Information */}
          {request.location && (
            <div style={styles.locationSection}>
              <h5 style={styles.sectionTitle}>📍 Farm Location</h5>
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
                <div style={styles.locationDetail}>
                  <strong>Captured:</strong> {new Date(request.location.timestamp).toLocaleString('en-IN')}
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
              <h5 style={styles.sectionTitle}>📷 Crop Verification Image</h5>
              <div style={styles.cropImageContainer}>
                <img 
                  src={request.cropImageUrl} 
                  alt="Crop" 
                  style={styles.cropImage}
                  onClick={() => setImageModalOpen(true)}
                />
                <div style={styles.cropImageHint}>Click to view full size</div>
              </div>
            </div>
          )}

          {/* Items Section */}
          <div style={styles.itemsSection}>
            <h5 style={styles.itemsTitle}>Items Requested:</h5>
            
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
                        <span style={styles.itemPrice}>
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
                    <span style={styles.itemPrice}>
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
              <span>Farmer Pays:</span>
              <span>₹{request.finalAmount.toLocaleString()}</span>
            </div>
          </div>

          {request.status === 'pending' && (
            <div style={styles.actions}>
              <button onClick={() => setShowRejectModal(true)} style={styles.rejectButton}>
                ❌ Reject
              </button>
              <button onClick={() => setShowApproveModal(true)} style={styles.approveButton}>
                ✅ Approve & Generate Token
              </button>
            </div>
          )}

          {request.status === 'approved' && request.token && (
            <div style={styles.tokenBox}>
              <strong>Token Generated:</strong>
              <div style={styles.tokenValue}>{request.token}</div>
            </div>
          )}

          {request.status === 'rejected' && request.rejectionReason && (
            <div style={styles.rejectionBox}>
              <strong>Rejection Reason:</strong> {request.rejectionReason}
            </div>
          )}
        </>
      )}

      {/* Image Modal */}
      {imageModalOpen && (
        <div style={styles.imageModal} onClick={() => setImageModalOpen(false)}>
          <div style={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setImageModalOpen(false)} style={styles.closeImageButton}>
              ✕
            </button>
            <img src={request.cropImageUrl} alt="Crop Full Size" style={styles.fullImage} />
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div style={styles.modal} onClick={() => setShowApproveModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Approve Subsidy Request</h3>
            <p style={styles.modalText}>
              Are you sure you want to approve this subsidy request? A unique token will be generated for the farmer.
            </p>
            <div style={styles.modalInfo}>
              <div><strong>Categories:</strong> {request.categories ? request.categories.join(', ') : 'N/A'}</div>
              <div><strong>Items:</strong> {request.items.length}</div>
              <div><strong>Total Amount:</strong> ₹{request.totalAmount.toLocaleString()}</div>
              {request.location && <div><strong>Location:</strong> ✓ Verified</div>}
              {request.cropImageUrl && <div><strong>Crop Image:</strong> ✓ Uploaded</div>}
            </div>
            <div style={styles.modalButtons}>
              <button onClick={() => setShowApproveModal(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button 
                onClick={handleApprove} 
                style={processing ? {...styles.confirmButton, ...styles.buttonDisabled} : styles.confirmButton}
                disabled={processing}
              >
                {processing ? 'Processing...' : '✅ Approve & Generate Token'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={styles.modal} onClick={() => setShowRejectModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Reject Subsidy Request</h3>
            <p style={styles.modalText}>
              Please provide a reason for rejection:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={styles.textarea}
              placeholder="Enter rejection reason..."
              rows="4"
            />
            <div style={styles.modalButtons}>
              <button onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }} style={styles.cancelButton}>
                Cancel
              </button>
              <button 
                onClick={handleReject} 
                style={processing ? {...styles.rejectButtonModal, ...styles.buttonDisabled} : styles.rejectButtonModal}
                disabled={processing}
              >
                {processing ? 'Processing...' : '❌ Reject Request'}
              </button>
            </div>
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
  navbar: {
    backgroundColor: '#3498db',
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
    backgroundColor: '#e74c3c',
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
  searchSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '12px'
  },
  searchSubtitle: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '20px'
  },
  searchForm: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: '250px',
    padding: '14px 20px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none'
  },
  searchButton: {
    padding: '14px 30px',
    backgroundColor: '#3498db',
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
    color: '#3498db'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666'
  },
  farmerProfile: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  profileTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0'
  },
  profileDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  profileRow: {
    display: 'flex',
    gap: '10px'
  },
  profileLabel: {
    fontWeight: '600',
    color: '#666',
    minWidth: '100px'
  },
  profileValue: {
    color: '#333'
  },
  requestsSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '25px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#666'
  },
  activeTab: {
    backgroundColor: '#3498db',
    color: 'white'
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  emptyState: {
    padding: '60px',
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
  emptySearch: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '60px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  emptySearchIcon: {
    fontSize: '80px',
    marginBottom: '20px'
  },
  emptySearchTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '10px'
  },
  emptySearchText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6'
  },
  requestCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb'
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    paddingBottom: '15px',
    borderBottom: '2px solid #e5e7eb'
  },
  requestTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 5px 0'
  },
  requestDate: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 10px 0'
  },
  categoriesBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '8px'
  },
  categoryBadge: {
    padding: '4px 10px',
    backgroundColor: '#e8f4fd',
    color: '#3498db',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  requestSummary: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  expandBtn: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  locationSection: {
    marginTop: '20px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  locationInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginTop: '10px'
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
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  cropImageContainer: {
    marginTop: '10px',
    textAlign: 'center'
  },
  cropImage: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '2px solid #3498db'
  },
  cropImageHint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px'
  },
  itemsSection: {
    marginTop: '20px',
    marginBottom: '20px'
  },
  itemsTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '15px'
  },
  categoryGroup: {
    marginBottom: '15px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  categoryGroupHeader: {
    padding: '10px 15px',
    backgroundColor: '#f9fafb',
    fontSize: '14px',
    fontWeight: '600',
    color: '#3498db',
    borderBottom: '1px solid #e5e7eb'
  },
  itemsList: {
    padding: '8px'
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    marginBottom: '6px',
    backgroundColor: 'white',
    borderRadius: '6px',
    alignItems: 'center'
  },
  itemLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  itemDetails: {
    fontSize: '12px',
    color: '#666'
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#3498db'
  },
  amounts: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#666'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '10px',
    marginTop: '10px',
    borderTop: '2px solid #e0e0e0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#3498db'
  },
  actions: {
    display: 'flex',
    gap: '15px'
  },
  rejectButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  approveButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tokenBox: {
    padding: '15px',
    backgroundColor: '#d4edda',
    borderRadius: '8px',
    color: '#155724'
  },
  tokenValue: {
    marginTop: '8px',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '1px'
  },
  rejectionBox: {
    padding: '15px',
    backgroundColor: '#f8d7da',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#721c24'
  },
  imageModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '20px'
  },
  imageModalContent: {
    position: 'relative',
    maxWidth: '90%',
    maxHeight: '90%'
  },
  closeImageButton: {
    position: 'absolute',
    top: '-40px',
    right: '0',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'white',
    color: '#333',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullImage: {
    maxWidth: '100%',
    maxHeight: '85vh',
    borderRadius: '8px'
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
    maxWidth: '500px'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '15px'
  },
  modalText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '20px'
  },
  modalInfo: {
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    lineHeight: '1.8'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
    marginBottom: '20px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  modalButtons: {
    display: 'flex',
    gap: '15px'
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
  confirmButton: {
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
  rejectButtonModal: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default ShopDashboard;