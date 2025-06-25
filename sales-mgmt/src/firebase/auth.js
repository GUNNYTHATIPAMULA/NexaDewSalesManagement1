import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth"
import { auth } from "./firebase"
import { sendPasswordResetEmail } from "firebase/auth"

// Configure Google Auth Provider with proper settings
const googleProvider = new GoogleAuthProvider()
googleProvider.addScope("email")
googleProvider.addScope("profile")
googleProvider.setCustomParameters({
  prompt: "select_account",
})

export const doCreateUserWithEmailAndPassword = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password)
}

export const doSignInWithEmailAndPassword = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

// Detect if running in Electron
const isElectron = () => {
  return typeof window !== "undefined" && window.process && window.process.type === "renderer"
}

export const doSignInWithGoogle = async () => {
  try {
    // Check if we're in Electron environment
    if (isElectron() || window.location.protocol === "file:") {
      // Use redirect method for Electron
      await signInWithRedirect(auth, googleProvider)
      // The result will be handled by getRedirectResult in the main app
      return null
    } else {
      // Use popup method for web
      const result = await signInWithPopup(auth, googleProvider)
      return result
    }
  } catch (error) {
    console.error("Google sign-in error:", error)

    // Handle specific errors
    if (error.code === "auth/popup-blocked") {
      throw new Error("Popup was blocked. Please allow popups for this site.")
    } else if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled.")
    } else if (error.code === "auth/cancelled-popup-request") {
      throw new Error("Another sign-in popup is already open.")
    } else if (error.code === "auth/operation-not-supported-in-this-environment") {
      throw new Error("Google sign-in is not supported in this environment. Please use email/password sign-in.")
    }
    throw error
  }
}

// Function to handle redirect results (for Electron)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth)
    return result
  } catch (error) {
    console.error("Redirect result error:", error)
    throw error
  }
}

export const doSignOut = () => {
  return signOut(auth)
}
export const doPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return true
  } catch (error) {
    console.error("Password reset error:", error)
    throw error
  }
}