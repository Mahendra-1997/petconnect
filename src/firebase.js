import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAK52RZ2PZII1N31bsgsjBvMFa1eWl_WaI",

  authDomain: "pet-connect-5902e.firebaseapp.com",

  projectId: "pet-connect-5902e",

  storageBucket: "pet-connect-5902e.firebasestorage.app",

  messagingSenderId: "924567332209",

  appId: "1:924567332209:web:775a81b1ec307abc1f42d0",

  measurementId: "G-Q9Y5H9VEH9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
