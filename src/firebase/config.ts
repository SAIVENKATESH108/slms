import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDFXDEmDULhWxAc4T55AG7gScvnb8EGxNQ",
  authDomain: "whiteangelbeautyparlour-e890e.firebaseapp.com",
  projectId: "whiteangelbeautyparlour-e890e",
  storageBucket: "whiteangelbeautyparlour-e890e.firebasestorage.app",
  messagingSenderId: "574160114929",
  appId: "1:574160114929:web:f49615faad06998ddec550",
  measurementId: "G-4V8KTKV5W8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);
const db = firestore;


export { app, auth, firestore, storage, analytics,db };
