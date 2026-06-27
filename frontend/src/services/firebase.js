import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAgA5dPTJlDnqGMk7G08mFB7jFlMFXFnjE",
  authDomain: "suffoclix.firebaseapp.com",
  projectId: "suffoclix",
  storageBucket: "suffoclix.firebasestorage.app",
  messagingSenderId: "152983567475",
  appId: "1:152983567475:web:ae6e5674909d1bd77dfe06",
  measurementId: "G-71LJT2VWSV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const token = await user.getIdToken();
    return {
      success: true,
      token,
      user: {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
      }
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

// Google Sign Out
export const signOutGoogle = async () => {
  await signOut(auth);
};

export default app;