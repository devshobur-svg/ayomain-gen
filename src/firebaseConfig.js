// 1. Kumpulkan semua IMPORT di baris paling atas
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; 

// 2. Deklarasikan VARIABEL CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCKvBVFiopsLoi90AdjnlQfVmS_v9vjLIA",
  authDomain: "coaching-tracker-1c930.firebaseapp.com",
  projectId: "coaching-tracker-1c930",
  storageBucket: "coaching-tracker-1c930.firebasestorage.app",
  messagingSenderId: "338337580688",
  appId: "1:338337580688:web:a980258bc15cb4072f3a15"
};

// 3. INISIALISASI aplikasi Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // 👈 Export Auth
export const googleProvider = new GoogleAuthProvider();