"use client"

import { useState, useEffect } from "react"
import { db, auth } from "../firebase/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import Header from "../components/Header/Header"
import { useAuthState } from "react-firebase-hooks/auth"

function GenerateFormLink() {
  const [user] = useAuthState(auth)
  const [formLink, setFormLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        navigate("/login")
        return
      }

      try {
        const collections = ["companyOwner", "salesManager"]
        let userData = null
        let role = null

        for (const collection of collections) {
          const userDoc = await getDoc(doc(db, collection, user.uid))
          if (userDoc.exists()) {
            userData = userDoc.data()
            role = collection === "companyOwner" ? "Company Owner" : "Sales Manager"
            break
          }
        }

        if (role) {
          setUserRole(role)
        } else {
          setError("Access denied. Only company owners and sales managers can generate form links.")
          setTimeout(() => navigate("/"), 3000)
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        setError("An error occurred while checking your permissions.")
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [user, navigate])

  const generateLink = () => {
    if (!user) return

    // Generate a link with the user's UID so the form can identify the company
    const newLink = `${window.location.origin}/share-form/${user.uid}`
    setFormLink(newLink)
    setCopied(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(formLink)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        setError("Failed to copy to clipboard")
      })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-red-600">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Form Link</h1>
          <p className="text-gray-600 mb-8">
            Create a shareable link that allows potential leads to submit their information directly to your pipeline.
          </p>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Share Your Form</h2>
              <p className="text-gray-600 mb-4">
                Generate a unique link to share with potential clients. They can fill out the form and their information
                will be added directly to your leads pipeline.
              </p>

              <button
                onClick={generateLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Generate New Link
              </button>
            </div>

            {formLink && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Your Form Link</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formLink}
                    readOnly
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Share on social media:</h3>
                  <div className="flex gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(formLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(formLink)}&text=${encodeURIComponent("Fill out our form:")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                    >
                      Twitter
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(formLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-800 text-white rounded-md hover:bg-blue-900"
                    >
                      LinkedIn
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Fill out our form: " + formLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold mb-4">How It Works</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Generate a unique form link</li>
                <li>Share the link with potential clients via email, social media, or your website</li>
                <li>When clients fill out the form, their information is automatically added to your leads pipeline</li>
                <li>Follow up with new leads from the View Pipeline page</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenerateFormLink
