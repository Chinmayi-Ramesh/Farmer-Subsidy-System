import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Enhanced subsidy categories with crops
const SUBSIDY_CATEGORIES = {
  Crops: {
    icon: '🌾',
    items: {
      'Rice': { price: 50, unit: 'kg' },
      'Wheat': { price: 45, unit: 'kg' },
      'Corn/Maize': { price: 60, unit: 'kg' },
      'Barley': { price: 55, unit: 'kg' },
      'Millet': { price: 65, unit: 'kg' },
      'Sorghum': { price: 58, unit: 'kg' },
      'Oats': { price: 70, unit: 'kg' },
      'Rye': { price: 62, unit: 'kg' },
      'Quinoa': { price: 180, unit: 'kg' },
      'Buckwheat': { price: 85, unit: 'kg' }
    }
  },
  Seeds: {
    icon: '🌱',
    items: {
      'Rice Seeds': { price: 50, unit: 'kg' },
      'Wheat Seeds': { price: 45, unit: 'kg' },
      'Cotton Seeds': { price: 200, unit: 'kg' },
      'Sugarcane': { price: 80, unit: 'bundle' },
      'Vegetable Seeds': { price: 100, unit: 'packet' },
      'Pulse Seeds': { price: 120, unit: 'kg' },
      'Maize Seeds': { price: 60, unit: 'kg' },
      'Soybean Seeds': { price: 90, unit: 'kg' },
      'Sunflower Seeds': { price: 180, unit: 'kg' },
      'Mustard Seeds': { price: 150, unit: 'kg' }
    }
  },
  Fertilizers: {
    icon: '💊',
    items: {
      'Urea': { price: 30, unit: 'kg' },
      'DAP (Di-Ammonium Phosphate)': { price: 45, unit: 'kg' },
      'NPK (Nitrogen-Phosphorus-Potassium)': { price: 35, unit: 'kg' },
      'Single Super Phosphate': { price: 25, unit: 'kg' },
      'Potash (MOP)': { price: 40, unit: 'kg' },
      'Zinc Sulphate': { price: 55, unit: 'kg' },
      'Organic Compost': { price: 20, unit: 'kg' },
      'Vermicompost': { price: 15, unit: 'kg' },
      'Bio-fertilizers': { price: 80, unit: 'kg' },
      'Liquid Fertilizer': { price: 120, unit: 'liter' }
    }
  },
  Pesticides: {
    icon: '🦟',
    items: {
      'General Insecticide': { price: 100, unit: 'liter' },
      'Fungicide': { price: 95, unit: 'liter' },
      'Herbicide': { price: 85, unit: 'liter' },
      'Bio-pesticide': { price: 110, unit: 'liter' },
      'Rodenticide': { price: 75, unit: 'kg' },
      'Nematicide': { price: 130, unit: 'liter' },
      'Acaricide': { price: 105, unit: 'liter' },
      'Molluscicide': { price: 90, unit: 'liter' }
    }
  },
  'Farm Equipment': {
    icon: '🚜',
    items: {
      'Sprayer (Manual)': { price: 1500, unit: 'piece' },
      'Sprayer (Motor)': { price: 5000, unit: 'piece' },
      'Drip Irrigation Kit': { price: 3000, unit: 'set' },
      'Sprinkler System': { price: 4500, unit: 'set' },
      'Wheelbarrow': { price: 800, unit: 'piece' },
      'Garden Tools Set': { price: 1200, unit: 'set' },
      'Water Pump': { price: 6000, unit: 'piece' },
      'Thresher (Small)': { price: 15000, unit: 'piece' },
      'Weeder': { price: 500, unit: 'piece' },
      'Cultivator': { price: 2500, unit: 'piece' }
    }
  },
  'Irrigation Supplies': {
    icon: '💧',
    items: {
      'PVC Pipes (4 inch)': { price: 80, unit: 'meter' },
      'PVC Pipes (6 inch)': { price: 120, unit: 'meter' },
      'Drip Tubes': { price: 15, unit: 'meter' },
      'Sprinkler Heads': { price: 50, unit: 'piece' },
      'Water Tank (500L)': { price: 3500, unit: 'piece' },
      'Water Tank (1000L)': { price: 6000, unit: 'piece' },
      'Hose Pipes': { price: 25, unit: 'meter' },
      'Fittings Set': { price: 200, unit: 'set' },
      'Valves': { price: 150, unit: 'piece' }
    }
  },
  'Animal Feed': {
    icon: '🐄',
    items: {
      'Cattle Feed': { price: 40, unit: 'kg' },
      'Poultry Feed': { price: 35, unit: 'kg' },
      'Mineral Mixture': { price: 60, unit: 'kg' },
      'Fodder Seeds': { price: 80, unit: 'kg' },
      'Fish Feed': { price: 55, unit: 'kg' },
      'Hay Bales': { price: 200, unit: 'bale' },
      'Silage': { price: 25, unit: 'kg' },
      'Vitamin Supplements': { price: 150, unit: 'kg' }
    }
  },
  'Soil Amendments': {
    icon: '🌍',
    items: {
      'Gypsum': { price: 18, unit: 'kg' },
      'Lime': { price: 15, unit: 'kg' },
      'Dolomite': { price: 20, unit: 'kg' },
      'Soil Conditioner': { price: 35, unit: 'kg' },
      'Peat Moss': { price: 45, unit: 'kg' },
      'Mulch': { price: 12, unit: 'kg' },
      'Rock Phosphate': { price: 28, unit: 'kg' }
    }
  },
  'Greenhouse Supplies': {
    icon: '🏠',
    items: {
      'Plastic Sheet (UV Stabilized)': { price: 150, unit: 'meter' },
      'Shade Net (50%)': { price: 80, unit: 'meter' },
      'Shade Net (75%)': { price: 100, unit: 'meter' },
      'Anti-bird Net': { price: 60, unit: 'meter' },
      'Grow Bags': { price: 10, unit: 'piece' },
      'Seed Trays': { price: 50, unit: 'piece' },
      'Nursery Pots': { price: 5, unit: 'piece' }
    }
  }
};

