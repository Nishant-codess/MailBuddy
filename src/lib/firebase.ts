
import {initializeApp, getApps, getApp} from 'firebase/app';
import {getAuth, GoogleAuthProvider} from 'firebase/auth';
import {getFirestore, doc, setDoc, serverTimestamp} from 'firebase/firestore';
import type {User} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Creates a user document in Firestore.
 * @param userAuth The user object from Firebase Authentication.
 */
export const createUserProfileDocument = async (userAuth: User) => {
  if (!userAuth) return;

  const userRef = doc(db, `users/${userAuth.uid}`);

  const {displayName, email, photoURL} = userAuth;
  const createdAt = serverTimestamp();

  try {
    await setDoc(
      userRef,
      {
        displayName,
        email,
        photoURL,
        createdAt,
        lastSeen: serverTimestamp(),
      },
      {merge: true}
    );
  } catch (error) {
    console.error('Error creating user document', error);
  }
};

export {app, auth, db, googleProvider};
