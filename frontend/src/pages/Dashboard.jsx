import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApi, scanEmail } from '../services/api';
import { buildEmailPayload, createEmailForm } from '../utils/emailContract';
import {
  countByPrediction,
  formatScore,
  getPredictionColor,
  getRiskLabel,
  getRiskTone,
} from '../utils/analysis';
import VerdictBadge from '../components/VerdictBadge';

const MAX_RECORDS = 50; // server caps limit at 50
const DAY_MS = 86400000;
const EMPTY_FORM = { sender: '', subject: '', body: '' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const displayName = (email) => {
  const localPart = (email || '').split('@')[0].trim();
  if (!localPart) return 'there';
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
};

const formatWhen = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const validateQuickForm = (form) => {
  const errors = {};
  const sender = form.sender.trim();
  const subject = form.subject.trim();
  const body = form.body.trim();

  if (!sender) {
    errors.sender = 'Sender is required.';
  } else if (!EMAIL_PATTERN.test(sender)) {
    errors.sender = 'Enter a valid email address, e.g. alerts@company.com.';
  }

  if (!subject) errors.subject = 'Subject is required.';
  if (!body) errors.body = 'Paste the message you want to analyze.';

  return errors;
};

const buildDailyActivity = (records) => {
  const today = startOfDay(new Date());
  const buckets = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * DAY_MS);
    buckets.push({ key: date.getTime(), date, count: 0 });
  }

  const indexByDay = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  records.forEach((record) => {
    const parsed = new Date(record.timestamp);
    if (Number.isNaN(parsed.getTime())) return;
    const bucket = indexByDay.get(startOfDay(parsed).getTime());
    if (bucket) bucket.count += 1;
  });

  return buckets.map((bucket) => ({
    ...bucket,
    label: bucket.date.toLocaleDateString(undefined, { weekday: 'short' }),
  }));
};

