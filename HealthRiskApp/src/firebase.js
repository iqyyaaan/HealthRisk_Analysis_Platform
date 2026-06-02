import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyANglvdUTYoa2Q0vFOXgRwuXZNOTjlIWdU",
  authDomain: "health-risk-questionnaire.firebaseapp.com",
  projectId: "health-risk-questionnaire",
  storageBucket: "health-risk-questionnaire.firebasestorage.app",
  messagingSenderId: "250233180024",
  appId: "1:250233180024:web:4729c2914550abf938028d"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);