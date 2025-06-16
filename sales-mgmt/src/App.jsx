
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

// Pages
import Home from "./Pages/Home/Home";
import MarketingManagerRegister from "./Pages/MarketingManager/MarketingManagerRegister";
import SalesManagerRegister from "./Pages/SalesManager/SalesManagerRegister";
import CompanyOwnerRegister from "./Pages/CompanyOwner/CompanyOwnerRegister";
import RoleSelection from "./Pages/RoleSelection";
import Login from "./Pages/Login/Login";
import AddNewLead from "./Pages/AddNewLead";
import DailyReminder from "./Pages/DailyReminder";
import Settings from "./Pages/Settings";
import ViewPipeLine from "./Pages/ViewPipeLine";
import GenerateFormLink from "./Pages/GenerateFormLink";
import PublicForm from "./Pages/PublicForm"; // New public form component

const App = () => {
  const [authUser, setAuthUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const collections = ["companyOwner", "marketingManager", "salesManager"];
          let userData = null;

          for (const collection of collections) {
            const userDoc = await getDoc(doc(db, collection, user.uid));
            if (userDoc.exists()) {
              userData = userDoc.data();
              break;
            }
          }

          setUserRole(userData?.role || null);
          setAuthUser(user);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserRole(null);
        }
      } else {
        setAuthUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>

    );
  }

  const getDefaultRoute = () => {
    if (!authUser) return "/login";
    if (!userRole) return "/role-selection";

    switch (userRole) {
      case "Company Owner": return "/";
      case "Marketing Manager": return "/addnewlead";
      case "Sales Manager": return "/viewpipeline";
      default: return "/role-selection";
    }
  };

  const canAccessRoute = (requiredRoles) => {
    if (!authUser) return false;
    if (!userRole) return false;
    if (userRole === "Company Owner") return true;
    return requiredRoles.includes(userRole);
  };


  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={authUser ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
        <Route path="/marketing-manager/register" element={<MarketingManagerRegister />} />
        <Route path="/sales-manager/register" element={<SalesManagerRegister />} />
        <Route path="/company-owner/register" element={<CompanyOwnerRegister />} />
        <Route path="/share-form/:uid" element={<PublicForm />} /> {/* Public form route */}

        <Route
          path="/role-selection"
          element={
            authUser ? (
              userRole ? (
                <Navigate to={getDefaultRoute()} replace />
              ) : (
                <RoleSelection />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            authUser ? (
              userRole ? (
                canAccessRoute(["Company Owner"]) ? (
                  <Home />
                ) : (
                  <Navigate to={getDefaultRoute()} replace />
                )
              ) : (
                <Navigate to="/role-selection" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/addnewlead"
          element={
            authUser ? (
              userRole ? (
                canAccessRoute(["Marketing Manager", "Company Owner"]) ? (
                  <AddNewLead />
                ) : (
                  <Navigate to={getDefaultRoute()} replace />
                )
              ) : (
                <Navigate to="/role-selection" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/viewpipeline"
          element={
            authUser ? (
              userRole ? (
                canAccessRoute(["Sales Manager", "Company Owner"]) ? (
                  <ViewPipeLine />
                ) : (
                  <Navigate to={getDefaultRoute()} replace />
                )
              ) : (
                <Navigate to="/role-selection" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/dailyreminder"
          element={
            authUser ? (
              userRole ? (
                canAccessRoute(["Company Owner"]) ? (
                  <DailyReminder />
                ) : (
                  <Navigate to={getDefaultRoute()} replace />
                )
              ) : (
                <Navigate to="/role-selection" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/settings"
          element={
            authUser ? (
              userRole ? (
                canAccessRoute(["Company Owner"]) ? (
                  <Settings />
                ) : (
                  <Navigate to={getDefaultRoute()} replace />
                )
              ) : (
                <Navigate to="/role-selection" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />


        <Route
          path="/generate-form-link"
          element={
            authUser ? (
              userRole ? (
                canAccessRoute(["Company Owner","Sales Manager"]) ? (
                  <GenerateFormLink />
                ) : (
                  <Navigate to={getDefaultRoute()} replace />
                )
              ) : (
                <Navigate to="/role-selection" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Router>
  );
};


export default App;