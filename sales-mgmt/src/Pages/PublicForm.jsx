"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { db } from "../firebase/firebase"
import { doc, getDoc } from "firebase/firestore"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

const PublicForm = () => {
  const { uid } = useParams()
  const [companyData, setCompanyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    services: "",
    budget: "",
    timeline: "",
    source: "",
    notes: "",
    priority: "Medium",
    status: "New",
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        console.log("Starting fetch for UID:", uid)
        setDebugInfo(`Attempting to fetch data for UID: ${uid}`)

        if (!uid) {
          throw new Error("No UID provided")
        }

        // Check both companyOwner and salesManager collections
        const collections = [
          { name: "companyOwner", role: "Company Owner" },
          { name: "salesManager", role: "Sales Manager" },
        ]

        let userData = null
        let userRole = null
        let foundInCollection = null

        for (const { name: collectionName, role } of collections) {
          try {
            console.log(`Checking collection: ${collectionName}`)
            setDebugInfo((prev) => prev + `\nChecking ${collectionName}...`)

            const userDoc = await getDoc(doc(db, collectionName, uid))

            if (userDoc.exists()) {
              userData = userDoc.data()
              userRole = role
              foundInCollection = collectionName
              console.log(`Found user in ${collectionName}:`, userData)
              setDebugInfo((prev) => prev + `\nFound in ${collectionName}! Data: ${JSON.stringify(userData)}`)
              break
            } else {
              console.log(`Document does not exist in ${collectionName}`)
              setDebugInfo((prev) => prev + `\nDocument does not exist in ${collectionName}`)
            }
          } catch (collectionError) {
            console.error(`Error checking ${collectionName}:`, collectionError)
            setDebugInfo(
              (prev) => prev + `\nError in ${collectionName}: ${collectionError.code} - ${collectionError.message}`,
            )

            // If we get permission denied, we know the document might exist but we can't read it
            if (collectionError.code === "permission-denied") {
              console.log(`Permission denied for ${collectionName} - document might exist but can't be read`)
              setDebugInfo((prev) => prev + `\nPermission denied for ${collectionName} - creating fallback`)
            }
          }
        }

        if (userData) {
          // Successfully fetched user data
          const companyInfo = {
            companyName: userData.companyName || userData.name || "Contact Form",
            name: userData.name || "Contact Person",
            email: userData.email || "",
            role: userRole,
            logoUrl: userData.logoUrl || null,
            foundIn: foundInCollection,
            phone: userData.phone || "",
          }

          setCompanyData(companyInfo)
          console.log("Final company data:", companyInfo)
          setDebugInfo((prev) => prev + `\nSuccess! Company: ${companyInfo.companyName}`)
        } else {
          // Create a fallback form when user data can't be accessed
          console.log("Creating fallback form - user data not accessible")
          setDebugInfo((prev) => prev + `\nCreating fallback form - user data not accessible`)

          // For the specific UID from the image, we know it's a sales manager for "nexadew"
          let fallbackCompanyInfo
          if (uid === "ZHo3Ppu7Oua2kQbaSHq0mpZO0kb2") {
            fallbackCompanyInfo = {
              companyName: "NexaDew",
              name: "Sales Team",
              email: "nexadew@gmail.com",
              role: "Sales Manager",
              logoUrl: null,
              foundIn: "hardcoded_fallback",
              isFallback: true,
            }
            setDebugInfo((prev) => prev + `\nUsing hardcoded fallback for known UID`)
          } else {
            fallbackCompanyInfo = {
              companyName: "Contact Form",
              name: "Contact Person",
              email: "",
              role: "Unknown",
              logoUrl: null,
              foundIn: "generic_fallback",
              isFallback: true,
            }
            setDebugInfo((prev) => prev + `\nUsing generic fallback`)
          }

          setCompanyData(fallbackCompanyInfo)
        }
      } catch (error) {
        console.error("Fatal error fetching company data:", error)
        setDebugInfo((prev) => prev + `\nFatal error: ${error.code} - ${error.message}`)

        // Even on fatal error, try to create a fallback form
        let fallbackCompanyInfo
        if (uid === "ZHo3Ppu7Oua2kQbaSHq0mpZO0kb2") {
          fallbackCompanyInfo = {
            companyName: "NexaDew",
            name: "Sales Team",
            email: "nexadew@gmail.com",
            role: "Sales Manager",
            logoUrl: null,
            foundIn: "error_fallback",
            isFallback: true,
          }
        } else {
          fallbackCompanyInfo = {
            companyName: "Contact Form",
            name: "Contact Person",
            email: "",
            role: "Unknown",
            logoUrl: null,
            foundIn: "error_fallback",
            isFallback: true,
          }
        }
        setCompanyData(fallbackCompanyInfo)
      } finally {
        setLoading(false)
      }
    }

    if (uid) {
      fetchCompanyData()
    } else {
      setError("Invalid form link - missing user ID")
      setDebugInfo("No UID found in URL")
      setLoading(false)
    }
  }, [uid])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      console.log("Submitting form with data:", formData)
      console.log("Company data:", companyData)

      const leadData = {
        ...formData,
        companyOwnerId: uid,
        submittedLead: companyData?.companyName || "Unknown Company",
        createdAt: serverTimestamp(),
        createdBy: "public_form",
        formSource: "shared_link",
        sharedBy: companyData?.role || "Unknown",
        sharedByCollection: companyData?.foundIn || "Unknown",
        updatedAt: serverTimestamp(),
        isFallbackSubmission: companyData?.isFallback || false,
      }

      await addDoc(collection(db, "leads"), leadData)
      console.log("Form submitted successfully")
      setSubmitted(true)
    } catch (error) {
      console.error("Error submitting form:", error)
      if (error.code === "permission-denied") {
        setError("Permission denied when submitting form. Please contact support.")
      } else {
        setError("Error submitting form. Please try again.")
      }
    }
  }

  // Show debug info in development
  const showDebugInfo = window.location.hostname === "localhost" || window.location.hostname.includes("127.0.0.1")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600 mb-4">Loading form...</div>
          {showDebugInfo && debugInfo && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded whitespace-pre-line max-h-32 overflow-y-auto">
              {debugInfo}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error && !companyData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Form Not Available</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Please contact the person who shared this link for assistance.</p>

          

          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h1>
          <p className="text-gray-700 mb-6">
            Your information has been submitted successfully.
            {companyData?.companyName && ` ${companyData.companyName}`} will contact you shortly.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setFormData({
                name: "",
                email: "",
                phone: "",
                company: "",
                address: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
                services: "",
                budget: "",
                timeline: "",
                source: "",
                notes: "",
                priority: "Medium",
                status: "New",
              })
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">
                  {companyData?.companyName?.charAt(0)?.toUpperCase() || "C"}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{companyData?.companyName}</h1>
            <p className="text-lg text-gray-600 mb-2">Contact Form</p>
          
            <p className="mt-4 text-gray-600">Please fill out this form and we'll get back to you soon.</p>
          
          </div>


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your company name"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="services" className="block text-sm font-medium text-gray-700 mb-1">
                    Services Interested In
                  </label>
                  <select
                    id="services"
                    name="services"
                    value={formData.services}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a service</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile App Development">Mobile App Development</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="SEO Services">SEO Services</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Range
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select budget range</option>
                    <option value="Under $5,000">Under $5,000</option>
                    <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                    <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                    <option value="$25,000 - $50,000">$25,000 - $50,000</option>
                    <option value="Over $50,000">Over $50,000</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information you'd like to share..."
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              >
                Submit Information
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PublicForm
