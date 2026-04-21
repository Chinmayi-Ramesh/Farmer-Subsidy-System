import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const FarmerTokens = () => {
  const [farmer, setFarmer] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const farmerData = sessionStorage.getItem('farmerData');
    if (!farmerData) {
      navigate('/farmer/login');
      return;
    }
    const parsedFarmer = JSON.parse(farmerData);
    setFarmer(parsedFarmer);

    // Real-time listener for approved requests with tokens
    const q = query(
      collection(db, 'subsidy_requests'),
      where('farmerId', '==', parsedFarmer.id),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tokensData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(req => req.token);
      setTokens(tokensData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tokens:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/farmer/login');
  };

  const handlePrint = (token) => {
    const printWindow = window.open('', '_blank');
    
    // Prepare items display
    let itemsHTML = '';
    if (token.categorizedItems) {
      token.categorizedItems.forEach(group => {
        itemsHTML += `
          <div style="margin-bottom: 12px;">
            <div style="background: #e8f8f5; padding: 6px 10px; border-radius: 4px; font-weight: bold; color: #27ae60; margin-bottom: 6px; font-size: 13px;">
              ${group.category}
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="text-align: left; padding: 5px; border: 1px solid #e5e7eb;">Item</th>
                  <th style="text-align: center; padding: 5px; border: 1px solid #e5e7eb;">Quantity</th>
                  <th style="text-align: right; padding: 5px; border: 1px solid #e5e7eb;">Price</th>
                  <th style="text-align: right; padding: 5px; border: 1px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${group.items.map(item => `
                  <tr>
                    <td style="padding: 4px; border: 1px solid #e5e7eb;">${item.name}</td>
                    <td style="text-align: center; padding: 4px; border: 1px solid #e5e7eb;">${item.quantity} ${item.unit}</td>
                    <td style="text-align: right; padding: 4px; border: 1px solid #e5e7eb;">₹${item.price}</td>
                    <td style="text-align: right; padding: 4px; border: 1px solid #e5e7eb; font-weight: bold;">₹${(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      });
    } else {
      itemsHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="text-align: left; padding: 5px; border: 1px solid #e5e7eb;">Item</th>
              <th style="text-align: center; padding: 5px; border: 1px solid #e5e7eb;">Quantity</th>
              <th style="text-align: right; padding: 5px; border: 1px solid #e5e7eb;">Price</th>
              <th style="text-align: right; padding: 5px; border: 1px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${token.items.map(item => `
              <tr>
                <td style="padding: 4px; border: 1px solid #e5e7eb;">${item.name}</td>
                <td style="text-align: center; padding: 4px; border: 1px solid #e5e7eb;">${item.quantity} ${item.unit}</td>
                <td style="text-align: right; padding: 4px; border: 1px solid #e5e7eb;">₹${item.price}</td>
                <td style="text-align: right; padding: 4px; border: 1px solid #e5e7eb; font-weight: bold;">₹${(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const categoriesHTML = token.categories ? `
      <div style="margin: 10px 0;">
        <strong style="color: #666; font-size: 12px;">Categories:</strong>
        ${token.categories.map(cat => `
          <span style="display: inline-block; background: #e8f8f5; color: #27ae60; padding: 3px 10px; border-radius: 10px; font-size: 11px; margin: 3px; font-weight: 600;">
            ${cat}
          </span>
        `).join('')}
      </div>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Subsidy Token - ${token.token}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 0;
              margin: 0;
              font-size: 12px;
              line-height: 1.4;
            }
            .container {
              max-width: 100%;
              padding: 15px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 15px; 
              border-bottom: 3px solid #27ae60;
              padding-bottom: 12px;
            }
            .header h1 { 
              color: #27ae60; 
              margin: 0 0 3px 0;
              font-size: 22px;
            }
            .header h2 { 
              color: #666; 
              margin: 0;
              font-size: 16px;
              font-weight: normal;
            }
            .token-box { 
              border: 3px solid #27ae60; 
              padding: 12px; 
              margin: 15px 0;
              background: #f0fdf4;
              border-radius: 6px;
            }
            .token-label {
              font-size: 11px;
              color: #666;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .token { 
              font-size: 20px; 
              font-weight: bold; 
              text-align: center; 
              color: #27ae60;
              letter-spacing: 2px;
              font-family: 'Courier New', monospace;
            }
            .details { 
              margin: 15px 0;
              background: #f9fafb;
              padding: 12px;
              border-radius: 6px;
            }
            .detail-row { 
              margin: 6px 0;
              display: flex;
              padding: 4px 0;
              border-bottom: 1px solid #e5e7eb;
              font-size: 11px;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #666;
              min-width: 120px;
            }
            .detail-value {
              color: #333;
              flex: 1;
            }
            .items-section {
              margin: 15px 0;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
              padding-bottom: 6px;
              border-bottom: 2px solid #27ae60;
            }
            .summary-box {
              background: #f9fafb;
              padding: 12px;
              border-radius: 6px;
              margin: 15px 0;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin: 6px 0;
              font-size: 12px;
            }
            .summary-total {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #27ae60;
              font-size: 16px;
              font-weight: bold;
              color: #27ae60;
            }
            .instructions {
              background: #fff3cd;
              border: 2px solid #ffc107;
              padding: 10px;
              border-radius: 6px;
              margin: 15px 0;
            }
            .instructions h3 {
              margin: 0 0 8px 0;
              color: #856404;
              font-size: 13px;
            }
            .instructions p {
              margin: 3px 0;
              color: #856404;
              font-size: 10px;
              line-height: 1.5;
            }
            .footer {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px solid #e5e7eb;
              font-size: 9px;
              color: #666;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏛️ Government of India</h1>
              <h2>Farmer Subsidy Program - Official Token</h2>
            </div>
            
            <div class="token-box">
              <div class="token-label">Authorization Token</div>
              <div class="token">${token.token}</div>
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Farmer Name:</span>
                <span class="detail-value">${token.farmerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${token.farmerEmail}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Request ID:</span>
                <span class="detail-value">#${token.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Approved On:</span>
                <span class="detail-value">${new Date(token.processedAt).toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Approved By:</span>
                <span class="detail-value">${token.processedBy}</span>
              </div>
            </div>

            ${categoriesHTML}

            <div class="items-section">
              <div class="section-title">📦 Authorized Items</div>
              ${itemsHTML}
            </div>

            <div class="summary-box">
              <div class="summary-row">
                <span>Total Amount:</span>
                <span>₹${token.totalAmount.toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>government officer logindy (35%):</span>
                <span style="color: #10b981;">-₹${token.subsidyAmount.toLocaleString()}</span>
              </div>
              <div class="summary-total">
                <span>Amount to Pay:</span>
                <span>₹${token.finalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div class="instructions">
              <h3>📋 Instructions for Collection</h3>
              <p><strong>1.</strong> Present this token at any authorized government shop</p>
              <p><strong>2.</strong> Carry your Aadhar card and farmer identification</p>
              <p><strong>3.</strong> Pay the amount shown above (after subsidy)</p>
              <p><strong>4.</strong> Collect your subsidized items</p>
              <p><strong>5.</strong> This token is valid for 30 days from approval date</p>
            </div>

            <div class="footer">
              <p><strong>Important Notes:</strong> This is an official government document. Token must be presented for item collection. Items must be collected within 30 days of approval. For queries, contact your local government agricultural office. This token is non-transferable.</p>
              <br/>
              <p><strong>Printed on:</strong> ${new Date().toLocaleString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p style="text-align: center; margin-top: 8px;">
                © ${new Date().getFullYear()} Government of India. All rights reserved. | This is a computer-generated document.
              </p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return <div style={styles.loading}>Loading tokens...</div>;
  }

  if (!farmer) {
    return <div style={styles.loading}>Please login first</div>;
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <span style={styles.navIcon}>🎫</span>
            <h1 style={styles.navTitle}>My Tokens</h1>
          </div>
          <div style={styles.navButtons}>
            <button onClick={() => navigate('/farmer/dashboard')} style={styles.navButton}>
              New Request
            </button>
            <button onClick={() => navigate('/farmer/requests')} style={styles.navButton}>
              My Requests
            </button>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.header}>
          <h2 style={styles.pageTitle}>Approved Subsidy Tokens</h2>
          <p style={styles.pageSubtitle}>
            Present these tokens at government shops to collect your subsidized items
          </p>
        </div>

        {tokens.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎫</div>
            <h3 style={styles.emptyTitle}>No Tokens Yet</h3>
            <p style={styles.emptyText}>
              You don't have any approved tokens. Submit subsidy requests to receive tokens.
            </p>
            <button onClick={() => navigate('/farmer/dashboard')} style={styles.createButton}>
              Create New Request
            </button>
          </div>
        ) : (
          <div style={styles.tokensGrid}>
            {tokens.map(token => (
              <div key={token.id} style={styles.tokenCard}>
                <div style={styles.tokenHeader}>
                  <div style={styles.tokenBadge}>
                    ✅ Approved
                  </div>
                  <div style={styles.tokenNumber}>
                    {token.token}
                  </div>
                </div>

                {token.categories && (
                  <div style={styles.categoriesSection}>
                    <div style={styles.categoriesLabel}>Categories:</div>
                    <div style={styles.categoriesList}>
                      {token.categories.map(cat => (
                        <span key={cat} style={styles.categoryTag}>{cat}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.tokenDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Approved On:</span>
                    <span style={styles.value}>
                      {new Date(token.processedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Processed By:</span>
                    <span style={styles.value}>{token.processedBy}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Total Items:</span>
                    <span style={styles.value}>{token.items.length}</span>
                  </div>
                </div>

                <div style={styles.itemsSummarySection}>
                  <button 
                    onClick={() => setSelectedToken(selectedToken === token.id ? null : token.id)}
                    style={styles.viewItemsButton}
                  >
                    {selectedToken === token.id ? '▼ Hide Items' : '▶ View Items'}
                  </button>
                  
                  {selectedToken === token.id && (
                    <div style={styles.itemsDetail}>
                      {token.categorizedItems ? (
                        token.categorizedItems.map(group => (
                          <div key={group.category} style={styles.categoryItemGroup}>
                            <div style={styles.categoryItemHeader}>{group.category}</div>
                            {group.items.map((item, idx) => (
                              <div key={idx} style={styles.itemDetailRow}>
                                <span style={styles.itemDetailName}>{item.name}</span>
                                <span style={styles.itemDetailQty}>
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))
                      ) : (
                        token.items.map((item, idx) => (
                          <div key={idx} style={styles.itemDetailRow}>
                            <span style={styles.itemDetailName}>{item.name}</span>
                            <span style={styles.itemDetailQty}>
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div style={styles.amounts}>
                  <div style={styles.amountRow}>
                    <span>Total:</span>
                    <span>₹{token.totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={styles.amountRow}>
                    <span>Subsidy:</span>
                    <span style={{color: '#10b981'}}>-₹{token.subsidyAmount.toLocaleString()}</span>
                  </div>
                  <div style={styles.totalAmount}>
                    <span>You Pay:</span>
                    <span>₹{token.finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handlePrint(token)}
                  style={styles.printButton}
                >
                  🖨️ Print Token
                </button>

                <div style={styles.validityInfo}>
                  ⏰ Valid for 30 days from approval
                </div>
              </div>
            ))}
          </div>
        )}
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
  header: {
    marginBottom: '30px'
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 10px 0'
  },
  pageSubtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '60px 40px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '10px'
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px'
  },
  createButton: {
    padding: '15px 40px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tokensGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '25px'
  },
  tokenCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '2px solid #27ae60'
  },
  tokenHeader: {
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0'
  },
  tokenBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  tokenNumber: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#27ae60',
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#e8f8f5',
    borderRadius: '8px',
    letterSpacing: '1px',
    fontFamily: "'Courier New', monospace"
  },
  categoriesSection: {
    marginBottom: '15px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  categoriesLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '6px'
  },
  categoriesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  categoryTag: {
    padding: '4px 10px',
    backgroundColor: '#e8f8f5',
    color: '#27ae60',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  tokenDetails: {
    marginBottom: '20px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px'
  },
  label: {
    color: '#666',
    fontWeight: '600'
  },
  value: {
    color: '#333',
    fontWeight: '500',
    textAlign: 'right'
  },
  itemsSummarySection: {
    marginBottom: '20px'
  },
  viewItemsButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#666'
  },
  itemsDetail: {
    marginTop: '10px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  categoryItemGroup: {
    marginBottom: '15px'
  },
  categoryItemHeader: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#27ae60',
    marginBottom: '8px',
    paddingBottom: '5px',
    borderBottom: '1px solid #e8f8f5'
  },
  itemDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '13px',
    borderBottom: '1px solid #e5e7eb'
  },
  itemDetailName: {
    color: '#333',
    flex: 1
  },
  itemDetailQty: {
    color: '#666',
    fontWeight: '600'
  },
  amounts: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#666'
  },
  totalAmount: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '10px',
    marginTop: '10px',
    borderTop: '2px solid #e0e0e0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#27ae60'
  },
  printButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '15px'
  },
  validityInfo: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    fontWeight: '500'
  }
};

export default FarmerTokens;