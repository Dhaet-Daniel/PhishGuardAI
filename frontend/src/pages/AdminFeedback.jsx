import { useEffect, useState } from 'react';
import { getApi, putApi, deleteApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState('');

  const fetchFeedback = () => getApi('/admin/feedback').then(setFeedbackList).catch(console.error);

  useEffect(() => { fetchFeedback(); }, []);

  const openDetail = (fb) => {
    setSelected(fb);
    setResponse(fb.admin_response || '');
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      await putApi(`/admin/feedback/${selected.id}`, { admin_response: response, status: 'resolved' });
      toast.success('Feedback updated');
      setSelected(null);
      fetchFeedback();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await deleteApi(`/admin/feedback/${id}`);
      toast.success('Deleted');
      fetchFeedback();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Feedback</h2>
      <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">User Feedback</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {feedbackList.map((fb) => (
              <tr key={fb.id} className="hover:bg-gray-800/50">
                <td className="p-3">{fb.id}</td>
                <td className="p-3">{fb.user_feedback?.slice(0, 60) || '—'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    fb.status === 'open' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'
                  }`}>
                    {fb.status}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  <button onClick={() => openDetail(fb)} className="text-blue-400 hover:text-blue-300">
                    <i className="fas fa-reply"></i>
                  </button>
                  <button onClick={() => handleDelete(fb.id)} className="text-red-400 hover:text-red-300">
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="bg-[#111827] p-6 rounded-xl border border-gray-800">
          <h3 className="font-bold mb-2">Feedback from Scan #{selected.result_id}</h3>
          <p className="text-gray-400 mb-4">{selected.user_feedback}</p>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Admin response..."
            rows={3}
            className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white mb-3"
          />
          <div className="flex gap-3">
            <button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Save & Resolve</button>
            <button onClick={() => setSelected(null)} className="bg-gray-700 px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
