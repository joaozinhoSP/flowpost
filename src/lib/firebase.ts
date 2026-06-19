import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAPRFqVmrHSpvUtihKcLG8nSCIdkEImgoY",
  authDomain: "agenda-de-posts-e-videos.firebaseapp.com",
  projectId: "agenda-de-posts-e-videos",
  storageBucket: "agenda-de-posts-e-videos.firebasestorage.app",
  messagingSenderId: "210654926933",
  appId: "1:210654926933:web:6e517db5b93a88e0625cdc",
  measurementId: "G-NF5Q6WKEYR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
