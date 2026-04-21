import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7tGPbSlB-UyRfGmfbDCYkJIfn6TWyYzc",
  authDomain: "enterprise-app-mgmt.firebaseapp.com",
  projectId: "enterprise-app-mgmt",
  storageBucket: "enterprise-app-mgmt.firebasestorage.app",
  messagingSenderId: "184126602948",
  appId: "1:184126602948:web:826cebf9f67b2e71641391"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
