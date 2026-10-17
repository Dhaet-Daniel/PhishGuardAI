import { useEffect, useState } from 'react';
import { getApi, putApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminFeatureFlags() {
  const [features, setFeatures] = useState(null);
  const [saving, setSaving] = useState({});

  const fetchFeatures = () => {
    getApi('/settings/features')
      .then(data => setFeatures(data))
      .catch(() => toast.error('Failed to load feature flags'));
  };

  useEffect(() => { fetchFeatures(); }, []);

  const toggleFeature = async (flagName) => {
    if (!features) return;
    const newVal = !features[flagName];
    setSaving(prev => ({ ...prev, [flagName]: true }));
    try {
      await putApi('/settings/features', { [flagName]: newVal });
      setFeatures(prev => ({ ...prev, [flagName]: newVal }));
      toast.success(`${flagName} ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(prev => ({ ...prev, [flagName]: false }));
    }
  };

  const featureList = [
    {
      key: 'ENABLE_SPACY',
      label: 'spaCy NLP',
      desc: 'Text preprocessing and lemmatization – improves keyword detection accuracy.',
    },
    {
      key: 'ENABLE_TRANSFORMERS',
      label: 'Transformer ML (BART)',
      desc: 'AI-powered zero-shot classification – adds 22% weighted ML scoring. Requires ~1 GB RAM.',
    },
    {
      key: 'ENABLE_WHOIS',
      label: 'WHOIS Domain Analysis',
      desc: 'Check domain registration age – flags newly created domains. Requires internet.',
    },
  ];

  if (!features) {
    return <div className="p-6 text-gray-400">Loading features…</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Feature Flags</h2>
      <p className="text-gray-400 text-sm mb-6">
        These settings affect all email scans system-wide. Toggle with care.
      </p>

      <div className="space-y-4">
        {featureList.map(feat => (
          <div key={feat.key} className="bg-[#111827] p-5 rounded-xl border border-gray-800 flex items-center justify-between">
            <div className="pr-4">
              <div className="text-white font-medium">{feat.label}</div>
              <div className="text-xs text-gray-400 mt-1">{feat.desc}</div>
            </div>
            <button
              onClick={() => toggleFeature(feat.key)}
              disabled={saving[feat.key]}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                features[feat.key] ? 'bg-green-600' : 'bg-gray-600'
              } ${saving[feat.key] ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                  features[feat.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
