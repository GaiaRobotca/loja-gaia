// js/firebase-init.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ATENÇÃO: Terá de substituir as chaves abaixo pelas chaves reais do projeto 
// que criar na consola do Firebase (https://console.firebase.google.com/)
const firebaseConfig = {
  apiKey: "AIzaSyDCgXY-Ub7zSxfWvlZ9-a6Dwp0P8jFuELI",
  authDomain: "loja-gaia.firebaseapp.com",
  projectId: "loja-gaia",
  storageBucket: "loja-gaia.firebasestorage.app",
  messagingSenderId: "454074503857",
  appId: "1:454074503857:web:d4cd0a1d7141cf7593c890",
  measurementId: "G-6PXRRQY561"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Coloque aqui os e-mails das pessoas da UFTM que podem aceder ao painel admin
const ADMIN_EMAILS = [
  "seu-email@gmail.com", 
  "outro-membro@uftm.edu.br"
];

export {
  db, auth, storage, ADMIN_EMAILS,
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy,
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  ref, uploadBytes, getDownloadURL
};
