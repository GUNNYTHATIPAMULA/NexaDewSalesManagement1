"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { doSignInWithEmailAndPassword, doSignInWithGoogle, handleRedirectResult, doPasswordReset } from "../../firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../firebase/firebase"
import { signOut } from "firebase/auth"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetStatus, setResetStatus] = useState(null) // 'success', 'error', null
  const [resetLoading, setResetLoading] = useState(false)
  const navigate = useNavigate()

  // Check for redirect result on component mount (for Electron)
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await handleRedirectResult()
        if (result && result.user) {
          console.log("Redirect sign-in successful:", result.user)
          // The auth state change will handle navigation
        }
      } catch (error) {
        console.error("Redirect result error:", error)
        setError("Google sign-in failed. Please try again.")
      }
    }

    checkRedirectResult()
  }, [])

  const handleEmailPasswordSignIn = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email || !password) {
      setError("Please fill in all fields.")
      setLoading(false)
      return
    }

    try {
      await doSignInWithEmailAndPassword(email, password)
      console.log("Email sign-in successful")
      // Navigation will be handled by App.jsx based on user role
    } catch (error) {
      console.error("Error signing in:", error.message)
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.")
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password.")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.")
      } else if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password.")
      } else {
        setError("Failed to sign in. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setGoogleLoading(true)
    try {
      const result = await doSignInWithGoogle()

      // If result is null, it means we're using redirect (Electron)
      if (result === null) {
        setGoogleLoading(false)
        return
      }

      const user = result.user

      // Check if user email exists in any user collection
      const collections = ["companyOwner", "marketingManager", "salesManager"]
      let found = false

      for (const collectionName of collections) {
        const userDoc = await getDoc(doc(db, collectionName, user.uid))
        if (userDoc.exists()) {
          found = true
          break
        }
      }

      if (!found) {
        await signOut(auth)
        setError("This Google account is not registered. Please register first or use a different account.")
        return
      }

      console.log("Google sign-in successful:", user)
      // Navigation will be handled by App.jsx based on user role
    } catch (error) {
      console.error("Error with Google sign-in:", error.message)
      setError(error.message || "Failed to sign in with Google. Please try again.")
    } finally {
      setGoogleLoading(false)
    }
  }
  const handleForgotPassword = () => {
    setResetEmail(email) // Pre-fill with the email they may have entered
    setShowResetModal(true)
    setResetStatus(null)
    setError("")
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    if (!resetEmail) {
      setResetStatus('error')
      setError('Please enter your email address')
      return
    }

    setResetLoading(true)
    try {
      await doPasswordReset(resetEmail)
      setResetStatus('success')
      setError('')
    } catch (error) {
      console.error("Password reset error:", error)
      setResetStatus('error')
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.")
      } else {
        setError("Failed to send password reset email. Please try again.")
      }
    } finally {
      setResetLoading(false)
    }
  }

  const closeResetModal = () => {
    setShowResetModal(false)
    setResetStatus(null)
    setResetEmail("")
    setError("")
  }
  // Detect if running in Electron
  const isElectron = typeof window !== "undefined" && window.process && window.process.type === "renderer"

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-10 backdrop-blur-[1px]  flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Reset Password</h3>
            
            {resetStatus === 'success' ? (
              <div className="space-y-4">
                <p className="text-green-600">
                  Password reset email sent! Please check your inbox for instructions to reset your password.
                </p>
                <button
                  onClick={closeResetModal}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="mb-4">Enter your email address and we'll send you a link to reset your password.</p>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeResetModal}
                      disabled={resetLoading}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {resetLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NexaDew</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
          {isElectron && <p className="text-xs text-blue-600 mt-2">Running in Electron mode</p>}
        </div>

        {error && !showResetModal && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Google Sign In Button - Only show if not in problematic environment */}
        {!isElectron && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? "Signing In..." : "Continue with Google"}
            </button>
          </div>
        )}

        {isElectron && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Google sign-in is not available in the desktop app. Please use email/password
              sign-in or register a new account.
            </p>
          </div>
        )}

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              {isElectron ? "Sign in with email" : "Or continue with email"}
            </span>
          </div>
        </div>

        <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="text-right">
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In with Email"}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Don't have an account? Register as:</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/marketing-manager/register")}
                disabled={loading || googleLoading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
              >
                Marketing Manager
              </button>
              <button
                onClick={() => navigate("/sales-manager/register")}
                disabled={loading || googleLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
              >
                Sales Manager
              </button>
              <button
                onClick={() => navigate("/company-owner/register")}
                disabled={loading || googleLoading}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm disabled:opacity-50"
              >
                Company Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
