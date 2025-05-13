// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCu7Gl8pPH_ZmluyAqXsq09pvTF-OV3esU",
    authDomain: "book-app-ec10b.firebaseapp.com",
    projectId: "book-app-ec10b",
    storageBucket: "book-app-ec10b.firebasestorage.app",
    messagingSenderId: "121742840482",
    appId: "1:121742840482:web:2b508bebe70c1a149bbdfb",
    measurementId: "G-J1JMYS8HKK"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);