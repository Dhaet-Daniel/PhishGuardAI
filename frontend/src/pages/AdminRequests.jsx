import { useEffect, useState } from 'react';
import { getApi, putApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = () => getApi('/admin/signup-requests?status=pending').then(setRequests).catch(console.error);

  useEffect(() => { fetchRequests(); }, []);

  const approve = async (id) => {
    try {
      await putApi(`/admin/signup-requests/${id}/approve`);
      toast.success('User approved and created');
      fetchRequests();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const reject = async (id) => {
    try {
      await putApi(`/admin/signup-requests/${id}/reject`);
      toast.success('Request rejected');
      fetchRequests();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sign-up Requests</h2>
      {requests.length === 0 && <p className="text-gray-400">No pending requests.</p>}
      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-[#111827] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <div className="font-semibold text-white">{req.full_name}</div>
              <div className="text-sm text-gray-400">{req.email} {req.organization && `· ${req.organization}`}</div>
              <div className="text-xs text-gray-500 mt-1">Requested {new Date(req.created_at).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => approve(req.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm">Approve</button>
              <button onClick={() => reject(req.id)} className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
