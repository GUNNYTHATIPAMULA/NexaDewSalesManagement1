"use client"

import { useState, useEffect } from "react"
import { db, auth } from "../../firebase/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import Header from "../../components/Header/Header"

const Home = () => {
  const [user] = useAuthState(auth)
  const [timePeriod, setTimePeriod] = useState("Monthly")
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userCompany, setUserCompany] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    const fetchUserCompanyAndLeads = async () => {
      if (!user) {
        setError("Please login to view the dashboard")
        setLoading(false)
        return
      }

      try {
        const collections = [
          { name: "marketingManager", role: "marketingManager" },
          { name: "salesManager", role: "salesManager" },
          { name: "companyOwner", role: "companyOwner" },
        ]
        let userData = null
        let userCompanyName = ""
        let role = ""

        for (const collection of collections) {
          const userDoc = await getDoc(doc(db, collection.name, user.uid))
          if (userDoc.exists()) {
            userData = userDoc.data()
            userCompanyName = userData.companyName || ""
            role = collection.role
            break
          }
        }

        if (!userCompanyName) {
          setError("Unable to determine your company. Please contact support.")
          setLoading(false)
          return
        }

        setUserCompany(userCompanyName)
        setUserRole(role)
        await fetchLeads(userCompanyName, role)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to load dashboard data. Please try again.")
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

  const getFilteredLeads = () => {
    if (!leads.length) return []

    const now = new Date()
    const timeRanges = {
      Daily: 1 * 24 * 60 * 60 * 1000,
      Weekly: 7 * 24 * 60 * 60 * 1000,
      Monthly: 30 * 24 * 60 * 60 * 1000,
    }

    return leads.filter((lead) => {
      let createdAt
      if (lead.createdAt?.toDate) {
        createdAt = lead.createdAt.toDate()
      } else if (lead.createdAt) {
        createdAt = new Date(lead.createdAt)
      } else {
        return true
      }

      return now - createdAt <= timeRanges[timePeriod]
    })
  }

  const filteredLeads = getFilteredLeads()

  const totalLeads = filteredLeads.length
  const wonLeads = filteredLeads.filter((lead) => lead.status === "Won").length
  const lostLeads = filteredLeads.filter((lead) => lead.status === "Lost").length
  const newLeads = filteredLeads.filter((lead) => lead.status === "New" || !lead.status).length
  const contactedLeads = filteredLeads.filter((lead) => lead.status === "Contacted").length
  const qualifiedLeads = filteredLeads.filter((lead) => lead.status === "Qualified").length
  const followUpLeads = filteredLeads.filter((lead) => lead.status === "Follow-Up").length

  const winPercentage = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0
  const lostPercentage = totalLeads > 0 ? Math.round((lostLeads / totalLeads) * 100) : 0

  const recentLeads = filteredLeads.slice(0, 8)

  const getStatusIcon = (status) => {
    switch (status) {
      case "Won":
        return "🏆"
      case "Lost":
        return "❌"
      case "New":
        return "✨"
      case "Contacted":
        return "📞"
      case "Qualified":
        return "⭐"
      case "Follow-Up":
        return "📅"
      default:
        return "📋"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Won":
        return "bg-gradient-to-r from-green-400 to-green-600"
      case "Lost":
        return "bg-gradient-to-r from-red-400 to-red-600"
      case "New":
        return "bg-gradient-to-r from-blue-400 to-blue-600"
      case "Contacted":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600"
      case "Qualified":
        return "bg-gradient-to-r from-purple-400 to-purple-600"
      case "Follow-Up":
        return "bg-gradient-to-r from-indigo-400 to-indigo-600"
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-gray-700">Loading your dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Header/>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          
           <div className="flex flex-col gap-4">
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg font-medium"
                >
                  <option value="Monthly">📅 Monthly View</option>
                  <option value="Weekly">📅 Weekly View</option>
                  <option value="Daily">📅 Daily View</option>
                </select>
              </div>
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Leads List */}
          <div className="xl:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recent Leads</h2>
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  {recentLeads.length} leads
                </div>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead, index) => (
                    <div
                      key={lead.id}
                      className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {lead.name?.charAt(0).toUpperCase() || "L"}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{lead.name || "Unknown"}</div>
                            <div className="text-sm text-gray-600">{lead.company || "Unknown Company"}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getStatusIcon(lead.status)}</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(lead.status)}`}
                          >
                            {lead.status || "New"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <div className="text-gray-500 text-lg">No leads found for this time period</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Lead Distribution</h3>
                <div className="flex justify-center">
                  <div className="relative w-64 h-64">
                    {/* Modern Donut Chart */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                      {/* Won segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray={`${(wonLeads / totalLeads) * 251.2} 251.2`}
                        strokeDashoffset="0"
                        className="transition-all duration-1000"
                      />
                      {/* Lost segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="8"
                        strokeDasharray={`${(lostLeads / totalLeads) * 251.2} 251.2`}
                        strokeDashoffset={`-${(wonLeads / totalLeads) * 251.2}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{totalLeads}</div>
                        <div className="text-sm text-gray-600">Total Leads</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center space-x-6 mt-6">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Won ({wonLeads})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Lost ({lostLeads})</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Performance Overview</h3>
                <div className="flex justify-center items-end h-64 space-x-8">
                  {/* Won Bar */}
                  <div className="flex flex-col items-center">
                    <div className="text-lg font-bold text-green-600 mb-2">{winPercentage}%</div>
                    <div
                      className="bg-gradient-to-t from-green-400 to-green-600 w-16 rounded-t-lg transition-all duration-1000 shadow-lg"
                      style={{ height: `${Math.max((winPercentage / 100) * 200, 10)}px` }}
                    ></div>
                    <div className="mt-3 text-center">
                      <div className="text-2xl mb-1"></div>
                      <div className="text-sm font-medium text-gray-700">Won</div>
                      <div className="text-xs text-gray-500">({wonLeads})</div>
                    </div>
                  </div>

                  {/* Lost Bar */}
                  <div className="flex flex-col items-center">
                    <div className="text-lg font-bold text-red-600 mb-2">{lostPercentage}%</div>
                    <div
                      className="bg-gradient-to-t from-red-400 to-red-600 w-16 rounded-t-lg transition-all duration-1000 shadow-lg"
                      style={{ height: `${Math.max((lostPercentage / 100) * 200, 10)}px` }}
                    ></div>
                    <div className="mt-3 text-center">
                      <div className="text-2xl mb-1"></div>
                      <div className="text-sm font-medium text-gray-700">Lost</div>
                      <div className="text-xs text-gray-500">({lostLeads})</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Win/Loss Summary */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{winPercentage}%</div>
                <div className="text-xl opacity-90">Win Rate</div>
                <div className="text-sm opacity-75 mt-1">
                  {wonLeads} out of {totalLeads} leads
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{lostPercentage}%</div>
                <div className="text-xl opacity-90">Loss Rate</div>
                <div className="text-sm opacity-75 mt-1">
                  {lostLeads} out of {totalLeads} leads
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default Home
