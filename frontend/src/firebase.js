import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAf_v4uu7OHQ8SA82PuCe8KBqkgm8UIqho",
  authDomain: "newspulse-22f0d.firebaseapp.com",
  projectId: "newspulse-22f0d",
  storageBucket: "newspulse-22f0d.firebasestorage.app",
  messagingSenderId: "980542561938",
  appId: "1:980542561938:web:27c780f9adf319d49bd04b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);