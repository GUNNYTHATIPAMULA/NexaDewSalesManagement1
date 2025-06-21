// "use client"
// import { useState, useEffect } from "react"
// import { db, auth } from "../firebase/firebase"
// import { collection, getDocs, query, doc, updateDoc, where, getDoc, setDoc, deleteDoc } from "firebase/firestore"
// import Header from "../components/Header/Header"

// import { deleteUser } from "firebase/auth"; // Add this import at the top
// const Settings = () => {
//   const [activeTab, setActiveTab] = useState("Business Info")
//   const [employees, setEmployees] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [editingEmployeeId, setEditingEmployeeId] = useState(null)
//   const [editFormData, setEditFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     role: "",
//   })
//   const [error, setError] = useState(null)
//   const [success, setSuccess] = useState(null)
//   const [userRole, setUserRole] = useState(null)
//   const [userCompany, setUserCompany] = useState("")
//   const [updateLoading, setUpdateLoading] = useState(false)
//   const [businessInfoLoading, setBusinessInfoLoading] = useState(false)
//   const [ownerInfo, setOwnerInfo] = useState(null)
//   const [editingOwner, setEditingOwner] = useState(false)

//   // Business Info states
//   const [businessInfo, setBusinessInfo] = useState({
//     companyName: "",
//     industry: "",
//     address: "",
//     phone: "",
//     website: "",
//     description: "",
//     foundedYear: "",
//     employeeCount: "",
//   })

//   const fetchCompanyOwnerInfo = async (companyName) => {
//     try {
//       const q = query(collection(db, "companyOwner"), where("companyName", "==", companyName))
//       const snapshot = await getDocs(q)
//       if (!snapshot.empty) {
//         setOwnerInfo(snapshot.docs[0].data())
//       } else {
//         setOwnerInfo(null)
//       }
//     } catch (error) {
//       console.error("Error fetching company owner info:", error)
//       setOwnerInfo(null)
//     }
//   }

//   useEffect(() => {
//     fetchUserDataAndEmployees()
//   }, [])

//   const determineUserRole = async (userId) => {
//     try {
//       const ownerDoc = await getDoc(doc(db, "companyOwner", userId))
//       if (ownerDoc.exists()) {
//         return { role: "Company Owner", data: ownerDoc.data() }
//       }

//       const marketingQuery = query(collection(db, "marketingManager"), where("uid", "==", userId))
//       const marketingSnapshot = await getDocs(marketingQuery)
//       if (!marketingSnapshot.empty) {
//         return { role: "Marketing Manager", data: marketingSnapshot.docs[0].data() }
//       }

//       const salesQuery = query(collection(db, "salesManager"), where("uid", "==", userId))
//       const salesSnapshot = await getDocs(salesQuery)
//       if (!salesSnapshot.empty) {
//         return { role: "Sales Manager", data: salesSnapshot.docs[0].data() }
//       }

//       return { role: "Unknown", data: null }
//     } catch (error) {
//       console.error("Error determining user role:", error)
//       return { role: "Error", data: null }
//     }
//   }

//   const fetchUserDataAndEmployees = async () => {
//     setLoading(true)
//     setError(null)
//     try {
//       const currentUser = auth.currentUser
//       if (!currentUser) {
//         throw new Error("Please sign in to view settings")
//       }

//       const { role, data } = await determineUserRole(currentUser.uid)
//       setUserRole(role)

//       if (!data || !data.companyName) {
//         throw new Error("Company information not found")
//       }

//       const companyName = data.companyName.toLowerCase()
//       setUserCompany(companyName)
//       await fetchCompanyOwnerInfo(companyName)
//       await fetchEmployeesByCompany(companyName)
//     } catch (error) {
//       console.error("Error fetching user data:", error)
//       setError(error.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleDeleteEmployee = async (employeeId, collectionName) => {
//     if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;
//     try {
//       setUpdateLoading(true);
//       setError(null);

//       // Get the employee's Firestore document to retrieve their UID/email
//       const employeeDoc = await getDoc(doc(db, collectionName, employeeId));
//       const employeeData = employeeDoc.exists() ? employeeDoc.data() : null;

//       // Delete from Firestore
//       await deleteDoc(doc(db, collectionName, employeeId));

