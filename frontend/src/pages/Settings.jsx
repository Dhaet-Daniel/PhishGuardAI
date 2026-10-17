import { useEffect, useState } from 'react';
import { getMyFeatures, putApi, requestFeature } from '../services/api';
import toast from 'react-hot-toast';
import { jwtDecode as jwt_decode } from 'jwt-decode';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('API_BASE_URL') || 'http://localhost:8000');
  const [features, setFeatures] = useState(null);
  const [requestedFeatures, setRequestedFeatures] = useState({});

  const isAdmin = (() => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const decoded = jwt_decode(token);
      return decoded.role === 'admin';
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    getMyFeatures()
      .then((data) => setFeatures(data))
      .catch(() => toast.error('Failed to load feature flags'));
  }, []);

  const toggleFeature = async (flagName) => {
    if (!features || !isAdmin) return;
    const newVal = !features[flagName];

    try {
      await putApi('/settings/features', { [flagName]: newVal });
      setFeatures((prev) => ({ ...prev, [flagName]: newVal }));
      toast.success(`${flagName} ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRequestFeature = async (featureName) => {
    try {
      await requestFeature(featureName);
      setRequestedFeatures((prev) => ({ ...prev, [featureName]: true }));
      toast.success('Request sent to admin');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveApiUrl = () => {
    localStorage.setItem('API_BASE_URL', apiUrl);
    toast.success('API URL saved');
  };

  const featureList = [
    { key: 'ENABLE_SPACY', label: 'spaCy NLP', desc: 'Text preprocessing and lemmatization' },
    { key: 'ENABLE_TRANSFORMERS', label: 'Transformer ML (BART)', desc: 'AI-powered zero-shot classification' },
    { key: 'ENABLE_WHOIS', label: 'WHOIS Domain Analysis', desc: 'Domain age verification (requires internet)' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">System Configuration</h2>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-4">API Connection</h3>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Backend Base URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={saveApiUrl}
              className="bg-teal-600 hover:bg-teal-700 px-6 py-2 rounded-lg text-white font-medium transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-4">Feature Environment Indicators</h3>
        {!features ? (
          <p className="text-sm text-slate-500">Loading features...</p>
        ) : (
          <div className="space-y-4">
            {featureList.map((feat) => (
              <div key={feat.key} className="flex items-center justify-between bg-slate-900 p-4 rounded-lg">
                <div>
                  <p className="text-white font-medium">{feat.label}</p>
                  <p className="text-xs text-slate-400">{feat.desc}</p>
                  {!isAdmin && !features[feat.key] && !requestedFeatures[feat.key] && (
                    <button
                      onClick={() => handleRequestFeature(feat.key)}
                      className="text-xs text-blue-400 hover:text-blue-300 underline mt-1"
                    >
                      Request Admin to Enable
                    </button>
                  )}
                  {!isAdmin && requestedFeatures[feat.key] && (
                    <p className="text-xs text-green-400 mt-1">Requested</p>
                  )}
                </div>
                <button
                  onClick={() => toggleFeature(feat.key)}
                  disabled={!isAdmin}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                    features[feat.key] ? 'bg-green-600' : 'bg-slate-600'
                  } ${!isAdmin && 'opacity-50 cursor-not-allowed'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                      features[feat.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
            {!isAdmin && (
              <p className="text-xs text-yellow-500 mt-2">Only admins can toggle features.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
