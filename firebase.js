// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCuinWjjoyxUEl1js_D17D91NRF8SpsjUg",
  authDomain: "notebook-react-native.firebaseapp.com",
  projectId: "notebook-react-native",
  storageBucket: "notebook-react-native.appspot.com",
  messagingSenderId: "767986718679",
  appId: "1:767986718679:web:0ac9133e7d22f6fe3edd92",
  measurementId: "G-EYWQ2C1VR4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getFirestore(app)
export { app, database }