function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-800/70 ${className}`} aria-hidden="true" />
  );
}

function StatCard({ label, value, hint, icon, tone }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-[#111827] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <i className={`fas ${icon} text-sm`} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{hint}</p>
    </div>
  );
}

function EmptyState({ title, description, actionLabel, actionTo, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-12'}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
        <i className="fas fa-shield-halved text-lg" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-gray-400">{description}</p>
      {actionTo && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <i className="fas fa-triangle-exclamation mt-0.5 text-red-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-red-200">Could not load your security data</p>
          <p className="mt-0.5 text-sm text-red-300/90">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-400/40 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-500/20 active:scale-[0.98]"
      >
        <i className="fas fa-rotate-right" aria-hidden="true" /> Retry
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const userEmail = localStorage.getItem('userEmail') || '';

  // Refresh key: bumped from event handlers (retry button, after a new scan).
  // The effect below re-fetches whenever it changes, so loading/error state is
  // only set synchronously inside event handlers — never inside the effect.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getApi(`/results/recent?limit=${MAX_RECORDS}`)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.results;
        setRecords(Array.isArray(list) ? list : []);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error.message || 'The analysis service did not respond.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = () => {
    setLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const stats = useMemo(() => {
    const total = records.length;
    const phishing = countByPrediction(records, 'phishing');
    const suspicious = countByPrediction(records, 'suspicious');
    const safe = countByPrediction(records, 'safe');
    const lastTs = records.reduce((newest, record) => {
      const parsed = Date.parse(record.timestamp || '');
      if (Number.isNaN(parsed)) return newest;
      return Math.max(newest, parsed);
    }, 0);
    return { total, phishing, suspicious, safe, lastTs };
  }, [records]);

  const daily = useMemo(() => buildDailyActivity(records), [records]);
  const maxDaily = useMemo(() => Math.max(...daily.map((day) => day.count), 1), [daily]);
  const dailyTotal = useMemo(() => daily.reduce((sum, day) => sum + day.count, 0), [daily]);

  const overviewText = useMemo(() => {
    if (loading) return 'Loading your recent security activity…';
    if (loadError) return 'Your security activity could not be loaded. Use retry to reload it.';
    if (stats.total === 0) {
      return 'No analyses yet. Submit a suspicious message and PhishGuard AI will score it, explain the verdict, and keep it in your history.';
    }
    const flagged = stats.phishing + stats.suspicious;
    const lastActivity = stats.lastTs ? `Last scan: ${formatWhen(stats.lastTs)}.` : '';
    return (
      `Across your last ${stats.total} ${stats.total === 1 ? 'analysis' : 'analyses'}, ` +
      `${flagged} ${flagged === 1 ? 'was' : 'were'} flagged as a potential threat ` +
      `(${stats.phishing} phishing, ${stats.suspicious} suspicious) and ${stats.safe} cleared as safe. ` +
      lastActivity
    );
  }, [loading, loadError, stats]);

  const distribution = useMemo(() => {
    const total = stats.total || 1;
    return [
      { key: 'phishing', label: 'Phishing', count: stats.phishing },
      { key: 'suspicious', label: 'Suspicious', count: stats.suspicious },
      { key: 'safe', label: 'Safe', count: stats.safe },
    ].map((entry) => ({
      ...entry,
      percent: Math.round((entry.count / total) * 100),
      color: getPredictionColor(entry.key),
    }));
  }, [stats]);

  const distributionSummary = useMemo(
    () =>
      `Verdict distribution: ${distribution
        .map((entry) => `${entry.label} ${entry.count}`)
        .join(', ')}.`,
    [distribution]
  );

  const activitySummary = useMemo(
    () =>
      `Scans per day over the last 7 days: ${daily
        .map((day) => `${day.label} ${day.count}`)
        .join(', ')}.`,
    [daily]
  );

  const recentRecords = useMemo(
    () =>
      [...records].sort((a, b) => {
        const left = Date.parse(a.timestamp || '') || 0;
        const right = Date.parse(b.timestamp || '') || 0;
        return right - left;
      }),
    [records]
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateQuickForm(form);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Fix the highlighted fields before scanning.');
      return;
    }

    setFieldErrors({});
    setScanError(null);
    setScanning(true);

    try {
      const payload = buildEmailPayload(createEmailForm(form));
      const data = await scanEmail(payload);
      setScanResult(data);
      toast.success('Analysis complete');
      refresh();
    } catch (error) {
      setScanError(error.message || 'Failed to analyze the message.');
      toast.error(error.message || 'Failed to analyze the message');
    } finally {
      setScanning(false);
    }
  };

  const resetWorkspace = () => {
    setScanResult(null);
    setScanError(null);
    setFieldErrors({});
    setForm(EMPTY_FORM);
  };

  const inputClassName = (hasError) =>
    `w-full min-h-11 rounded-lg border bg-gray-900/60 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
      hasError ? 'border-red-500/60' : 'border-gray-700 focus:border-blue-500/60'
    }`;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {loadError && !loading && <ErrorState message={loadError} onRetry={refresh} />}

      {/* Welcome + security overview */}
      <section className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Security overview
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              {greeting()}, {displayName(userEmail)}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{overviewText}</p>
          </div>
          <Link
            to="/app/scan"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98]"
          >
            <i className="fas fa-envelope-open-text" aria-hidden="true" />
            New email analysis
          </Link>
        </div>
      </section>

      {/* Security stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-800 bg-[#111827] p-5"
              aria-hidden="true"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-4 h-8 w-16" />
              <Skeleton className="mt-3 h-3 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {stats.total > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Emails analyzed"
                value={stats.total}
                hint="your recent analyses (last 50 records)"
                icon="fa-envelope-open-text"
                tone="bg-blue-500/10 text-blue-400"
              />
              <StatCard
                label="Threats detected"
                value={stats.phishing}
                hint="messages scored as phishing"
                icon="fa-triangle-exclamation"
                tone="bg-red-500/10 text-red-400"
              />
              <StatCard
                label="Suspicious"
                value={stats.suspicious}
                hint="needs a closer look"
                icon="fa-circle-question"
                tone="bg-amber-500/10 text-amber-400"
              />
              <StatCard
                label="Cleared safe"
                value={stats.safe}
                hint="no threat indicators found"
                icon="fa-circle-check"
                tone="bg-emerald-500/10 text-emerald-400"
              />
            </div>
          ) : !loadError ? (
            <div className="rounded-2xl border border-gray-800 bg-[#111827]">
              <EmptyState
                title="No analyses yet"
                description="Run your first scan to see threat statistics, verdict trends, and recent activity here."
                actionLabel="Start your first analysis"
                actionTo="/app/scan"
              />
            </div>
          ) : null}
        </>
      )}

      {/* Workspace + threat visualization */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Quick analysis workspace */}
        <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
          <h2 className="text-base font-semibold text-white">Quick analysis</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">
            Paste a suspicious message. Links and wording inside the body are analyzed together.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="quick-sender"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Sender email{' '}
                  <span className="text-red-400" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="quick-sender"
                  type="email"
                  autoComplete="email"
                  value={form.sender}
                  onChange={(event) => updateField('sender', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.sender)}
                  aria-describedby={fieldErrors.sender ? 'quick-sender-error' : undefined}
                  className={inputClassName(Boolean(fieldErrors.sender))}
                  placeholder="alerts@company.com"
                />
                {fieldErrors.sender && (
                  <p id="quick-sender-error" className="mt-1.5 text-xs text-red-300">
                    {fieldErrors.sender}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="quick-subject"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Subject{' '}
                  <span className="text-red-400" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="quick-subject"
                  type="text"
                  value={form.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.subject)}
                  aria-describedby={fieldErrors.subject ? 'quick-subject-error' : undefined}
                  className={inputClassName(Boolean(fieldErrors.subject))}
                  placeholder="Urgent: verify your account"
                />
                {fieldErrors.subject && (
                  <p id="quick-subject-error" className="mt-1.5 text-xs text-red-300">
                    {fieldErrors.subject}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="quick-body"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Message{' '}
                <span className="text-red-400" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id="quick-body"
                rows={4}
                value={form.body}
                onChange={(event) => updateField('body', event.target.value)}
                aria-invalid={Boolean(fieldErrors.body)}
                aria-describedby={fieldErrors.body ? 'quick-body-error' : 'quick-body-hint'}
                className={`${inputClassName(Boolean(fieldErrors.body))} min-h-[7rem] resize-y font-mono text-[13px] leading-relaxed`}
                placeholder="Paste the email text here…"
              />
              {fieldErrors.body ? (
                <p id="quick-body-error" className="mt-1.5 text-xs text-red-300">
                  {fieldErrors.body}
                </p>
              ) : (
                <p id="quick-body-hint" className="mt-1.5 text-xs text-gray-500">
                  For full headers, links, and attachments, use the{' '}
                  <Link to="/app/scan" className="text-blue-400 underline-offset-2 hover:underline">
                    Email Scanner
                  </Link>
                  .
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={scanning}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {scanning ? (
                  <>
                    <i className="fas fa-spinner fa-spin" aria-hidden="true" /> Analyzing…
                  </>
                ) : (
                  <>
                    <i className="fas fa-shield-halved" aria-hidden="true" /> Analyze message
                  </>
                )}
              </button>
            </div>
          </form>

          {scanError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              <i className="fas fa-circle-exclamation mt-0.5" aria-hidden="true" />
              <span>{scanError}</span>
            </div>
          )}

          {scanResult && (
            <div
              className="mt-5 rounded-xl border border-gray-700 bg-gray-900/50 p-5"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <VerdictBadge prediction={scanResult.prediction} score={scanResult.score} />
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${getRiskTone(
                        scanResult.risk_level,
                        scanResult.score
                      )}`}
                    >
                      {getRiskLabel(scanResult.risk_level, scanResult.score)} risk
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-gray-300">
                    {scanResult.summary}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: getPredictionColor(scanResult.prediction, scanResult.score) }}
                  >
                    {formatScore(scanResult.score)}
                    <span className="text-sm font-medium text-gray-500">/100</span>
                  </p>
                  <p className="text-xs text-gray-500">risk score</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/app/history"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-gray-800 active:scale-[0.98]"
                >
                  View full report
                </Link>
                <button
                  type="button"
                  onClick={resetWorkspace}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-gray-800 hover:text-white active:scale-[0.98]"
                >
                  Analyze another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Threat visualization — only shown once data exists (or is loading) */}
        {(loading || stats.total > 0) && (
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
          <h2 className="text-base font-semibold text-white">Threat overview</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">
            Verdicts and daily activity from your own scan history.
          </p>

          {loading ? (
            <div className="mt-5 space-y-4" aria-hidden="true">
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
          ) : stats.total === 0 ? (
            <div className="mt-2">
              <EmptyState
                compact
                title="Nothing to visualize yet"
                description="Verdict trends and daily activity appear here once you have completed at least one analysis."
                actionLabel="Run an analysis"
                actionTo="/app/scan"
              />
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Verdict distribution
              </p>
              <div
                className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-gray-800"
                role="img"
                aria-label={distributionSummary}
              >
                {distribution
                  .filter((entry) => entry.count > 0)
                  .map((entry) => (
                    <span
                      key={entry.key}
                      className="h-full"
                      style={{ width: `${entry.percent}%`, backgroundColor: entry.color }}
                    />
                  ))}
              </div>
              <ul className="mt-3 space-y-2">
                {distribution.map((entry) => (
                  <li key={entry.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-300">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                        aria-hidden="true"
                      />
                      {entry.label}
                    </span>
                    <span className="tabular-nums text-gray-400">
                      {entry.count}
                      <span className="ml-1.5 text-gray-500">({entry.percent}%)</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-gray-800 pt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Last 7 days
                  </p>
                  <p className="text-xs tabular-nums text-gray-500">{dailyTotal} scans</p>
                </div>
                <div
                  className="mt-3 flex h-40 items-end gap-1.5"
                  role="img"
                  aria-label={activitySummary}
                >                  {daily.map((day) => {
                    const height =
                      day.count > 0 ? Math.max((day.count / maxDaily) * 100, 8) : 3;
                    return (
                      <div key={day.key} className="flex flex-1 flex-col items-center gap-1">
                        <span className="h-4 text-[10px] font-medium tabular-nums text-gray-400">
                          {day.count > 0 ? day.count : ''}
                        </span>
                        <div className="flex w-full items-end" style={{ height: '6.5rem' }}>
                          <div
                            className={`w-full rounded-t-sm transition-[height] duration-300 ease-out ${
                              day.count > 0 ? 'bg-blue-500/80' : 'bg-gray-700/70'
                            }`}
                            style={{ height: `${height}%` }}
                            title={`${day.label}: ${day.count} ${
                              day.count === 1 ? 'scan' : 'scans'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500">{day.label}</span>
                      </div>
                    );
                  })}
                </div>
                {dailyTotal === 0 && (
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">
                    No scans in the last 7 days — activity appears here the day after an
                    analysis.
                  </p>
                )}
              </div>
            </div>
          )}
          </div>
        )}
      </section>

      {/* Recent activity — hidden until there is something to show */}
      {(loading || stats.total > 0) && (
      <section className="rounded-2xl border border-gray-800 bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Recent activity</h2>
            <p className="text-xs text-gray-500">
              Your latest {Math.min(5, stats.total)} {stats.total === 1 ? 'analysis' : 'analyses'}
            </p>
          </div>
          <Link
            to="/app/history"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-400 transition hover:bg-gray-800 hover:text-blue-300 active:scale-[0.98]"
          >
            View all history
            <i className="fas fa-arrow-right text-xs" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-6" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : stats.total === 0 ? (
          <EmptyState
            compact
            title="No activity yet"
            description="Completed analyses appear here with their verdict, score, and timestamp."
            actionLabel="Run an analysis"
            actionTo="/app/scan"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/60 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Subject
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Sender
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Verdict
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Score
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    When
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentRecords.slice(0, 5).map((record) => {
                  const id = record.record_id ?? record.id;
                  return (
                    <tr key={id ?? `${record.subject}-${record.timestamp}`}>
                      <td className="max-w-[16rem] truncate px-4 py-3 text-gray-200">
                        <span title={record.subject || 'Untitled message'}>
                          {record.subject || 'Untitled message'}
                        </span>
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-3 text-gray-400">
                        <span title={record.sender || '—'}>{record.sender || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <VerdictBadge prediction={record.prediction} score={record.score} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-300">
                        {formatScore(record.score)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                        {formatWhen(record.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}
    </div>
  );
}
