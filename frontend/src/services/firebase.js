import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';

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
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  await signInWithRedirect(auth, googleProvider);
  return { success: false, message: 'Redirecting...' };
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    return {
      success: true,
      user: {
        name: result.user.displayName,
        email: result.user.email,
        photo: result.user.photoURL,
      }
    };
  } catch (err) {
    console.error('Redirect result error:', err);
    return null;
  }
};

export const signOutGoogle = async () => {
  await auth.signOut();
};

export default app;