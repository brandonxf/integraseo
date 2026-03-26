"use client"
import { create } from "zustand"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, googleProvider, db } from "./firebase"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt?: string
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  // actions
  init: () => () => void
  loginEmail: (email: string, password: string) => Promise<void>
  registerEmail: (email: string, password: string, name: string) => Promise<void>
  loginGoogle: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  init: () => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Cargar o crear perfil en Firestore
        const profileRef = doc(db, "users", user.uid)
        const snap = await getDoc(profileRef)
        if (!snap.exists()) {
          await setDoc(profileRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName ?? user.email?.split("@")[0],
            photoURL: user.photoURL ?? null,
            createdAt: serverTimestamp(),
          })
        }
        set({
          user,
          profile: {
            uid: user.uid,
            email: user.email ?? "",
            displayName: user.displayName ?? user.email?.split("@")[0] ?? "Usuario",
            photoURL: user.photoURL ?? undefined,
          },
          initialized: true,
        })
      } else {
        set({ user: null, profile: null, initialized: true })
      }
    })
    return unsub
  },

  loginEmail: async (email, password) => {
    set({ loading: true })
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } finally {
      set({ loading: false })
    }
  },

  registerEmail: async (email, password, name) => {
    set({ loading: true })
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName: name })
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        displayName: name,
        createdAt: serverTimestamp(),
      })
    } finally {
      set({ loading: false })
    }
  },

  loginGoogle: async () => {
    set({ loading: true })
    try {
      await signInWithPopup(auth, googleProvider)
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    await signOut(auth)
    set({ user: null, profile: null })
  },
}))
