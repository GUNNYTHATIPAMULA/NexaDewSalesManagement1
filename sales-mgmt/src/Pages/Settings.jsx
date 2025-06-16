"use client"

import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';

import { db, auth } from '../firebase/firebase';
import { collection, getDocs, query, doc, updateDoc, where, getDoc } from 'firebase/firestore';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Business Info');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);


  useEffect(() => {
    fetchEmployees();
  }, []);

  const determineUserRole = async (userId) => {
    try {
      // Check if user is a company owner
      const ownerDoc = await getDoc(doc(db, 'companyOwner', userId));
      if (ownerDoc.exists()) {
        return 'Company Owner';
      }

      // Check if user is a marketing manager
      const marketingDoc = await getDoc(doc(db, 'marketingManager', userId));
      if (marketingDoc.exists()) {
        return 'Marketing Manager';
      }

      // Check if user is a sales manager
      const salesDoc = await getDoc(doc(db, 'salesManager', userId));
      if (salesDoc.exists()) {
        return 'Sales Manager';
      }

      return 'Unknown';
    } catch (error) {
      console.error("Error determining user role:", error);
      return 'Error';
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Please sign in to view settings");
      }

      const role = await determineUserRole(currentUser.uid);
      setUserRole(role);

      if (role === 'Company Owner') {
        // Company owners can see all employees in their company
        const ownerDoc = await getDoc(doc(db, 'companyOwner', currentUser.uid));
        if (!ownerDoc.exists()) {
          throw new Error("Company owner record not found");
        }

        const companyName = ownerDoc.data().companyName;
        const employeesList = [];

        // Get all company owners in the same company
        const ownersQuery = query(
          collection(db, 'companyOwner'),
          where('companyName', '==', companyName)
        );
        const ownersSnapshot = await getDocs(ownersQuery);
        ownersSnapshot.forEach(doc => {
          employeesList.push({
            id: doc.id,
            collection: 'companyOwner',
            ...doc.data()
          });
        });

        setEmployees(employeesList);
      } else if (role === 'Marketing Manager' || role === 'Sales Manager') {
        // Managers can only see their own data
        const collectionName = role === 'Marketing Manager' ? 'marketingManager' : 'salesManager';
        const managerDoc = await getDoc(doc(db, collectionName, currentUser.uid));
        
        if (managerDoc.exists()) {
          setEmployees([{
            id: managerDoc.id,
            collection: collectionName,
            ...managerDoc.data()
          }]);
        } else {
          throw new Error(`${role} record not found`);
        }
      } else {
        throw new Error("You don't have permission to view this page");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (employee) => {
    if (userRole !== 'Company Owner') {
      setError("Only company owners can edit roles");
      return;
    }
    setEditingEmployeeId(employee.id);
    setNewRole(employee.role);
  };

  const handleRoleChange = async (employeeId, currentCollection) => {
    try {
      if (userRole !== 'Company Owner') {
        throw new Error("Only company owners can change roles");
      }
      // In your current security rules, role changes aren't allowed
      // You would need to update your rules to allow this
      setError("Role changes are currently disabled");
      setEditingEmployeeId(null);
    } catch (error) {
      console.error("Error updating employee role:", error);
      setError(error.message);
    }
  };

  const tabs = [
    "Business Info",
    "WhatsApp Template",
    "Notification Preferences",
    "Employee Details",
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Business Info":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Business Info</h2>
            <p className="text-gray-600">Configure your business information here.</p>
          </div>
        );
      case "WhatsApp Template":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">WhatsApp Template</h2>
            <p className="text-gray-600">Manage your WhatsApp templates here.</p>
          </div>
        );
      case "Notification Preferences":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            <p className="text-gray-600">Set your notification preferences here.</p>
          </div>
        );
      case "Employee Details":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Employee Details</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {loading ? (
              <div className="text-center text-gray-600">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="text-center text-gray-600">No employees found.</div>
            ) : (
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
                        Role
                      </th>
                      {userRole === 'Company Owner' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={`${employee.collection}-${employee.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.role}
                        </td>
                        {userRole === 'Company Owner' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                              onClick={() => handleEditClick(employee)}
                            >
                              Edit
                            </button>

                          </td>
                        )}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="mb-6">
          <ul className="flex gap-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <li
                key={tab}
                className={`pb-2 cursor-pointer ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </li>
            ))}
          </ul>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;