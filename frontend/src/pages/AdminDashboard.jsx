import { useEffect, useState } from 'react';
import { getApi } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getApi('/admin/stats').then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="p-6 text-gray-400">Loading stats...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-[#111827] p-6 rounded-xl border border-gray-800">
        <i className="fas fa-users text-2xl text-blue-400 mb-2"></i>
        <div className="text-3xl font-bold">{stats.total_users}</div>
        <div className="text-gray-400">Registered Users</div>
      </div>
      <div className="bg-[#111827] p-6 rounded-xl border border-gray-800">
        <i className="fas fa-search text-2xl text-purple-400 mb-2"></i>
        <div className="text-3xl font-bold">{stats.total_scans}</div>
        <div className="text-gray-400">Total Scans</div>
      </div>
      <div className="bg-[#111827] p-6 rounded-xl border border-gray-800">
        <i className="fas fa-comment-alt text-2xl text-green-400 mb-2"></i>
        <div className="text-3xl font-bold">{stats.open_feedback}</div>
        <div className="text-gray-400">Open Feedback</div>
      </div>
    </div>
  );
}
