"use client"

import { useState } from "react"
import { auth, db } from "../firebase/firebase"
import { setDoc, doc, query, collection, getDocs } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { doSignInWithGoogle } from "../firebase/auth"
import { createUserWithEmailAndPassword } from "firebase/auth"

const RegisterForm = ({ role, successRedirect, accentColor, requireCompanyVerification = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const checkCompanyExists = async (companyName) => {
    if (!requireCompanyVerification) return true

    try {
      // Fetch all companyOwner documents
      const companyQuery = query(collection(db, "companyOwner"))
      const querySnapshot = await getDocs(companyQuery)

      // Normalize the input company name
      const normalizedInput = companyName.toLowerCase().trim()

      // Check if any document has a matching companyName (case-insensitive)
      let companyExists = false
      querySnapshot.forEach((doc) => {
        const companyData = doc.data()
        const storedCompanyName = companyData.companyName || ""
        if (storedCompanyName.toLowerCase().trim() === normalizedInput) {
          companyExists = true
        }
      })

      return companyExists
    } catch (error) {
      console.error("Error checking company:", error.message)
      throw error
    }
  }

  const saveUserData = async (user) => {
    try {
      // Map role to collection name
      const getCollectionName = (role) => {
        switch (role) {
          case "Company Owner":
            return "companyOwner"
          case "Marketing Manager":
            return "marketingManager"
          case "Sales Manager":
            return "salesManager"
          default:
            return role.toLowerCase().replace(" ", "")
        }
      }

      const collectionName = getCollectionName(role)

      const userData = {
        name: formData.name || user.displayName || "Unknown",
        email: formData.email || user.email,
        phone: formData.phone || "",
        companyName: formData.companyName.toLowerCase().trim(), // Ensure consistency
        role: role,
        uid: user.uid,
        createdAt: new Date().toISOString(),
      }

      console.log("Saving to collection:", collectionName)
      console.log("User data:", userData)

      await setDoc(doc(db, collectionName, user.uid), userData)
      console.log("User data saved successfully!")
      navigate(successRedirect)
    } catch (error) {
      console.error("Error saving user data:", error.message)
      console.error("Error code:", error.code)
      console.error("Full error:", error)
      throw error
    }
  }

  const handleEmailPasswordSignup = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError("Name is required.")
        return
      }
      if (!formData.email.trim()) {
        setError("Email is required.")
        return
      }
      if (!formData.password.trim()) {
        setError("Password is required.")
        return
      }
      if (!formData.companyName.trim()) {
        setError("Company name is required.")
        return
      }

      if (requireCompanyVerification) {
        const companyExists = await checkCompanyExists(formData.companyName)
        if (!companyExists) {
          setError("Company not found. An owner must register this company first.")
          return
        }
      }

      console.log("Creating user with email:", formData.email)
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      console.log("User created successfully:", userCredential.user.uid)

      await saveUserData(userCredential.user)
    } catch (error) {
      console.error("Error registering user:", error.message)
      console.error("Error code:", error.code)

      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please use a different email or sign in.")
      } else if (error.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.")
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else if (error.code === "permission-denied") {
        setError("Database permission error. Please contact support.")
      } else if (error.message.includes("Missing or insufficient permissions")) {
        setError("Database permission error. Please contact support.")
      } else {
        setError(error.message || "An error occurred during registration.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError("")
    setGoogleLoading(true)
    try {
      if (!formData.companyName.trim()) {
        setError("Company name is required.")
        return
      }

      if (requireCompanyVerification) {
        const companyExists = await checkCompanyExists(formData.companyName)
        if (!companyExists) {
          setError("Company not found. An owner must register this company first.")
          return
        }
      }

      console.log("Starting Google sign-up...")
      const result = await doSignInWithGoogle()
      console.log("Google sign-up successful:", result.user.uid)

      await saveUserData(result.user)
    } catch (error) {
      console.error("Error with Google signup:", error.message)
      console.error("Error code:", error.code)

      if (error.code === "permission-denied") {
        setError("Database permission error. Please contact support.")
      } else if (error.message.includes("Missing or insufficient permissions")) {
        setError("Database permission error. Please contact support.")
      } else {
        setError(error.message || "An error occurred during Google sign-up.")
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">{role} Register</h1>
        <p className="text-gray-600 text-center mb-6">Create your {role} account</p>

        {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</p>}

        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignup}
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
            {googleLoading ? "Creating Account..." : "Continue with Google"}
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or register with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailPasswordSignup} className="flex flex-col gap-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent`}
              required
              placeholder={role === "Company Owner" ? "Enter your company name" : "Enter the company name you work for"}
            />
            {role !== "Company Owner" && (
              <p className="text-xs text-gray-500 mt-1">This company must already be registered by a Company Owner</p>
            )}
          </div>

          {["name", "phone", "email", "password"].map((field) => (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                {field.charAt(0).toUpperCase() + field.slice(1)} {field !== "phone" ? "*" : ""}
              </label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                id={field}
                value={formData[field]}
                onChange={handleInputChange}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent`}
                required={field !== "phone"}
                minLength={field === "password" ? 6 : undefined}
                placeholder={`Enter your ${field}`}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className={`w-full bg-${accentColor}-600 text-white py-3 rounded-lg hover:bg-${accentColor}-700 transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className={`text-${accentColor}-600 hover:text-${accentColor}-800 font-medium`}
              disabled={loading || googleLoading}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm