import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAVBQqdd9xab6XI_BcUZf0HAAbaFTOfEo",
  authDomain: "book-finder-6216c.firebaseapp.com",
  projectId: "book-finder-6216c",
  storageBucket: "book-finder-6216c.firebasestorage.app",
  messagingSenderId: "1024236519044",
  appId: "1:1024236519044:web:55686cfb82d59c00f64cd1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc };
