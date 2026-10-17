import { useEffect, useState } from 'react';
import { getFeatureRequests, resolveFeatureRequest, dismissFeatureRequest } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminFeatureRequests() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = () => getFeatureRequests().then(setRequests).catch(console.error);
  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id) => {
    try {
      await resolveFeatureRequest(id);
      toast.success('Feature approved for this user');
      fetchRequests();
    } catch (err) { toast.error(err.message); }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissFeatureRequest(id);
      toast.success('Request dismissed');
      fetchRequests();
    } catch (err) { toast.error(err.message); }
  };

  const pending = requests.filter(r => r.status === 'pending');

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Feature Requests</h2>
      {pending.length === 0 && <p className="text-gray-400">No pending requests.</p>}
      <div className="space-y-4">
        {pending.map(req => (
          <div key={req.id} className="bg-[#111827] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <span className="font-semibold text-white">{req.user_email}</span>
              <span className="text-gray-400 text-sm ml-2">wants</span>
              <span className="text-blue-400 font-medium ml-1">{req.feature_name}</span>
              <div className="text-xs text-gray-500 mt-1">{new Date(req.created_at).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm">Approve for user</button>
              <button onClick={() => handleDismiss(req.id)} className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm">Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