//       // Try to delete from Auth if the employee is the currently logged-in user
//       if (auth.currentUser && employeeData && employeeData.email === auth.currentUser.email) {
//         await deleteUser(auth.currentUser);
//         setSuccess("Employee and authentication account deleted successfully!");
//         // Optionally, redirect to login or home after self-deletion
//       } else {
//         setSuccess("Employee deleted from database. (Auth account can only be deleted by the user themselves or by an admin function.)");
//       }

//       await fetchEmployeesByCompany(userCompany);
//     } catch (error) {
//       console.error("Error deleting employee:", error);
//       setError("Failed to delete employee: " + error.message);
//     } finally {
//       setUpdateLoading(false);
//     }
//   };
//   const fetchEmployeesByCompany = async (companyName) => {
//     try {
//       const employeesList = []
//       const lowerCompanyName = companyName.toLowerCase()

//       const marketingQuery = query(collection(db, "marketingManager"), where("companyName", "==", lowerCompanyName))
//       const marketingSnapshot = await getDocs(marketingQuery)
//       marketingSnapshot.forEach((doc) => {
//         employeesList.push({
//           id: doc.id,
//           collection: "marketingManager",
//           role: "Marketing Manager",
//           ...doc.data(),
//         })
//       })

//       const salesQuery = query(collection(db, "salesManager"), where("companyName", "==", lowerCompanyName))
//       const salesSnapshot = await getDocs(salesQuery)
//       salesSnapshot.forEach((doc) => {
//         employeesList.push({
//           id: doc.id,
//           collection: "salesManager",
//           role: "Sales Manager",
//           ...doc.data(),
//         })
//       })

//       console.log(`Found ${employeesList.length} employees for company: ${lowerCompanyName}`)
//       setEmployees(employeesList)
//     } catch (error) {
//       console.error("Error fetching employees:", error)
//       throw error
//     }
//   }

//   const fetchBusinessInfo = async (companyName) => {
//     try {
//       const lowerCompanyName = companyName.toLowerCase()
//       const businessDoc = await getDoc(doc(db, "businessInfo", lowerCompanyName))
//       if (businessDoc.exists()) {
//         setBusinessInfo({ ...businessInfo, ...businessDoc.data() })
//       } else {
//         setBusinessInfo((prev) => ({ ...prev, companyName: lowerCompanyName }))
//       }
//     } catch (error) {
//       console.error("Error fetching business info:", error)
//     }
//   }
//   const updateLeadsCompanyName = async (oldCompanyName, newCompanyName) => {
//     try {
//       const leadsQuery = query(
//         collection(db, "leads"),
//         where("submittedLead", "==", oldCompanyName)
//       );
//       const leadsSnapshot = await getDocs(leadsQuery);
//       const updatePromises = [];
//       leadsSnapshot.forEach((docSnap) => {
//         updatePromises.push(
//           updateDoc(doc(db, "leads", docSnap.id), { submittedLead: newCompanyName })
//         );
//       });
//       await Promise.all(updatePromises);
//       console.log(`Updated submittedLead in leads from "${oldCompanyName}" to "${newCompanyName}"`);
//     } catch (error) {
//       console.error("Error updating leads submittedLead:", error);
//     }
//   };

//   const handleEditClick = (employee) => {
//     setEditingEmployeeId(employee.id)
//     setEditFormData({
//       name: employee.name || "",
//       email: employee.email || "",
//       phone: employee.phone || "",
//       role: employee.role || "",
//     })
//     setError(null)
//     setSuccess(null)
//   }

//   const handleEditFormChange = (field, value) => {
//     setEditFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }))
//   }

//   const validateEditForm = () => {
//     if (!editFormData.name.trim()) {
//       setError("Name is required")
//       return false
//     }
//     if (!editFormData.email.trim()) {
//       setError("Email is required")
//       return false
//     }
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
//       setError("Please enter a valid email address")
//       return false
//     }
//     if (!editFormData.role) {
//       setError("Role is required")
//       return false
//     }
//     return true
//   }

//   const handleSaveEdit = async (employeeId, collectionName) => {
//     if (!validateEditForm()) {
//       return
//     }

//     try {
//       setUpdateLoading(true)
//       setError(null)

//       const employeeRef = doc(db, collectionName, employeeId)
//       const currentEmployee = employees.find((e) => e.id === employeeId)

