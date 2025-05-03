// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCCGJHe6LAQ9p7Ux_M8_J5DRuGn_xrq1SE",
    authDomain: "book-app-5f8d7.firebaseapp.com",
    databaseURL: "https://book-app-5f8d7-default-rtdb.firebaseio.com",
    projectId: "book-app-5f8d7",
    storageBucket: "book-app-5f8d7.firebasestorage.app",
    messagingSenderId: "968655701923",
    appId: "1:968655701923:web:fad11481b56f323e6e7c16",
    measurementId: "G-XP9JR03PJT"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);