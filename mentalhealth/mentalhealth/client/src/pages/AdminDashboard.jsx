import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../config/api";

const AdminDashboard = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      axios.get(apiUrl("/api/admin/pending-doctors"), { withCredentials: true }),
      axios.get(apiUrl("/api/admin/users"), { withCredentials: true }),
    ])
      .then(([pendingRes, usersRes]) => {
        setPendingDoctors(pendingRes.data);
        setUsers(usersRes.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load admin data.");
        setLoading(false);
      });
  }, []);

  const handleApprove = (doctorId) => {
    axios.post(
      apiUrl("/api/admin/approve-doctor"),
      { doctorId },
      { withCredentials: true }
    )
      .then(() => {
        setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
        setUsers(prev => prev.map((user) => (
          user._id === doctorId ? { ...user, role: "doctor" } : user
        )));
      })
      .catch(() => {
        setError("Failed to approve doctor.");
      });
  };

  const handleReject = (doctorId) => {
    axios.post(
      apiUrl("/api/admin/reject-doctor"),
      { doctorId },
      { withCredentials: true }
    )
      .then(() => {
        setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
        setUsers(prev => prev.filter((user) => user._id !== doctorId));
      })
      .catch(() => {
        setError("Failed to reject doctor.");
      });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="w-full min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center">
      <h2 className="font-bold text-3xl mb-6">Admin Dashboard</h2>
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-md p-6">
        <h3 className="font-semibold text-xl mb-4">
          Pending Doctor Applications
        </h3>

        {pendingDoctors.length === 0 ? (
          <div>No pending applications.</div>
        ) : (
          <table className="w-full mb-4">
            <thead>
              <tr className="text-left">
                <th>Name</th>
                <th>Email</th>
                <th>License</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingDoctors.map(doc => (
                <tr key={doc._id} className="border-b">
                  <td>{doc.name}</td>
                  <td>{doc.email}</td>
                  <td>{doc.licenseNumber}</td>
                  <td>
                    <button
                      className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                      onClick={() => handleApprove(doc._id)}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-600 text-white px-2 py-1 rounded"
                      onClick={() => handleReject(doc._id)}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-md p-6 mt-6">
        <h3 className="font-semibold text-xl mb-4">System Users</h3>
        {users.length === 0 ? (
          <div>No users found.</div>
        ) : (
          <table className="w-full mb-4">
            <thead>
              <tr className="text-left">
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b">
                  <td>{user.name || "-"}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
