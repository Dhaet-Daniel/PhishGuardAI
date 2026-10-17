import { useEffect, useState } from 'react';
import { getApi, deleteApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminResults() {
  const [results, setResults] = useState([]);

  const fetchResults = () => getApi('/admin/results').then(setResults).catch(console.error);

  useEffect(() => { fetchResults(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this result?')) return;
    try {
      await deleteApi(`/admin/results/${id}`);
      toast.success('Result deleted');
      fetchResults();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Scan Results</h2>
      <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Subject</th>
              <th className="p-3 text-left">Sender</th>
              <th className="p-3 text-left">Score</th>
              <th className="p-3 text-left">Prediction</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {results.map((r) => (
              <tr key={r.record_id} className="hover:bg-gray-800/50">
                <td className="p-3">{r.record_id}</td>
                <td className="p-3">{r.subject || '—'}</td>
                <td className="p-3">{r.sender || '—'}</td>
                <td className="p-3">{Number(r.score ?? 0).toFixed(2)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    r.prediction === 'Phishing' ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
                  }`}>
                    {r.prediction}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => handleDelete(r.record_id)} className="text-red-400 hover:text-red-300">
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
