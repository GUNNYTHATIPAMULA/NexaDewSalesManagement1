"use client"

import { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Sidebar } from "primereact/sidebar"
import Button from "../Button/Button"
import { useNavigate } from "react-router-dom"
import SignOut from "../../Pages/SignOut"
import { auth, db } from "../../firebase/firebase"
import { doc, getDoc } from "firebase/firestore"

// Forward the ref to expose internal toggle
const SideBar = forwardRef((props, ref) => {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const navigate = useNavigate()

  useImperativeHandle(ref, () => ({
    open: () => setSidebarVisible(true),
    close: () => setSidebarVisible(false),
  }))

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const collections = ["marketingManager", "salesManager", "companyOwner"]
        let userData = null

        for (const collection of collections) {
          const userDoc = await getDoc(doc(db, collection, user.uid))
          if (userDoc.exists()) {
            userData = userDoc.data()
            break
          }
        }

        if (userData) {
          setUserRole(userData.role)
        }
      } else {
        setUserRole(null)
      }
    })
    return () => unsubscribe()
  }, [])

  const canAccess = (allowedRoles) => {
    if (userRole === "Company Owner") return true
    return allowedRoles.includes(userRole)
  }

  return (
    <div className="card flex justify-content-center overflow-auto">
      <Sidebar
        visible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
        showCloseIcon={false}
        className="w-full p-5 bg-gray-100 shadow-2xl md:w-20rem lg:w-30rem"
      >
        <h1>Menu Bar</h1>
        <div className="w-full px-1 py-5">
          <ul className="flex flex-col w-full items-start gap-2">
            {canAccess(["Company Owner"]) && (
              <li className="hover:bg-black w-full hover:text-white p-2 rounded-lg" onClick={() => navigate("/")}>
                <Button
                  label="Home"
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  }
                />
              </li>
            )}

            {canAccess(["Company Owner"]) && (
              <li
                className="hover:bg-black w-full hover:text-white p-2 rounded-lg"
                onClick={() => navigate("/dailyreminder")}
              >
                <Button
                  label="Daily Reminder"
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                      <path d="M22 8c0-2.3-.8-4.3-2-6" />
                      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                      <path d="M4 2C2.8 3.7 2 5.7 2 8" />
                    </svg>
                  }
                />
              </li>
            )}

            {canAccess(["Marketing Manager", "Company Owner"]) && (
              <li
                className="hover:bg-black w-full hover:text-white p-2 rounded-lg"
                onClick={() => navigate("/addnewlead")}
              >
                <Button
                  label="Add New Lead"
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      <path d="M3 15h6" />
                      <path d="M6 12v6" />
                    </svg>
                  }
                />
              </li>
            )}

            {canAccess(["Sales Manager", "Company Owner"]) && (
              <li
                className="hover:bg-black w-full hover:text-white p-2 rounded-lg"
                onClick={() => navigate("/viewpipeline")}
              >
                <Button
                  label="View Pipeline"
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                      <path d="M8 10v4" />
                      <path d="M12 10v2" />
                      <path d="M16 10v6" />
                    </svg>
                  }
                />
              </li>
            )}

            {canAccess(["Company Owner"]) && (
              <li
                className="hover:bg-black w-full hover:text-white p-2 rounded-lg"
                onClick={() => navigate("/settings")}
              >
                <Button
                  label="Settings"
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                />
              </li>
            )}

            {canAccess(["Company Owner", "Sales Manager"]) && (
              <li
                className="hover:bg-black w-full hover:text-white p-2 rounded-lg"
                onClick={() => navigate("/generate-form-link")}
              >
                <Button
                  label="Generate Form Link"
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  }
                />
              </li>
            )}


            <li className="hover:bg-black w-full hover:text-white p-2 rounded-lg">
              <SignOut />
            </li>
          </ul>
        </div>
      </Sidebar>
    </div>
  )
})

export default SideBar
