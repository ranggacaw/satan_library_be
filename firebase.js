const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyAfTp6pUscL31kWnhk6Qdmk-haQIprxVCQ",
  authDomain: "satanlibrary.firebaseapp.com",
  projectId: "satanlibrary",
  storageBucket: "satanlibrary.firebasestorage.app",
  messagingSenderId: "850665970268",
  appId: "1:850665970268:web:55e779198b5f181a41a499",
  measurementId: "G-LSW43PZZQL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);