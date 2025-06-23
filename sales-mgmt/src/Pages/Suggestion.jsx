"use client"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/firebase"
import Header from "../components/Header/Header"

const Suggestion = () => {
  const [formData, setFormData] = useState({
    userName: "",
    companyName: "",
    email: "",
    subject: "",
    suggestion: "",
    category: "general",
    othercategory: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      // Validate required fields
      if (!formData.userName.trim() || !formData.companyName.trim() || !formData.suggestion.trim()) {
        throw new Error("Please fill in all required fields")
      }

      // Validate other category if "other" is selected
      if (formData.category === "other" && !formData.othercategory.trim()) {
        throw new Error("Please specify the other category")
      }

      // Email validation if provided
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Please enter a valid email address")
      }

      // Prepare data for Firebase
      const suggestionData = {
        userName: formData.userName.trim(),
        companyName: formData.companyName.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        suggestion: formData.suggestion.trim(),
        category: formData.category,
        othercategory: formData.category === "other" ? formData.othercategory.trim() : "",
        createdAt: serverTimestamp(),
        status: "pending",
        upvotes: 0,
        comments: [],
      }

      // Add document to Firebase
      const docRef = await addDoc(collection(db, "suggestions"), suggestionData)

      console.log("Suggestion submitted with ID: ", docRef.id)
      setSubmitStatus("success")

      // Reset form
      setFormData({
        userName: "",
        companyName: "",
        email: "",
        subject: "",
        suggestion: "",
        category: "general",
        othercategory: "",
      })
    } catch (error) {
      console.error("Error submitting suggestion: ", error)
      setSubmitStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = [
    { value: "general", label: "General", icon: "💡" },
    { value: "feature", label: "Feature Request", icon: "🚀" },
    { value: "improvement", label: "Improvement", icon: "⚡" },
    { value: "bug", label: "Bug Report", icon: "🐛" },
    { value: "ui-ux", label: "UI/UX", icon: "🎨" },
    { value: "performance", label: "Performance", icon: "⚡" },
    { value: "other", label: "Other", icon: "📝" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Ideas</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us improve by sharing your suggestions, feedback, and ideas. Every contribution matters!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border-0 backdrop-blur-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  Submit Your Suggestion
                </h2>
                <p className="text-blue-100 mt-1">Fill out the form below to share your thoughts with us</p>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* User Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="userName" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        
                        User Name *
                      </label>
                      <input
                        id="userName"
                        name="userName"
                        type="text"
                        value={formData.userName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="companyName"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        Company Name *
                      </label>
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Enter your company name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      Email (Optional)
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Category Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="category" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                        required
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Other Category Input - Shows only when "other" is selected */}
                    {formData.category === "other" && (
                      <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <label
                          htmlFor="othercategory"
                          className="flex items-center gap-2 text-sm font-medium text-gray-700"
                        >
                          Please specify the category *
                        </label>
                        <input
                          id="othercategory"
                          name="othercategory"
                          type="text"
                          value={formData.othercategory}
                          onChange={handleInputChange}
                          placeholder="Enter your custom category"
                          className="w-full px-3 py-2 border  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-blue-50 border-blue-200"
                          required
                        />
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          Help us understand your suggestion better by specifying the category
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label htmlFor="subject" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief summary of your suggestion"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Suggestion */}
                  <div className="space-y-2">
                    <label htmlFor="suggestion" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      Your Suggestion *
                    </label>
                    <textarea
                      id="suggestion"
                      name="suggestion"
                      value={formData.suggestion}
                      onChange={handleInputChange}
                      placeholder="Please describe your suggestion in detail. What problem does it solve? How would it improve the experience?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[120px] resize-vertical"
                      required
                    />
                    <p className="text-xs text-gray-500">{formData.suggestion.length}/500 characters</p>
                  </div>

                  {/* Status Messages */}
                  {submitStatus === "success" && (
                    <div className="border border-green-200 bg-green-50 rounded-md p-4">
                      <div className="flex items-center">
                        <p className="text-green-800">
                          🎉 Thank you! Your suggestion has been submitted successfully. We'll review it and get back to
                          you soon.
                        </p>
                      </div>
                    </div>
                  )}

                  {submitStatus === "error" && (
                    <div className="border border-red-200 bg-red-50 rounded-md p-4">
                      <div className="flex items-center">
                        <p className="text-red-800">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        Submitting Your Suggestion...
                      </>
                    ) : (
                      <>
]                        Submit Suggestion
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips Card */}
            <div className="bg-white rounded-lg shadow-lg border-0 backdrop-blur-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  Tips for Great Suggestions
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600">Be specific about the problem you're trying to solve</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600">Explain how your suggestion would improve the experience</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600">Include examples or use cases when possible</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600">Choose the most appropriate category</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600">
                      <strong>Select "Other"</strong> if your suggestion doesn't fit existing categories
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories Overview */}
            <div className="bg-white rounded-lg shadow-lg border-0 backdrop-blur-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Categories</h3>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.value}
                      className={`px-3 py-2 rounded-md text-xs border transition-colors ${
                        formData.category === cat.value
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {cat.icon} {cat.label}
                      {cat.value === "other" && (
                        <span className="ml-2 text-blue-600 font-medium">(Custom category)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Selection */}
            {formData.category === "other" && formData.othercategory && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Your Custom Category:</h4>
                <div className="bg-white px-3 py-2 rounded border border-blue-200">
                  <span className="text-blue-800 font-medium">📝 {formData.othercategory}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Suggestion