const FarmerDashboard = () => {
  const [farmer, setFarmer] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [cropImage, setCropImage] = useState(null);
  const [cropImagePreview, setCropImagePreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const farmerData = sessionStorage.getItem('farmerData');
    if (!farmerData) {
      navigate('/farmer/login');
      return;
    }
    setFarmer(JSON.parse(farmerData));
    
    // Get location on component mount
    getCurrentLocation();
  }, [navigate]);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        });
        setLocationLoading(false);
      },
      (error) => {
        let errorMsg = 'Unable to retrieve location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
          default:
            errorMsg = 'An unknown error occurred.';
        }
        setLocationError(errorMsg);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/farmer/login');
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
      setCart(cart.filter(item => item.category !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleCategoryExpand = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const addToCart = (category, itemName, item, quantity) => {
    if (quantity <= 0) return;
    
    const cartItemKey = `${category}-${itemName}`;
    const existingItem = cart.find(cartItem => cartItem.key === cartItemKey);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.key === cartItemKey 
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      ));
    } else {
      setCart([...cart, { 
        key: cartItemKey,
        category,
        name: itemName,
        price: item.price,
        unit: item.unit,
        quantity 
      }]);
    }
  };

  const removeFromCart = (itemKey) => {
    setCart(cart.filter(item => item.key !== itemKey));
  };

  const updateQuantity = (itemKey, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setCart(cart.map(item => 
      item.key === itemKey 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      
      setCropImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCropImage = async () => {
    if (!cropImage) return null;
    
    try {
      const timestamp = Date.now();
      const fileName = `crop_images/${farmer.id}_${timestamp}_${cropImage.name}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, cropImage);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload crop image');
    }
  };

  const handleSubmitRequest = async () => {
    if (selectedCategories.length === 0 || cart.length === 0) {
      alert('Please select at least one category and add items to cart');
      return;
    }

    // Check if Crops category is selected
    const hasCrops = selectedCategories.includes('Crops');
    
    if (hasCrops && !cropImage) {
      alert('Please upload a crop image for verification');
      return;
    }

    if (!location) {
      alert('Location is required. Please enable location access and try again.');
      getCurrentLocation();
      return;
    }

    setLoading(true);
    try {
      const totalAmount = calculateTotal();
      const subsidyAmount = Math.round(totalAmount * 0.4);
      const finalAmount = totalAmount - subsidyAmount;

      // Upload crop image if exists
      let cropImageUrl = null;
      if (cropImage) {
        cropImageUrl = await uploadCropImage();
      }

      // Group items by category
      const categorizedItems = selectedCategories.map(category => ({
        category,
        items: cart.filter(item => item.category === category)
      })).filter(group => group.items.length > 0);

      await addDoc(collection(db, 'subsidy_requests'), {
        farmerId: farmer.id,
        farmerEmail: farmer.email,
        farmerName: farmer.name,
        farmerPhone: farmer.phone,
        farmerAddress: farmer.address,
        categories: selectedCategories,
        items: cart.map(({ key, ...item }) => item),
        categorizedItems,
        totalAmount,
        subsidyAmount,
        finalAmount,
        cropImageUrl,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      alert('✅ Subsidy request submitted successfully!');
      setCart([]);
      setSelectedCategories([]);
      setCropImage(null);
      setCropImagePreview(null);
      navigate('/farmer/requests');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!farmer) {
    return <div style={styles.loading}>Loading...</div>;
  }

  const totalAmount = calculateTotal();
  const subsidyAmount = Math.round(totalAmount * 0.4);
  const finalAmount = totalAmount - subsidyAmount;
  const hasCrops = selectedCategories.includes('Crops');

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <span style={styles.navIcon}>👨‍🌾</span>
            <h1 style={styles.navTitle}>Farmer Portal</h1>
          </div>
          <div style={styles.navButtons}>
            <span style={styles.userName}>Welcome, {farmer.name}</span>
            <button onClick={() => navigate('/farmer/requests')} style={styles.navButton}>
              My Requests
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
        <div style={styles.mainSection}>
          <h2 style={styles.sectionTitle}>Create Subsidy Request</h2>
          
          {/* Location Status */}
          <div style={styles.locationSection}>
            <div style={styles.locationHeader}>
              <span style={styles.locationIcon}>📍</span>
              <span style={styles.locationTitle}>Location Status</span>
              <button onClick={getCurrentLocation} style={styles.refreshButton} disabled={locationLoading}>
                {locationLoading ? '⟳ Getting...' : '🔄 Refresh'}
              </button>
            </div>
            {location ? (
              <div style={styles.locationInfo}>
                <div style={styles.locationSuccess}>✓ Location captured successfully</div>
                <div style={styles.locationDetails}>
                  Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                  <br />
                  Accuracy: ±{Math.round(location.accuracy)}m
                </div>
              </div>
            ) : locationError ? (
              <div style={styles.locationError}>
                ⚠️ {locationError}
              </div>
            ) : (
              <div style={styles.locationPending}>Getting location...</div>
            )}
          </div>
          
          {/* Category Selection */}
          <div style={styles.categorySelection}>
            <h3 style={styles.subsectionTitle}>
              1. Select Subsidy Categories ({selectedCategories.length} selected)
            </h3>
            <div style={styles.categoriesGrid}>
              {Object.keys(SUBSIDY_CATEGORIES).map(category => (
                <div
                  key={category}
                  style={selectedCategories.includes(category) 
                    ? {...styles.categoryCard, ...styles.categoryCardSelected} 
                    : styles.categoryCard}
                  onClick={() => toggleCategory(category)}
                >
                  <div style={styles.categoryIcon}>{SUBSIDY_CATEGORIES[category].icon}</div>
                  <div style={styles.categoryName}>{category}</div>
                  <div style={styles.categoryCount}>
                    {Object.keys(SUBSIDY_CATEGORIES[category].items).length} items
                  </div>
                  {selectedCategories.includes(category) && (
                    <div style={styles.selectedBadge}>✓ Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Crop Image Upload (shown when Crops category is selected) */}
          {hasCrops && (
            <div style={styles.imageUploadSection}>
              <h3 style={styles.subsectionTitle}>2. Upload Crop Image *</h3>
              <p style={styles.imageUploadNote}>
                Please upload a clear image of your crop for verification (Required for Crops category)
              </p>
              <div style={styles.imageUploadArea}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={styles.fileInput}
                  id="cropImageInput"
                />
                <label htmlFor="cropImageInput" style={styles.fileInputLabel}>
                  {cropImagePreview ? (
                    <div style={styles.imagePreview}>
                      <img src={cropImagePreview} alt="Crop preview" style={styles.previewImage} />
                      <div style={styles.changeImageText}>Click to change image</div>
                    </div>
                  ) : (
                    <div style={styles.uploadPlaceholder}>
                      <div style={styles.uploadIcon}>📷</div>
                      <div style={styles.uploadText}>Click to upload crop image</div>
                      <div style={styles.uploadHint}>JPG, PNG or WEBP (Max 5MB)</div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Items Selection */}
          {selectedCategories.length > 0 && (
            <div style={styles.itemsSection}>
              <h3 style={styles.subsectionTitle}>
                {hasCrops ? '3' : '2'}. Select Items from Categories
              </h3>
              {selectedCategories.map(category => (
                <div key={category} style={styles.categoryItemsSection}>
                  <div 
                    style={styles.categoryHeader}
                    onClick={() => toggleCategoryExpand(category)}
                  >
                    <div style={styles.categoryHeaderLeft}>
                      <span style={styles.categoryHeaderIcon}>
                        {SUBSIDY_CATEGORIES[category].icon}
                      </span>
                      <span style={styles.categoryHeaderTitle}>{category}</span>
                      <span style={styles.categoryHeaderCount}>
                        ({Object.keys(SUBSIDY_CATEGORIES[category].items).length} items)
                      </span>
                    </div>
                    <span style={styles.expandIcon}>
                      {expandedCategory === category ? '▼' : '▶'}
                    </span>
                  </div>
                  
                  {expandedCategory === category && (
                    <div style={styles.itemsGrid}>
                      {Object.entries(SUBSIDY_CATEGORIES[category].items).map(([itemName, item]) => (
                        <ItemCard 
                          key={`${category}-${itemName}`}
                          category={category}
                          itemName={itemName}
                          item={item}
                          addToCart={addToCart}
                          inCart={cart.some(cartItem => cartItem.key === `${category}-${itemName}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div style={styles.cartSidebar}>
          <h3 style={styles.cartTitle}>Request Summary</h3>
          
          {selectedCategories.length > 0 && (
            <div style={styles.selectedCategories}>
              <strong>Categories: </strong>
              {selectedCategories.join(', ')}
            </div>
          )}

          {hasCrops && (
            <div style={styles.cropImageStatus}>
              {cropImage ? (
                <div style={styles.imageStatusSuccess}>✓ Crop image uploaded</div>
              ) : (
                <div style={styles.imageStatusPending}>⚠️ Crop image required</div>
              )}
            </div>
          )}

          {location && (
            <div style={styles.locationStatus}>
              ✓ Location verified
            </div>
          )}

          <div style={styles.cartItems}>
            {cart.length === 0 ? (
              <p style={styles.emptyCart}>No items added yet</p>
            ) : (
              <>
                {selectedCategories.map(category => {
                  const categoryItems = cart.filter(item => item.category === category);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category} style={styles.cartCategoryGroup}>
                      <div style={styles.cartCategoryTitle}>
                        {SUBSIDY_CATEGORIES[category].icon} {category}
                      </div>
                      {categoryItems.map(item => (
                        <div key={item.key} style={styles.cartItem}>
                          <div style={styles.cartItemLeft}>
                            <div style={styles.cartItemName}>{item.name}</div>
                            <div style={styles.cartItemDetails}>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.key, parseInt(e.target.value) || 0)}
                                style={styles.quantityInputSmall}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span> {item.unit} × ₹{item.price}</span>
                            </div>
                          </div>
                          <div style={styles.cartItemRight}>
                            <div style={styles.cartItemPrice}>₹{item.quantity * item.price}</div>
                            <button 
                              onClick={() => removeFromCart(item.key)}
                              style={styles.removeButton}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {cart.length > 0 && (
            <>
              <div style={styles.cartSummary}>
                <div style={styles.summaryRow}>
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span>government officer login(35%):</span>
                  <span style={{color: '#10b981'}}>-₹{subsidyAmount.toLocaleString()}</span>
                </div>
                <div style={styles.summaryTotal}>
                  <span>You Pay:</span>
                  <span>₹{finalAmount.toLocaleString()}</span>
                </div>
                <div style={styles.itemsCount}>
                  Total Items: {cart.length}
                </div>
              </div>

              <button 
                onClick={handleSubmitRequest} 
                style={loading || !location || (hasCrops && !cropImage) 
                  ? {...styles.submitButton, ...styles.buttonDisabled} 
                  : styles.submitButton}
                disabled={loading || !location || (hasCrops && !cropImage)}
              >
                {loading ? 'Submitting...' : '✓ Submit Request'}
              </button>
              
              {(hasCrops && !cropImage) && (
                <div style={styles.submitWarning}>
                  ⚠️ Please upload crop image
                </div>
              )}
              
              {!location && (
                <div style={styles.submitWarning}>
                  ⚠️ Location is required
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ItemCard = ({ category, itemName, item, addToCart, inCart }) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div style={inCart ? {...styles.itemCard, ...styles.itemCardInCart} : styles.itemCard}>
      <h4 style={styles.itemName}>{itemName}</h4>
      <p style={styles.itemPrice}>₹{item.price.toLocaleString()} / {item.unit}</p>
      <div style={styles.quantitySection}>
        <label style={styles.quantityLabel}>Quantity:</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          style={styles.quantityInput}
        />
        <span style={styles.unit}>{item.unit}</span>
      </div>
      <button 
        onClick={() => {
          addToCart(category, itemName, item, quantity);
          setQuantity(1);
        }}
        style={styles.addButton}
      >
        {inCart ? '✓ Add More' : '+ Add to Request'}
      </button>
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
    maxWidth: '1600px',
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
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500'
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
    maxWidth: '1600px',
    margin: '30px auto',
    padding: '0 20px',
    display: 'flex',
    gap: '30px'
  },
  mainSection: {
    flex: 1
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '30px'
  },
  locationSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  locationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px'
  },
  locationIcon: {
    fontSize: '24px'
  },
  locationTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#333',
    flex: 1
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  locationInfo: {
    padding: '15px',
    backgroundColor: '#d4edda',
    borderRadius: '8px'
  },
  locationSuccess: {
    color: '#155724',
    fontWeight: '600',
    marginBottom: '8px'
  },
  locationDetails: {
    fontSize: '13px',
    color: '#155724'
  },
  locationError: {
    padding: '15px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '8px',
    fontSize: '14px'
  },
  locationPending: {
    padding: '15px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '8px',
    fontSize: '14px'
  },
  categorySelection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  subsectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px'
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '15px'
  },
  categoryCard: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
    position: 'relative'
  },
  categoryCardSelected: {
    backgroundColor: '#d4edda',
    borderColor: '#27ae60',
    transform: 'scale(1.02)'
  },
  categoryIcon: {
    fontSize: '36px',
    marginBottom: '10px'
  },
  categoryName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '5px'
  },
  categoryCount: {
    fontSize: '12px',
    color: '#666'
  },
  selectedBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '4px 8px',
    backgroundColor: '#27ae60',
    color: 'white',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600'
  },
  imageUploadSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  imageUploadNote: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px'
  },
  imageUploadArea: {
    marginTop: '15px'
  },
  fileInput: {
    display: 'none'
  },
  fileInputLabel: {
    display: 'block',
    cursor: 'pointer'
  },
  uploadPlaceholder: {
    border: '2px dashed #27ae60',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    transition: 'all 0.3s'
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  uploadText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: '5px'
  },
  uploadHint: {
    fontSize: '13px',
    color: '#666'
  },
  imagePreview: {
    position: 'relative',
    border: '2px solid #27ae60',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  previewImage: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    display: 'block'
  },
  changeImageText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '10px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '600'
  },
  itemsSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  categoryItemsSection: {
    marginBottom: '25px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  categoryHeader: {
    padding: '15px 20px',
    backgroundColor: '#f9fafb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid #e5e7eb'
  },
  categoryHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  categoryHeaderIcon: {
    fontSize: '24px'
  },
  categoryHeaderTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  categoryHeaderCount: {
    fontSize: '14px',
    color: '#666'
  },
  expandIcon: {
    fontSize: '14px',
    color: '#666'
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '15px',
    padding: '20px'
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '15px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s'
  },
  itemCardInCart: {
    borderColor: '#27ae60',
    backgroundColor: '#f0fdf4'
  },
  itemName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
    lineHeight: '1.3'
  },
  itemPrice: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#27ae60',
    marginBottom: '12px'
  },
  quantitySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  quantityLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#666'
  },
  quantityInput: {
    width: '60px',
    padding: '6px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px'
  },
  quantityInputSmall: {
    width: '50px',
    padding: '4px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '13px'
  },
  unit: {
    fontSize: '13px',
    color: '#666'
  },
  addButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cartSidebar: {
    width: '400px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    height: 'fit-content',
    position: 'sticky',
    top: '20px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto'
  },
  cartTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0'
  },
  selectedCategories: {
    padding: '10px',
    backgroundColor: '#e8f8f5',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '13px',
    color: '#27ae60',
    lineHeight: '1.5'
  },
  cropImageStatus: {
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '13px',
    fontWeight: '600'
  },
  imageStatusSuccess: {
    color: '#155724',
    backgroundColor: '#d4edda',
    padding: '10px',
    borderRadius: '6px'
  },
  imageStatusPending: {
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: '10px',
    borderRadius: '6px'
  },
  locationStatus: {
    padding: '10px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '13px',
    fontWeight: '600'
  },
  cartItems: {
    maxHeight: '400px',
    overflowY: 'auto',
    marginBottom: '20px'
  },
  emptyCart: {
    textAlign: 'center',
    color: '#999',
    padding: '30px 0',
    fontSize: '14px'
  },
  cartCategoryGroup: {
    marginBottom: '20px'
  },
  cartCategoryTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#27ae60',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e8f8f5'
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  cartItemLeft: {
    flex: 1
  },
  cartItemName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px'
  },
  cartItemDetails: {
    fontSize: '12px',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  cartItemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '5px'
  },
  cartItemPrice: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#27ae60'
  },
  removeButton: {
    padding: '2px 6px',
    backgroundColor: '#ff4757',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer'
  },
  cartSummary: {
    paddingTop: '15px',
    borderTop: '2px solid #f0f0f0',
    marginBottom: '20px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#666'
  },
  summaryTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '15px',
    marginTop: '10px',
    borderTop: '2px solid #f0f0f0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#27ae60'
  },
  itemsCount: {
    marginTop: '10px',
    fontSize: '13px',
    color: '#666',
    textAlign: 'center'
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    cursor: 'not-allowed'
  },
  submitWarning: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '6px',
    fontSize: '13px',
    textAlign: 'center',
    fontWeight: '600'
  }
};

export default FarmerDashboard;