//       await updateDoc(employeeRef, {
//         name: editFormData.name.trim(),
//         email: editFormData.email.trim(),
//         phone: editFormData.phone.trim(),
//       })

//       if (editFormData.role && editFormData.role !== currentEmployee.role) {
//         const newCollection = editFormData.role === "Marketing Manager" ? "marketingManager" : "salesManager"
//         if (newCollection !== collectionName) {
//           const newEmployeeData = {
//             ...editFormData,
//             companyName: userCompany,
//             uid: employeeId,
//           }
//           await setDoc(doc(db, newCollection, employeeId), newEmployeeData)
//           await deleteDoc(employeeRef)
//         }
//       }

//       setSuccess("Employee updated successfully!")
//       setEditingEmployeeId(null)
//       setEditFormData({ name: "", email: "", phone: "", role: "" })
//       await fetchEmployeesByCompany(userCompany)
//     } catch (error) {
//       console.error("Error updating employee:", error)
//       setError("Failed to update employee: " + error.message)
//     } finally {
//       setUpdateLoading(false)
//     }
//   }

//   const handleCancelEdit = () => {
//     setEditingEmployeeId(null)
//     setEditFormData({ name: "", email: "", phone: "", role: "" })
//     setError(null)
//     setSuccess(null)
//   }

//   const handleBusinessInfoChange = (field, value) => {
//     setBusinessInfo((prev) => ({
//       ...prev,
//       [field]: value,
//     }))
//   }

//   const handleOwnerInfoChange = (field, value) => {
//     setOwnerInfo((prev) => ({
//       ...prev,
//       [field]: value,
//     }))
//   }

//   const handleBusinessInfoSubmit = async (e) => {
//     e.preventDefault()
//     setBusinessInfoLoading(true)
//     setError(null)
//     setSuccess(null)

//     try {
//       await setDoc(doc(db, "businessInfo", userCompany), businessInfo)
//       setSuccess("Business information saved successfully!")
//     } catch (error) {
//       console.error("Error saving business info:", error)
//       setError("Failed to save business information: " + error.message)
//     } finally {
//       setBusinessInfoLoading(false)
//     }
//   }

//   const handleOwnerInfoSubmit = async (e) => {
//     e.preventDefault()
//     setBusinessInfoLoading(true)
//     setError(null)
//     setSuccess(null)

//     try {
//       const userId = auth.currentUser.uid
//       const oldCompanyName = userCompany // Store the old company name for employee updates
//       const newOwnerData = {
//         ...ownerInfo, // Preserve all existing fields
//         uid: userId,
//         companyName: ownerInfo.companyName.toLowerCase(),
//       }

//       // Update the companyOwner document
//       await setDoc(doc(db, "companyOwner", userId), newOwnerData, { merge: true })

//       // Update employees' companyName if it has changed
//       if (oldCompanyName !== newOwnerData.companyName.toLowerCase()) {
//         await updateEmployeeCompanyName(oldCompanyName, newOwnerData.companyName.toLowerCase())
//         // Update leads' submittedLead if company name changed
//         await updateLeadsCompanyName(oldCompanyName, newOwnerData.companyName.toLowerCase())
//       }

//       setSuccess("Company owner information saved successfully!")
//       setEditingOwner(false)
//       setUserCompany(newOwnerData.companyName.toLowerCase()) // Update userCompany state
//       await fetchCompanyOwnerInfo(newOwnerData.companyName.toLowerCase()) // Refresh with new data
//       await fetchUserDataAndEmployees() // Refresh employee list
//     } catch (error) {
//       console.error("Error saving owner info:", error)
//       setError("Failed to save company owner information: " + error.message)
//     } finally {
//       setBusinessInfoLoading(false)
//     }
//   }

//   const updateEmployeeCompanyName = async (oldCompanyName, newCompanyName) => {
//     try {
//       const lowerOldCompanyName = oldCompanyName.toLowerCase()
//       const lowerNewCompanyName = newCompanyName.toLowerCase()

//       const marketingQuery = query(collection(db, "marketingManager"), where("companyName", "==", lowerOldCompanyName))
//       const salesQuery = query(collection(db, "salesManager"), where("companyName", "==", lowerOldCompanyName))

