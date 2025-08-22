import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import config from "../config.json";

const firebaseConfig = {
    apiKey: config.apps.Firebase.apiKey,
    authDomain: config.apps.Firebase.authDomain,
    projectId: config.apps.Firebase.projectId,
    storageBucket: config.apps.Firebase.storageBucket,
    messagingSenderId: config.apps.Firebase.messagingSenderId,
    appId: config.apps.Firebase.appId,
    measurementId: config.apps.Firebase.measurementId
};

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app); 