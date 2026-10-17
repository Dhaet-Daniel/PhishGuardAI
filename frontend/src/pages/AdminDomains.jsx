import { useEffect, useState } from 'react';
import { getApi, postApi, deleteApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDomains() {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');

  const fetchDomains = () => getApi('/admin/trusted-domains').then(setDomains).catch(console.error);

  useEffect(() => { fetchDomains(); }, []);

  const handleAdd = async () => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    try {
      await postApi('/admin/trusted-domains', { domain });
      toast.success('Domain added');
      setNewDomain('');
      fetchDomains();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this domain?')) return;
    try {
      await deleteApi(`/admin/trusted-domains/${id}`);
      toast.success('Domain removed');
      fetchDomains();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Trusted Domains (Auto‑Approval)</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="company.co.ke"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
        <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Add</button>
      </div>
      <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-3 text-left">Domain</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {domains.length === 0 && (
              <tr><td colSpan={2} className="p-4 text-gray-500 text-center">No trusted domains yet.</td></tr>
            )}
            {domains.map((d) => (
              <tr key={d.id} className="hover:bg-gray-800/50">
                <td className="p-3">{d.domain}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-300">
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
