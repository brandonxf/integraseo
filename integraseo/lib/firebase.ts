import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyBqgJcGVg1L8tEcNpzGlUWt0txMgjYlvBM",
  authDomain: "integraseo-a2251.firebaseapp.com",
  projectId: "integraseo-a2251",
  storageBucket: "integraseo-a2251.appspot.com",
  messagingSenderId: "641850273091",
  appId: "1:641850273091:web:f4b84be073bda16c7213f6",
  measurementId: "G-0R5MCH0RRY",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Helper: ruta base de datos del usuario actual
export function userPath(uid: string) {
  return `users/${uid}`
}
