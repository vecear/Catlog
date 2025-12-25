import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
// keys are technically public in a client-side app
const firebaseConfig = {
    apiKey: "AIzaSyCm7KdUyGJLr7SnSqBP7R1NsJlvKPOzGXk",
    authDomain: "catlog-690c4.firebaseapp.com",
    projectId: "catlog-690c4",
    storageBucket: "catlog-690c4.firebasestorage.app",
    messagingSenderId: "461570867562",
    appId: "1:461570867562:web:20371503e0ae591a612513",
    measurementId: "G-KNC2L5N01M"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
