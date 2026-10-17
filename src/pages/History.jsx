import { useEffect, useState } from 'react';
import { getApi } from '../services/api';
import ResultPanel from '../components/ResultPanel';
import toast from 'react-hot-toast';

// Safe date formatter – returns "—" if the value is missing or invalid
function formatDate(dateValue) {
  if (!dateValue) return '—';
  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export default function History() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getApi('/results/recent?limit=20')
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data.results;
        setResults(list);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewDetail = (id) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetailData(null);
    setDetailError(null);
    setLoadingDetail(true);

    getApi(`/results/${id}`)
      .then((data) => setDetailData(data))
      .catch((err) => setDetailError(err.message))
      .finally(() => setLoadingDetail(false));
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetailData(null);
    setDetailError(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Scan History</h2>

      {/* Table */}
      <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-gray-400">Loading history...</div>
        ) : results.length === 0 ? (
          <div className="p-6 text-gray-400">No scans yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Sender</th>
                <th className="p-3 text-left">Score</th>
                <th className="p-3 text-left">Prediction</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {results.map((item) => (
                <tr
                  key={item.record_id || item.id}
                  onClick={() => handleViewDetail(item.record_id || item.id)}
                  className={`cursor-pointer hover:bg-gray-800/50 ${
                    selectedId === (item.record_id || item.id) ? 'bg-blue-900/20' : ''
                  }`}
                >
                  <td className="p-3">{item.subject || '—'}</td>
                  <td className="p-3">{item.sender}</td>
                  <td className="p-3">{item.score?.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.prediction === 'Phishing' ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
                    }`}>
                      {item.prediction}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">{formatDate(item.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Panel */}
      {selectedId && (
        <div className="bg-[#111827] rounded-xl border border-gray-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Selected Record Detail</h3>
            <button onClick={closeDetail} className="text-gray-400 hover:text-white">
              <i className="fas fa-times"></i>
            </button>
          </div>
          {loadingDetail && (
            <div className="text-gray-400 flex items-center gap-2">
              <i className="fas fa-spinner fa-spin"></i> Loading selected result...
            </div>
          )}
          {detailError && (
            <div className="text-red-400 bg-red-900/20 p-3 rounded-lg">
              Error: {detailError}
              <button onClick={() => handleViewDetail(selectedId)} className="ml-2 text-red-300 underline">Retry</button>
            </div>
          )}
          {detailData && <ResultPanel result={detailData} />}
        </div>
      )}
    </div>
  );
}