//       const [marketingSnapshot, salesSnapshot] = await Promise.all([
//         getDocs(marketingQuery),
//         getDocs(salesQuery),
//       ])

//       const updatePromises = []
//       marketingSnapshot.forEach((docSnap) => {
//         updatePromises.push(updateDoc(doc(db, "marketingManager", docSnap.id), { companyName: lowerNewCompanyName }))
//       })
//       salesSnapshot.forEach((docSnap) => {
//         updatePromises.push(updateDoc(doc(db, "salesManager", docSnap.id), { companyName: lowerNewCompanyName }))
//       })

//       await Promise.all(updatePromises)
//       console.log(`Updated company name for all employees from ${lowerOldCompanyName} to ${lowerNewCompanyName}`)
//     } catch (error) {
//       console.error("Error updating employee company names:", error)
//     }
//   }

//   const handleEditOwnerClick = () => {
//     setEditingOwner(true)
//     setOwnerInfo({
//       ...ownerInfo, // Preserve existing data
//       name: ownerInfo?.name || "",
//       email: ownerInfo?.email || "",
//       phone: ownerInfo?.phone || "",
//       companyAddress: ownerInfo?.companyAddress || "",
//       companyWebsite: ownerInfo?.companyWebsite || "",
//       companyIndustry: ownerInfo?.companyIndustry || "",
//       companyName: ownerInfo?.companyName || userCompany,
//     })
//   }

//   const handleCancelOwnerEdit = () => {
//     setEditingOwner(false)
//     fetchCompanyOwnerInfo(userCompany) // Re-fetch to reset to original data
//   }

