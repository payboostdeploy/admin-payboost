import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyD1WrPiZAGZaIxgA69JQBU12-nvlxxEr0s",
  authDomain: "billing-app-6d5a2.firebaseapp.com",
  projectId: "billing-app-6d5a2",
  storageBucket: "billing-app-6d5a2.appspot.com",
  messagingSenderId: "316017112029",
  appId: "1:316017112029:web:b23514d135e5706402bc34",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
