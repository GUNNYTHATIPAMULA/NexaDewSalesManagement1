"use client"
import { useState, useEffect } from "react"
import { db, auth } from "../firebase/firebase"
import { collection, getDocs, query, doc, updateDoc, where, getDoc, setDoc, deleteDoc } from "firebase/firestore" // Added deleteDoc
import Header from "../components/Header/Header"

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Business Info")
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingEmployeeId, setEditingEmployeeId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userCompany, setUserCompany] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)

  // Business Info states
  const [businessInfo, setBusinessInfo] = useState({
    companyName: "",
    industry: "",
    address: "",
    phone: "",
    website: "",
    description: "",
    foundedYear: "",
    employeeCount: "",
  })
  const [businessInfoLoading, setBusinessInfoLoading] = useState(false)

  useEffect(() => {
    fetchUserDataAndEmployees()
  }, [])

  const determineUserRole = async (userId) => {
    try {
      // Check if user is a company owner
      const ownerDoc = await getDoc(doc(db, "companyOwner", userId))
      if (ownerDoc.exists()) {
        return { role: "Company Owner", data: ownerDoc.data() }
      }

      // Check if user is a marketing manager
      const marketingQuery = query(collection(db, "marketingManager"), where("uid", "==", userId))
      const marketingSnapshot = await getDocs(marketingQuery)
      if (!marketingSnapshot.empty) {
        return { role: "Marketing Manager", data: marketingSnapshot.docs[0].data() }
      }

      // Check if user is a sales manager
      const salesQuery = query(collection(db, "salesManager"), where("uid", "==", userId))
      const salesSnapshot = await getDocs(salesQuery)
      if (!salesSnapshot.empty) {
        return { role: "Sales Manager", data: salesSnapshot.docs[0].data() }
      }

      return { role: "Unknown", data: null }
    } catch (error) {
      console.error("Error determining user role:", error)
      return { role: "Error", data: null }
    }
  }

  const fetchUserDataAndEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error("Please sign in to view settings")
      }

      const { role, data } = await determineUserRole(currentUser.uid)
      setUserRole(role)

      if (!data || !data.companyName) {
        throw new Error("Company information not found")
      }

      const companyName = data.companyName.toLowerCase()
      setUserCompany(companyName)

      // Fetch business info
      await fetchBusinessInfo(companyName)

      // Fetch employees based on company name
      await fetchEmployeesByCompany(companyName)
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  const fetchEmployeesByCompany = async (companyName) => {
    try {
      const employeesList = []

      // Convert to lowercase to match database values
      const lowerCompanyName = companyName.toLowerCase()

      // Get all marketing managers in the same company
      const marketingQuery = query(collection(db, "marketingManager"), where("companyName", "==", lowerCompanyName))
      const marketingSnapshot = await getDocs(marketingQuery)
      marketingSnapshot.forEach((doc) => {
        employeesList.push({
          id: doc.id,
          collection: "marketingManager",
          role: "Marketing Manager",
          ...doc.data(),
        })
      })

      // Get all sales managers in the same company
      const salesQuery = query(collection(db, "salesManager"), where("companyName", "==", lowerCompanyName))
      const salesSnapshot = await getDocs(salesQuery)
      salesSnapshot.forEach((doc) => {
        employeesList.push({
          id: doc.id,
          collection: "salesManager",
          role: "Sales Manager",
          ...doc.data(),
        })
      })

      console.log(`Found ${employeesList.length} employees for company: ${lowerCompanyName}`)
      setEmployees(employeesList)
    } catch (error) {
      console.error("Error fetching employees:", error)
      throw error
    }
  }

  const fetchBusinessInfo = async (companyName) => {
    try {
      const lowerCompanyName = companyName.toLowerCase()
      const businessDoc = await getDoc(doc(db, "businessInfo", lowerCompanyName))
      if (businessDoc.exists()) {
        setBusinessInfo({ ...businessInfo, ...businessDoc.data() })
      } else {
        // Initialize with company name if no business info exists
        setBusinessInfo((prev) => ({ ...prev, companyName: lowerCompanyName }))
      }
    } catch (error) {
      console.error("Error fetching business info:", error)
    }
  }

  const handleEditClick = (employee) => {
    setEditingEmployeeId(employee.id)
    setEditFormData({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      role: employee.role || "",
    })
    setError(null)
    setSuccess(null)
  }

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateEditForm = () => {
    if (!editFormData.name.trim()) {
      setError("Name is required")
      return false
    }
    if (!editFormData.email.trim()) {
      setError("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    if (!editFormData.role) {
      setError("Role is required")
      return false
    }
    return true
  }

  const handleSaveEdit = async (employeeId, collectionName) => {
    if (!validateEditForm()) {
      return
    }

    try {
      setUpdateLoading(true)
      setError(null)

      const employeeRef = doc(db, collectionName, employeeId)
      const currentEmployee = employees.find((e) => e.id === employeeId)

      // Update the existing document
      await updateDoc(employeeRef, {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
      })

      // Handle role change
      if (editFormData.role && editFormData.role !== currentEmployee.role) {
        const newCollection = editFormData.role === "Marketing Manager" ? "marketingManager" : "salesManager"
        if (newCollection !== collectionName) {
          // Move to new collection
          const newEmployeeData = {
            ...editFormData,
            companyName: userCompany,
            uid: employeeId, // Assuming uid is the document ID
          }
          await setDoc(doc(db, newCollection, employeeId), newEmployeeData)
          await deleteDoc(employeeRef) // Remove from old collection
        }
      }

      setSuccess("Employee updated successfully!")
      setEditingEmployeeId(null)
      setEditFormData({ name: "", email: "", phone: "", role: "" })

      // Refresh employee list
      await fetchEmployeesByCompany(userCompany)
    } catch (error) {
      console.error("Error updating employee:", error)
      setError("Failed to update employee: " + error.message)
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingEmployeeId(null)
    setEditFormData({ name: "", email: "", phone: "", role: "" })
    setError(null)
    setSuccess(null)
  }

  const handleBusinessInfoChange = (field, value) => {
    setBusinessInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleBusinessInfoSubmit = async (e) => {
    e.preventDefault()
    setBusinessInfoLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Save business info using company name as document ID
      await setDoc(doc(db, "businessInfo", userCompany), businessInfo)
      setSuccess("Business information saved successfully!")
    } catch (error) {
      console.error("Error saving business info:", error)
      setError("Failed to save business information: " + error.message)
    } finally {
      setBusinessInfoLoading(false)
    }
  }

  const tabs = ["Business Info", "Notification Preferences", "Employee Details"]

  const renderTabContent = () => {
    switch (activeTab) {
      case "Business Info":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Business Information</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleBusinessInfoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={businessInfo.companyName}
                    onChange={(e) => handleBusinessInfoChange("companyName", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    value={businessInfo.industry}
                    onChange={(e) => handleBusinessInfoChange("industry", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={businessInfo.phone}
                    onChange={(e) => handleBusinessInfoChange("phone", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={businessInfo.website}
                    onChange={(e) => handleBusinessInfoChange("website", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Founded Year</label>
                  <input
                    type="number"
                    value={businessInfo.foundedYear}
                    onChange={(e) => handleBusinessInfoChange("foundedYear", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Count</label>
                  <select
                    value={businessInfo.employeeCount}
                    onChange={(e) => handleBusinessInfoChange("employeeCount", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select employee count</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                <textarea
                  value={businessInfo.address}
                  onChange={(e) => handleBusinessInfoChange("address", e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your complete business address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                <textarea
                  value={businessInfo.description}
                  onChange={(e) => handleBusinessInfoChange("description", e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your company, its mission, and what you do"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={businessInfoLoading}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {businessInfoLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {businessInfoLoading ? "Saving..." : "Save Business Information"}
                </button>
              </div>
            </form>
          </div>
        )

      case "Notification Preferences":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">Notification preferences will be available in a future update.</p>
            </div>
          </div>
        )

      case "Employee Details":
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Employee Details</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Company: <span className="font-medium">{userCompany}</span> | Your Role:{" "}
                  <span className="font-medium">{userRole}</span>
                </p>
              </div>
              <button
                onClick={fetchUserDataAndEmployees}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Refresh
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading employees...</span>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">No employees found</div>
                <p className="text-gray-600">
                  No marketing managers or sales managers found for company "{userCompany}"
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((employee) => (
                        <tr key={`${employee.collection}-${employee.id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingEmployeeId === employee.id ? (
                              <input
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => handleEditFormChange("name", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter name"
                              />
                            ) : (
                              employee.name || "N/A"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingEmployeeId === employee.id ? (
                              <input
                                type="email"
                                value={editFormData.email}
                                onChange={(e) => handleEditFormChange("email", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter email"
                              />
                            ) : (
                              employee.email || "N/A"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingEmployeeId === employee.id ? (
                              <input
                                type="tel"
                                value={editFormData.phone}
                                onChange={(e) => handleEditFormChange("phone", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter phone"
                              />
                            ) : (
                              employee.phone || "N/A"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingEmployeeId === employee.id ? (
                              <select
                                value={editFormData.role}
                                onChange={(e) => handleEditFormChange("role", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select role</option>
                                <option value="Marketing Manager">Marketing Manager</option>
                                <option value="Sales Manager">Sales Manager</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  employee.role === "Marketing Manager"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {employee.role || "N/A"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingEmployeeId === employee.id ? (
                              <div className="flex gap-2">
                                <button
                                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                                  onClick={() => handleSaveEdit(employee.id, employee.collection)}
                                  disabled={updateLoading}
                                >
                                  {updateLoading && (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  )}
                                  Save
                                </button>
                                <button
                                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                                  onClick={handleCancelEdit}
                                  disabled={updateLoading}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                                onClick={() => handleEditClick(employee)}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-6 py-3">
                  <p className="text-sm text-gray-600">
                    Total employees: {employees.length} (
                    {employees.filter((e) => e.role === "Marketing Manager").length} Marketing Managers,{" "}
                    {employees.filter((e) => e.role === "Sales Manager").length} Sales Managers)
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header/>
      {/* Header component would go here */}
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="mb-6">
          <ul className="flex gap-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <li
                key={tab}
                className={`pb-2 cursor-pointer transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow">{renderTabContent()}</div>
      </div>
    </div>
  )
}

export default Settings