//   const tabs = ["Business Info", "Notification Preferences", "Employee Details"]

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case "Business Info":
//         return (
//           <>
//            {success && (
//               <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
//                 {success}
//               </div>
//             )}
//             {ownerInfo ? (
//               editingOwner ? (
//                 <form onSubmit={handleOwnerInfoSubmit} className="p-6 space-y-6">
//                   <h2 className="text-xl font-semibold mb-4">Edit Company Owner Information</h2>
//                   {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
//                   {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//                       <input
//                         type="text"
//                         value={ownerInfo.name || ""}
//                         onChange={(e) => handleOwnerInfoChange("name", e.target.value)}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                       <input
//                         type="email"
//                         value={ownerInfo.email || ""}
//                         onChange={(e) => handleOwnerInfoChange("email", e.target.value)}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//                       <input
//                         type="tel"
//                         value={ownerInfo.phone || ""}
//                         onChange={(e) => handleOwnerInfoChange("phone", e.target.value)}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
//                       <input
//                         type="text"
//                         value={ownerInfo.companyName || ""}
//                         onChange={(e) => handleOwnerInfoChange("companyName", e.target.value)}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
//                       <input
//                         type="text"
//                         value={ownerInfo.companyAddress || ""}
//                         onChange={(e) => handleOwnerInfoChange("companyAddress", e.target.value)}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
//                       <input
//                         type="url"
//                         value={ownerInfo.companyWebsite || ""}
//                         onChange={(e) => handleOwnerInfoChange("companyWebsite", e.target.value)}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
//                       <input
//                         type="text"
//                         value={ownerInfo.companyIndustry || ""}
//                         onChange={(e) => handleOwnerInfoChange("companyIndustry", e.target.value)}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     </div>
//                   </div>
//                   <div className="flex gap-2">
//                     <button
//                       type="submit"
//                       disabled={businessInfoLoading}
//                       className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
//                     >
//                       {businessInfoLoading ? "Saving..." : "Save"}
//                     </button>
//                     <button
//                       type="button"
//                       onClick={handleCancelOwnerEdit}
//                       className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </form>
//               ) : (
//                 <div className="p-6">
//                   <h2 className="text-xl font-semibold mb-4">Company Owner Information</h2>
//                   <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <span className="font-medium text-gray-700">Name:</span>
//                         <span className="ml-2 text-gray-900">{ownerInfo.name || "N/A"}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium text-gray-700">Email:</span>
//                         <span className="ml-2 text-gray-900">{ownerInfo.email || "N/A"}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium text-gray-700">Phone:</span>
//                         <span className="ml-2 text-gray-900">{ownerInfo.phone || "N/A"}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium text-gray-700">Company Name:</span>
//                         <span className="ml-2 text-gray-900">{ownerInfo.companyName || "N/A"}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium text-gray-700">Address:</span>
//                         <span className="ml-2 text-gray-900">{ownerInfo.companyAddress || "N/A"}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium text-gray-700">Website:</span>
//                         <span className="ml-2 text-gray-900">{ownerInfo.companyWebsite || "N/A"}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium text-gray-700">Industry:</span>
//                         <span className="ml-2 text-gray-900">{ownerInfo.companyIndustry || "N/A"}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <button
//                     onClick={handleEditOwnerClick}
//                     className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                   >
//                     Edit
//                   </button>
//                 </div>
//               )
//             ) : (
//               <div className="p-6">
//                 <h2 className="text-xl font-semibold mb-4">Company Owner Information</h2>
//                 <p className="text-gray-600 mb-4">No company owner data found.</p>
//                 <button
//                   onClick={() => setEditingOwner(true)}
//                   className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
//                 >
//                   Add Data
//                 </button>
//                 {editingOwner && (
//                   <form onSubmit={handleOwnerInfoSubmit} className="mt-6 space-y-6">
//                     <h3 className="text-lg font-semibold mb-2">Add Company Owner Information</h3>
//                     {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
//                     {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//                         <input
//                           type="text"
//                           value={ownerInfo?.name || ""}
//                           onChange={(e) => handleOwnerInfoChange("name", e.target.value)}
//                           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           required
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                         <input
//                           type="email"
//                           value={ownerInfo?.email || ""}
//                           onChange={(e) => handleOwnerInfoChange("email", e.target.value)}
//                           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           required
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//                         <input
//                           type="tel"
//                           value={ownerInfo?.phone || ""}
//                           onChange={(e) => handleOwnerInfoChange("phone", e.target.value)}
//                           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
//                         <input
//                           type="text"
//                           value={ownerInfo?.companyName || ""}
//                           onChange={(e) => handleOwnerInfoChange("companyName", e.target.value)}
//                           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           required
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
//                         <input
//                           type="text"
//                           value={ownerInfo?.companyAddress || ""}
//                           onChange={(e) => handleOwnerInfoChange("companyAddress", e.target.value)}
//                           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
//                         <input
//                           type="url"
//                           value={ownerInfo?.companyWebsite || ""}
//                           onChange={(e) => handleOwnerInfoChange("companyWebsite", e.target.value)}
//                           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
//                         <input
//                           type="text"
//                           value={ownerInfo?.companyIndustry || ""}
//                           onChange={(e) => handleOwnerInfoChange("companyIndustry", e.target.value)}
//                           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         />
//                       </div>
//                     </div>
//                     <div className="flex gap-2">
//                       <button
//                         type="submit"
//                         disabled={businessInfoLoading}
//                         className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
//                       >
//                         {businessInfoLoading ? "Saving..." : "Save"}
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => setEditingOwner(false)}
//                         className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </form>
//                 )}
//               </div>
//             )}
//           </>
//         )

//       case "Notification Preferences":
//         return (
//           <div className="p-6">
//             <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//               <p className="text-blue-800">Notification preferences will be available in a future update.</p>
//             </div>
//           </div>
//         )

//       case "Employee Details":
//         return (
//           <div className="p-6">
//             <div className="flex justify-between items-center mb-6">
//               <div>
//                 <h2 className="text-xl font-semibold">Employee Details</h2>
//                 <p className="text-sm text-gray-600 mt-1">
//                   Company: <span className="font-medium">{userCompany}</span> | Your Role:{" "}
//                   <span className="font-medium">{userRole}</span>
//                 </p>
//               </div>
//               <button
//                 onClick={fetchUserDataAndEmployees}
//                 disabled={loading}
//                 className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
//               >
//                 {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
//                 Refresh
//               </button>
//             </div>

