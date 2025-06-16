"use client"

import { useEffect, useRef, useState } from "react"
import Button from "../Button/Button"
import SideBar from "../sidebar/SideBar"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../../firebase/firebase"
import { doc, getDoc } from "firebase/firestore"

const Header = () => {
  const sidebarRef = useRef()
  const [authUser, setAuthUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loadingUserData, setLoadingUserData] = useState(true)
  const navigate = useNavigate()

  const handleOpenSidebar = () => {
    sidebarRef.current?.open()
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setAuthUser(user)
      console.log("authUser:", user)
      if (user) {
        await fetchUserData(user.uid)
      } else {
        setUserData(null)
        setLoadingUserData(false)
        console.log("No user is signed in")
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchUserData = async (uid) => {
    try {
      const collections = ["companyOwner","marketingManager", "salesManager"]
      let userData = null

      for (const collection of collections) {
        const userDoc = await getDoc(doc(db, collection, uid))
        if (userDoc.exists()) {
          userData = userDoc.data()
          console.log(`Found user data in ${collection}:`, userData)
          break
        }
      }

      if (userData) {
        setUserData(userData)
        console.log("userData:", userData)
      } else {
        console.log("No user document found in any collection")
        setUserData(null)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setUserData(null)
    } finally {
      setLoadingUserData(false)
    }
  }

  return (
    <>
      <header className="bg-slate-200 h-20 flex justify-between items-center px-6 shadow-2xl">
        <div className="flex items-center">
          <Button
            label={
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
                className="lucide lucide-menu-icon lucide-menu"
              >
                <path d="M4 12h16" />
                <path d="M4 18h16" />
                <path d="M4 6h16" />
              </svg>
            }
            style="p-4"
            click={handleOpenSidebar}
          />
          <div className="text py-2">
            <h1 className="font-bold text-2xl">NexaDew</h1>
          </div>
        </div>
        <div className="flex items-center">
          <span className="p-2 bg-slate-300 rounded-full shadow-xl">
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
              className="lucide lucide-circle-user-round-icon lucide-circle-user-round"
            >
              <path d="M18 20a6 6 0 0 0-12 0" />
              <circle cx="12" cy="10" r="4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </span>
          <span className="p-2">
            {loadingUserData ? (
              "Loading..."
            ) : authUser ? (
              <div className="flex flex-col">
                <span className="font-medium">
                  {userData?.name || authUser.displayName || authUser.email || "User"}
                </span>
                {userData?.role && <span className="text-xs text-gray-600">{userData.role}</span>}
              </div>
            ) : (
              "Guest"
            )}
          </span>
        </div>
      </header>
      <SideBar ref={sidebarRef} />
    </>
  )
}

export default Header
