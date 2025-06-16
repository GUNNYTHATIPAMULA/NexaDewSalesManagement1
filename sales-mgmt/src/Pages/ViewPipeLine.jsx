"use client"

import { useState, useEffect } from "react"
import { db } from "../firebase/firebase"
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../firebase/firebase"
import Header from "../components/Header/Header"

const ViewPipeLine = () => {
  const [user] = useAuthState(auth)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [followUpDate, setFollowUpDate] = useState("")
  const [userCompany, setUserCompany] = useState("")
  const [userRole, setUserRole] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchUserCompanyAndLeads = async () => {
      if (!user) {
        setError("User not authenticated. Please log in.")
        setLoading(false)
        return
      }

      try {
        let userDoc,
          companyName = "",
          role = ""

        // Try fetching from different user collections
        const collections = [
          { name: "marketingManager", role: "marketingManager" },
          { name: "salesManager", role: "salesManager" },
          { name: "companyOwner", role: "companyOwner" },
        ]

        for (const collection of collections) {
          userDoc = await getDoc(doc(db, collection.name, user.uid))
          if (userDoc.exists()) {
            companyName = userDoc.data().companyName || ""
            role = collection.role
            break
          }
        }

        if (!companyName) {
          setError("User data not found. Please contact support.")
          setLoading(false)
          return
        }

        setUserCompany(companyName)
        setUserRole(role)

        // Fetch leads
        await fetchLeads(companyName, role)
      } catch (err) {
        console.error("Error fetching user company:", err)
        setError("Failed to fetch user data. Please try again.")
        setLoading(false)
      }
    }

    fetchUserCompanyAndLeads()
  }, [user])

  const fetchLeads = async (companyName, role) => {
    try {
      setLoading(true)

      // Fetch all leads (security rules will filter automatically)
      const leadsRef = collection(db, "leads")
      const snapshot = await getDocs(leadsRef)

      const allLeads = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Client-side filtering as backup (in case security rules are too restrictive)
      const filteredLeads = allLeads.filter((lead) => {
        const leadCompany = lead.submittedLead?.toLowerCase() || lead.submittedLeadLower?.toLowerCase()
        const userCompanyLower = companyName.toLowerCase()

        return leadCompany === userCompanyLower || lead.companyOwnerId === user.uid || lead.createdBy === user.uid
      })

      setLeads(filteredLeads)
    } catch (error) {
      console.error("Error fetching leads:", error)
      setError("Failed to fetch leads. Please check your permissions.")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (leadId, newStatus, followUpDate = null) => {
    try {
      const leadRef = doc(db, "leads", leadId)
      const updateData = { status: newStatus }
      if (followUpDate) {
        updateData.followUpDate = followUpDate
      }
      await updateDoc(leadRef, updateData)
      setShowFollowUpModal(false)
      setSelectedLeadId(null)
      setFollowUpDate("")
      await fetchLeads(userCompany, userRole)
    } catch (error) {
      console.error(`Error updating lead status to ${newStatus}:`, error)
      setError(`Failed to update lead status to ${newStatus}. Please try again.`)
    }
  }

  const handleFollowUpClick = (leadId) => {
    setSelectedLeadId(leadId)
    setShowFollowUpModal(true)
    const today = new Date().toISOString().split("T")[0]
    setFollowUpDate(today)
  }

  const handleFollowUpSubmit = () => {
    if (selectedLeadId && followUpDate) {
      handleStatusChange(selectedLeadId, "Follow-Up", followUpDate)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      New: "bg-blue-100 text-blue-800",
      Contacted: "bg-yellow-100 text-yellow-800",
      Qualified: "bg-purple-100 text-purple-800",
      "Follow-Up": "bg-indigo-100 text-indigo-800",
      Won: "bg-green-100 text-green-800",
      Lost: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority) => {
    const colors = {
      Low: "bg-gray-100 text-gray-800",
      Medium: "bg-blue-100 text-blue-800",
      High: "bg-orange-100 text-orange-800",
      Urgent: "bg-red-100 text-red-800",
    }
    return colors[priority] || "bg-gray-100 text-gray-800"
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesFilter =
      filter === "All" || (filter === "Follow-Up" ? lead.status === "Follow-Up" : lead.status === filter)
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {})

  const handleTabClick = (status) => {
    setFilter(status)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading pipeline...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header/>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Pipeline</h1>
          <p className="text-gray-600">Track and manage your leads through the sales process</p>
          {userCompany && (
            <p className="text-sm text-gray-500 mt-2">
              Company: {userCompany} | Role: {userRole}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{status}</div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search leads by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Follow-Up">Follow-Up</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Follow-Up Modal */}
        {showFollowUpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">Schedule Follow-Up</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Follow-Up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setShowFollowUpModal(false)
                    setSelectedLeadId(null)
                    setFollowUpDate("")
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  onClick={handleFollowUpSubmit}
                  disabled={!followUpDate}
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="menubar">
            <ul className="flex gap-10 p-5 font-medium cursor-pointer text-xl">
              <li className={filter === "New" ? "text-blue-500" : ""} onClick={() => handleTabClick("New")}>
                New Leads
              </li>
              <li className={filter === "Contacted" ? "text-blue-500" : ""} onClick={() => handleTabClick("Contacted")}>
                Contacted Leads
              </li>
              <li className={filter === "Qualified" ? "text-blue-500" : ""} onClick={() => handleTabClick("Qualified")}>
                Interested Leads
              </li>
              <li className={filter === "Follow-Up" ? "text-blue-500" : ""} onClick={() => handleTabClick("Follow-Up")}>
                Follow-Up Leads
              </li>
              <li className={filter === "Won" ? "text-blue-500" : ""} onClick={() => handleTabClick("Won")}>
                Won Leads
              </li>
              <li className={filter === "Lost" ? "text-blue-500" : ""} onClick={() => handleTabClick("Lost")}>
                Lost Leads
              </li>
            </ul>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Follow-Up Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {lead.name?.charAt(0).toUpperCase() || "L"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{lead.name || "Unknown"}</div>
                          <div className="text-sm text-gray-500">{lead.company || "Unknown Company"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.email || "No email"}</div>
                      <div className="text-sm text-gray-500">{lead.phone || "No phone"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.services || "Not specified"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.budget || "Not specified"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}
                      >
                        {lead.status || "New"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(lead.priority)}`}
                      >
                        {lead.priority || "Medium"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.status === "Follow-Up" && lead.followUpDate
                        ? new Date(lead.followUpDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.status === "New" ? (
                        <button
                          className="bg-blue-500 p-2 rounded-md text-white hover:bg-blue-600"
                          onClick={() => handleStatusChange(lead.id, "Contacted")}
                        >
                          Contact
                        </button>
                      ) : lead.status === "Contacted" ? (
                        <div className="flex gap-2">
                          <button
                            className="bg-purple-500 p-2 rounded-md text-white hover:bg-purple-600"
                            onClick={() => handleStatusChange(lead.id, "Qualified")}
                          >
                            Interested
                          </button>
                          <button
                            className="bg-red-500 p-2 rounded-md text-white hover:bg-red-600"
                            onClick={() => handleStatusChange(lead.id, "Lost")}
                          >
                            Lost
                          </button>
                        </div>
                      ) : lead.status === "Qualified" ? (
                        <div className="flex gap-2">
                          <button
                            className="bg-indigo-500 p-2 rounded-md text-white hover:bg-indigo-600"
                            onClick={() => handleFollowUpClick(lead.id)}
                          >
                            Follow-Up
                          </button>
                          <button
                            className="bg-green-500 p-2 rounded-md text-white hover:bg-green-600"
                            onClick={() => handleStatusChange(lead.id, "Won")}
                          >
                            Won
                          </button>
                          <button
                            className="bg-red-500 p-2 rounded-md text-white hover:bg-red-600"
                            onClick={() => handleStatusChange(lead.id, "Lost")}
                          >
                            Lost
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No leads found matching your criteria.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewPipeLine
