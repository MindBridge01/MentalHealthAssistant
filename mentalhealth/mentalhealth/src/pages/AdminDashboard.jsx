import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Get token correctly
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setError("Not authorized. Please login again.");
      setLoading(false);
      return;
    }

    axios.get("http://localhost:3000/api/admin/pending-doctors", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        setPendingDoctors(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setError("Failed to load applications.");
        setLoading(false);
      });
  }, [token]);

  const handleApprove = (doctorId) => {
    axios.post(
      "http://localhost:3000/api/admin/approve-doctor",
      { doctorId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then(() => {
        setPendingDoctors(prev =>
          prev.filter(d => d._id !== doctorId)
        );
      })
      .catch(() => {
        setError("Failed to approve doctor.");
      });
  };

  const handleReject = (doctorId) => {
    axios.post(
      "http://localhost:3000/api/admin/reject-doctor",
      { doctorId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then(() => {
        setPendingDoctors(prev =>
          prev.filter(d => d._id !== doctorId)
        );
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
    </div>
  );
};

export default AdminDashboard;