//             {error && (
//               <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
//             )}
//             {loading ? (
//               <div className="flex items-center justify-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                 <span className="ml-2 text-gray-600">Loading employees...</span>
//               </div>
//             ) : employees.length === 0 ? (
//               <div className="text-center py-8">
//                 <div className="text-gray-400 text-lg mb-2">No employees found</div>
//                 <p className="text-gray-600">
//                   No marketing managers or sales managers found for company "{userCompany}"
//                 </p>
//               </div>
//             ) : (
//               <div className="bg-white rounded-lg shadow overflow-hidden">
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Name
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Email
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Phone
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Role
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Action
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {employees.map((employee) => (
//                         <tr key={`${employee.collection}-${employee.id}`} className="hover:bg-gray-50">
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {editingEmployeeId === employee.id ? (
//                               <input
//                                 type="text"
//                                 value={editFormData.name}
//                                 onChange={(e) => handleEditFormChange("name", e.target.value)}
//                                 className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                 placeholder="Enter name"
//                               />
//                             ) : (
//                               employee.name || "N/A"
//                             )}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {editingEmployeeId === employee.id ? (
//                               <input
//                                 type="email"
//                                 value={editFormData.email}
//                                 onChange={(e) => handleEditFormChange("email", e.target.value)}
//                                 className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                 placeholder="Enter email"
//                               />
//                             ) : (
//                               employee.email || "N/A"
//                             )}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {editingEmployeeId === employee.id ? (
//                               <input
//                                 type="tel"
//                                 value={editFormData.phone}
//                                 onChange={(e) => handleEditFormChange("phone", e.target.value)}
//                                 className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                 placeholder="Enter phone"
//                               />
//                             ) : (
//                               employee.phone || "N/A"
//                             )}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {editingEmployeeId === employee.id ? (
//                               <select
//                                 value={editFormData.role}
//                                 onChange={(e) => handleEditFormChange("role", e.target.value)}
//                                 className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                               >
//                                 <option value="">Select role</option>
//                                 <option value="Marketing Manager">Marketing Manager</option>
//                                 <option value="Sales Manager">Sales Manager</option>
//                               </select>
//                             ) : (
//                               <span
//                                 className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.role === "Marketing Manager"
//                                     ? "bg-purple-100 text-purple-800"
//                                     : "bg-green-100 text-green-800"
//                                   }`}
//                               >
//                                 {employee.role || "N/A"}
//                               </span>
//                             )}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                             {editingEmployeeId === employee.id ? (
//                               <div className="flex gap-2">
//                                 <button
//                                   className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
//                                   onClick={() => handleSaveEdit(employee.id, employee.collection)}
//                                   disabled={updateLoading}
//                                 >
//                                   {updateLoading && (
//                                     <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
//                                   )}
//                                   Save
//                                 </button>
//                                 <button
//                                   className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
//                                   onClick={handleCancelEdit}
//                                   disabled={updateLoading}
//                                 >
//                                   Cancel
//                                 </button>
//                               </div>
//                             ) : (
//                               <div className="flex gap-2">
//                                 <button
//                                   className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
//                                   onClick={() => handleEditClick(employee)}
//                                 >
//                                   Edit
//                                 </button>
//                                 <button
//                                   className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
//                                   onClick={() => handleDeleteEmployee(employee.id, employee.collection)}
//                                   disabled={updateLoading}
//                                 >
//                                   Delete
//                                 </button>
//                               </div>
//                             )}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//                 <div className="bg-gray-50 px-6 py-3">
//                   <p className="text-sm text-gray-600">
//                     Total employees: {employees.length} (
//                     {employees.filter((e) => e.role === "Marketing Manager").length} Marketing Managers,{" "}
//                     {employees.filter((e) => e.role === "Sales Manager").length} Sales Managers)
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         )
//       default:
//         return null
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header />
//       <div className="max-w-7xl mx-auto p-6">
//         <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
//         <div className="mb-6">
//           <ul className="flex gap-6 border-b border-gray-200">
//             {tabs.map((tab) => (
//               <li
//                 key={tab}
//                 className={`pb-2 cursor-pointer transition-colors ${activeTab === tab
//                     ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
//                     : "text-gray-600 hover:text-gray-900"
//                   }`}
//                 onClick={() => setActiveTab(tab)}
//               >
//                 {tab}
//               </li>
//             ))}
//           </ul>
//         </div>
//         <div className="bg-white rounded-lg shadow">{renderTabContent()}</div>
//       </div>
//     </div>
//   )
// }

// export default Settings
import React from 'react'

const Settings = () => {
  return (
    <div>Settings</div>
  )
}

export default Settings