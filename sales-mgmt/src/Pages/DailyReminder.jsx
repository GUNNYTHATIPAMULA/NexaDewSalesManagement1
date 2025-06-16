
import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import { db } from '../firebase/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, where, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';

const DailyReminder = () => {
  const [user] = useAuthState(auth);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [userRole, setUserRole] = useState(''); // To determine if user is companyOwner
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserCompanyAndLeads = async () => {
      if (!user) {
        setError('User not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      try {
        // Try fetching from companyOwner collection
        let userDoc = await getDoc(doc(db, 'companyOwner', user.uid));
        let companyName = '';
        if (userDoc.exists()) {
          companyName = userDoc.data().companyName || '';
          setUserCompany(companyName);
          setUserRole('companyOwner');
        } else {
          // Try marketingManager collection
          userDoc = await getDoc(doc(db, 'marketingManager', user.uid));
          if (userDoc.exists()) {
            companyName = userDoc.data().companyName || '';
            setUserCompany(companyName);
            setUserRole('marketingManager');
          } else {
            // Try salesManager collection
            userDoc = await getDoc(doc(db, 'salesManager', user.uid));
            if (userDoc.exists()) {
              companyName = userDoc.data().companyName || '';
              setUserCompany(companyName);
              setUserRole('salesManager');
            } else {
              setError('User data not found. Please contact support.');
              setLoading(false);
              return;
            }
          }
        }

        if (!companyName) {
          setError('Unable to determine your company. Please contact support.');
          setLoading(false);
          return;
        }

        // Fetch leads for the user's company
        await fetchLeads(companyName, userRole === 'companyOwner' ? user.uid : null);
      } catch (err) {
        console.error('Error fetching user company:', err.message);
        setError(`Error: ${err.message}`);
        setLoading(false);
      }
    };

    fetchUserCompanyAndLeads();
  }, [user]);

  const fetchLeads = async (companyName, companyOwnerId) => {
    try {
      setLoading(true);
      setError('');

      // Current date in YYYY-MM-DD format, adjusted for IST (UTC+5:30)
      const today = new Date();
      // Adjust for IST (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
      const istDate = new Date(today.getTime() + istOffset);
      const todayStr = istDate.toISOString().split('T')[0]; // e.g., "2025-06-09"

      // Base query to filter leads by companyName, status, and followUpDate
      let q = query(
        collection(db, 'leads'),
        where('submittedLead', '==', companyName),
        where('status', '==', 'Follow-Up'),
        where('followUpDate', '==', todayStr)
        // Uncomment if you want to sort by createdAt
        // orderBy('createdAt', 'desc')
      );

      // If the user is a companyOwner, add the companyOwnerId filter
      if (companyOwnerId) {
        q = query(
          collection(db, 'leads'),
          where('submittedLead', '==', companyName),
          where('status', '==', 'Follow-Up'),
          where('followUpDate', '==', todayStr),
          where('companyOwnerId', '==', companyOwnerId)
          // Uncomment if you want to sort by createdAt
          // orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const leadsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
      if (error.code === 'failed-precondition') {
        if (error.message.includes('requires an index')) {
          setError(
            <span>
              This query requires a Firestore index. Please ask your admin to create it or
              <a
                href="https://console.firebase.google.com/project/_/firestore/indexes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline ml-1"
              >
                click here to create it
              </a>.
              <div className="mt-2 text-sm">
                Required index fields: submittedLead (asc), status (asc), followUpDate (asc), companyOwnerId (asc)
                {companyOwnerId && ', companyOwnerId (asc)'}
                {/* Uncomment if you re-enable orderBy */}
                {/* , createdAt (desc) */}
              </div>
            </span>
          );
        } else {
          setError('Query error. Please check your parameters.');
        }
      } else if (error.code === 'permission-denied') {
        setError("You don't have permission to access these leads.");
      } else {
        setError('Failed to load leads. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      New: 'bg-blue-100 text-blue-800',
      Contacted: 'bg-yellow-100 text-yellow-800',
      Qualified: 'bg-purple-100 text-purple-800',
      'Follow-Up': 'bg-indigo-100 text-indigo-800',
      Won: 'bg-green-100 text-green-800',
      Lost: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-800',
      Medium: 'bg-blue-100 text-blue-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const handleFollowUpClick = (leadId) => {
    setSelectedLeadId(leadId);
    setShowFollowUpModal(true);
    const today = new Date().toISOString().split('T')[0];
    setFollowUpDate(today);
  };

  const handleFollowUpSubmit = async () => {
    if (selectedLeadId && followUpDate) {
      try {
        const leadRef = doc(db, 'leads', selectedLeadId);
        await updateDoc(leadRef, {
          status: 'Follow-Up',
          followUpDate: followUpDate,
        });
        setShowFollowUpModal(false);
        setSelectedLeadId(null);
        setFollowUpDate('');
        await fetchLeads(userCompany, userRole === 'companyOwner' ? user.uid : null);
      } catch (error) {
        console.error('Error updating follow-up:', error);
        setError('Failed to update follow-up. Please try again.');
      }
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, { status: newStatus });
      await fetchLeads(userCompany, userRole === 'companyOwner' ? user.uid : null);
    } catch (error) {
      console.error(`Error updating lead status to ${newStatus}:`, error);
      setError(`Failed to update lead status to ${newStatus}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading reminders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
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
            Daily Reminder
          </h1>
          <p className="text-gray-600">
            Follow-up leads scheduled for today ({new Date().toLocaleDateString()})
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Follow-Up Modal */}
        {showFollowUpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">Schedule Follow-Up</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Follow-Up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setShowFollowUpModal(false);
                    setSelectedLeadId(null);
                    setFollowUpDate('');
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Follow-Up Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {lead.name?.charAt(0).toUpperCase() || 'L'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{lead.name || 'No name'}</div>
                            <div className="text-sm text-gray-500">{lead.company || 'No company'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.email || 'No email'}</div>
                        <div className="text-sm text-gray-500">{lead.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}
                        >
                          {lead.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(lead.priority)}`}
                        >
                          {lead.priority || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          <button
                            className="bg-indigo-500 p-2 rounded-md text-white hover:bg-indigo-600"
                            onClick={() => handleFollowUpClick(lead.id)}
                          >
                            Follow-Up
                          </button>
                          <button
                            className="bg-green-500 p-2 rounded-md text-white hover:bg-green-600"
                            onClick={() => handleStatusChange(lead.id, 'Won')}
                          >
                            Won
                          </button>
                          <button
                            className="bg-red-500 p-2 rounded-md text-white hover:bg-red-600"
                            onClick={() => handleStatusChange(lead.id, 'Lost')}
                          >
                            Lost
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No follow-up leads scheduled for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReminder;

