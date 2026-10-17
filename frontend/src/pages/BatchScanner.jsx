import { useState } from 'react';
import { toast } from 'react-hot-toast';
import ResultPanel from '../components/ResultPanel';
import CollapsibleSection from '../components/CollapsibleSection';
import {
  AttachmentsEditor,
  EmailModeSelector,
  FieldError,
  HeadersEditor,
  LinksEditor,
  SenderDetailsFields,
} from '../components/EmailFormSections';
import {
  sharedInputClassName,
  sharedTextAreaClassName,
} from '../components/emailFieldStyles';
import { batchScanEmails } from '../services/api';
import {
  countByPrediction,
  formatPercent,
  formatScore,
  getPredictionTone,
} from '../utils/analysis';
import {
  buildEmailPayload,
  createAttachment,
  createEmailForm,
  createEmptyValidationState,
  createHeader,
  createLink,
  EMAIL_INPUT_MODES,
  filterMeaningfulAttachments,
  filterMeaningfulHeaders,
  filterMeaningfulLinks,
  hasValidationErrors,
  mapValidationIssuesToBatchErrors,
  validateEmailForm,
} from '../utils/emailContract';

const MAX_BATCH_SIZE = 10;

const createBatchEmail = () =>
  createEmailForm({
    showDetails: false,
  });

const rowHasContent = (email) =>
  [
    email.sender,
    email.subject,
    email.body,
    email.body_text,
    email.body_html,
    email.raw_email,
    email.display_name,
    email.reply_to,
    email.return_path,
  ].some((value) => value.trim().length > 0) ||
  filterMeaningfulHeaders(email.headers).length > 0 ||
  filterMeaningfulLinks(email.links).length > 0 ||
  filterMeaningfulAttachments(email.attachments).length > 0;

export default function BatchScanner() {
  const initialEmails = [createBatchEmail(), createBatchEmail()];
  const [emails, setEmails] = useState(initialEmails);
  const [rowErrors, setRowErrors] = useState(initialEmails.map(createEmptyValidationState));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [submittedRows, setSubmittedRows] = useState([]);

  const resetErrors = (nextEmails) => {
    setRowErrors(nextEmails.map((email) => createEmptyValidationState(email)));
  };

  const updateEmails = (updater) => {
    setEmails((current) => {
      const nextEmails = updater(current);
      resetErrors(nextEmails);
      return nextEmails;
    });
  };

  const updateEmail = (index, field, value) => {
    updateEmails((current) =>
      current.map((email, emailIndex) =>
        emailIndex === index ? { ...email, [field]: value } : email
      )
    );
  };

  const updateCollectionItem = (emailIndex, collection, index, field, value) => {
    updateEmails((current) =>
      current.map((email, rowIndex) =>
        rowIndex === emailIndex
          ? {
              ...email,
              [collection]: email[collection].map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item
              ),
            }
          : email
      )
    );
  };

  const addCollectionItem = (emailIndex, collection, factory) => {
    updateEmails((current) =>
      current.map((email, rowIndex) =>
        rowIndex === emailIndex
          ? {
              ...email,
              [collection]: [...email[collection], factory()],
            }
          : email
      )
    );
  };

  const removeCollectionItem = (emailIndex, collection, index) => {
    updateEmails((current) =>
      current.map((email, rowIndex) =>
        rowIndex === emailIndex
          ? {
              ...email,
              [collection]: email[collection].filter((_, itemIndex) => itemIndex !== index),
            }
          : email
      )
    );
  };

  const addEmail = () => {
    if (emails.length >= MAX_BATCH_SIZE) {
      toast.error(`Batch limit is ${MAX_BATCH_SIZE} emails per run.`);
      return;
    }

    updateEmails((current) => [...current, createBatchEmail()]);
  };

  const removeEmail = (index) => {
    updateEmails((current) => current.filter((_, emailIndex) => emailIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const populatedEmails = [];
    const populatedIndexes = [];
    const nextErrors = emails.map((email) => createEmptyValidationState(email));

    emails.forEach((email, index) => {
      if (!rowHasContent(email)) {
        return;
      }

      populatedEmails.push(email);
      populatedIndexes.push(index);

      const validationErrors = validateEmailForm(email);
      if (hasValidationErrors(validationErrors)) {
        nextErrors[index] = validationErrors;
      }
    });

    if (populatedEmails.length === 0) {
      toast.error('Add at least one email to scan.');
      setRowErrors(nextErrors);
      return;
    }

    const hasAnyRowErrors = nextErrors.some((error) => hasValidationErrors(error));
    if (hasAnyRowErrors) {
      setRowErrors(nextErrors);
      toast.error('Fix the highlighted rows before running the batch scan.');
      return;
    }

    const payload = populatedEmails.map(buildEmailPayload);

    setLoading(true);
    setResults([]);
    setSelectedIndex(null);
    setSubmittedRows([]);

    try {
      const response = await batchScanEmails(payload);
      setResults(response);
      setSubmittedRows(populatedEmails);
      setSelectedIndex(response.length ? 0 : null);
      setRowErrors(emails.map((email) => createEmptyValidationState(email)));
      toast.success(`Batch analysis completed for ${response.length} emails.`);
    } catch (error) {
      if (error.status === 422 && error.validationIssues?.length) {
        const submittedErrors = mapValidationIssuesToBatchErrors(error.validationIssues, populatedEmails);
        const mergedErrors = emails.map((email) => createEmptyValidationState(email));

        submittedErrors.forEach((rowError, submittedIndex) => {
          const originalIndex = populatedIndexes[submittedIndex];
          mergedErrors[originalIndex] = rowError;
        });

        setRowErrors(mergedErrors);
      }

      toast.error(error.message || 'Batch analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const safeCount = countByPrediction(results, 'safe');
  const suspiciousCount = countByPrediction(results, 'suspicious');
  const phishingCount = countByPrediction(results, 'phishing');
  const selectedResult = selectedIndex === null ? null : results[selectedIndex];
  const batchCountMismatch =
    submittedRows.length > 0 && results.length > 0 && submittedRows.length !== results.length;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Batch Scanner</h1>
            <p className="mt-2 text-sm text-slate-400">
              Submit up to {MAX_BATCH_SIZE} emails at once using the same Quick, Structured, and
              Raw contract that the backend already supports.
            </p>
          </div>
          <button
            type="button"
            onClick={addEmail}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
          >
            Add Email
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {emails.map((email, index) => (
            <div
              key={`batch-email-${index}`}
              className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Email {index + 1}</h2>
                  <p className="text-sm text-slate-400">
                    Pick the row mode first, then fill only the fields that mode requires.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeEmail(index)}
                  disabled={emails.length === 1}
                  className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>

              <EmailModeSelector
                value={email.mode}
                onChange={(mode) => updateEmail(index, 'mode', mode)}
                namePrefix={`batch-email-${index}`}
              />

              {rowErrors[index]?.form && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {rowErrors[index].form}
                </div>
              )}

              {email.mode === EMAIL_INPUT_MODES.QUICK && (
                <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-400">
                        Sender Email *
                      </label>
                      <input
                        type="email"
                        className={sharedInputClassName}
                        value={email.sender}
                        onChange={(event) => updateEmail(index, 'sender', event.target.value)}
                      />
                      <FieldError message={rowErrors[index]?.sender} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-400">
                        Subject *
                      </label>
                      <input
                        type="text"
                        className={sharedInputClassName}
                        value={email.subject}
                        onChange={(event) => updateEmail(index, 'subject', event.target.value)}
                      />
                      <FieldError message={rowErrors[index]?.subject} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">Body *</label>
                    <textarea
                      rows="6"
                      className={sharedTextAreaClassName}
                      value={email.body}
                      onChange={(event) => updateEmail(index, 'body', event.target.value)}
                    ></textarea>
                    <FieldError message={rowErrors[index]?.body} />
                  </div>
                </div>
              )}

              {email.mode === EMAIL_INPUT_MODES.STRUCTURED && (
                <>
                  <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-400">
                          Sender Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          className={sharedInputClassName}
                          value={email.sender}
                          onChange={(event) => updateEmail(index, 'sender', event.target.value)}
                          placeholder="sender@example.com"
                        />
                        <FieldError message={rowErrors[index]?.sender} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-400">
                          Subject <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          className={sharedInputClassName}
                          value={email.subject}
                          onChange={(event) => updateEmail(index, 'subject', event.target.value)}
                          placeholder="Email subject line"
                        />
                        <FieldError message={rowErrors[index]?.subject} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-400">
                          Body Text <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          rows="5"
                          className={sharedTextAreaClassName}
                          value={email.body_text}
                          onChange={(event) => updateEmail(index, 'body_text', event.target.value)}
                          placeholder="Plain text email body"
                        ></textarea>
                        <FieldError message={rowErrors[index]?.body_text} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-400">
                          Body HTML
                        </label>
                        <textarea
                          rows="5"
                          className={sharedTextAreaClassName}
                          value={email.body_html}
                          onChange={(event) => updateEmail(index, 'body_html', event.target.value)}
                          placeholder="HTML email body"
                        ></textarea>
                        <FieldError message={rowErrors[index]?.body_html} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/30 rounded-lg border border-slate-700">
                    <input
                      type="checkbox"
                      id={`showAdvanced-${index}`}
                      checked={email.showDetails}
                      onChange={(e) => updateEmail(index, 'showDetails', e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <label htmlFor={`showAdvanced-${index}`} className="text-sm font-medium text-slate-300 cursor-pointer">
                      I have additional details (sender info, headers, links, attachments)
                    </label>
                  </div>

                  {email.showDetails && (
                    <div className="space-y-4">
                      <CollapsibleSection
                        title="Sender Details"
                        tooltip="Mismatched reply-to or return-path can indicate spoofing."
                      >
                        <SenderDetailsFields
                          email={email}
                          errors={rowErrors[index] || {}}
                          onChange={(field, value) => updateEmail(index, field, value)}
                        />
                      </CollapsibleSection>

                      <CollapsibleSection
                        title="Authentication Headers"
                        tooltip="SPF/DKIM/DMARC results determine email trustworthiness."
                      >
                        <HeadersEditor
                          headers={email.headers}
                          errors={rowErrors[index]?.headers}
                          onChange={(itemIndex, field, value) =>
                            updateCollectionItem(index, 'headers', itemIndex, field, value)
                          }
                          onAdd={() => addCollectionItem(index, 'headers', createHeader)}
                          onRemove={(itemIndex) => removeCollectionItem(index, 'headers', itemIndex)}
                          title=""
                          description=""
                        />
                      </CollapsibleSection>

                      <CollapsibleSection
                        title="Links & URLs"
                        tooltip="Suspicious links, shorteners, and new domains increase risk."
                      >
                        <LinksEditor
                          links={email.links}
                          errors={rowErrors[index]?.links}
                          onChange={(itemIndex, field, value) =>
                            updateCollectionItem(index, 'links', itemIndex, field, value)
                          }
                          onAdd={() => addCollectionItem(index, 'links', createLink)}
                          onRemove={(itemIndex) => removeCollectionItem(index, 'links', itemIndex)}
                          title=""
                          description=""
                        />
                      </CollapsibleSection>

                      <CollapsibleSection
                        title="Attachments"
                        tooltip="Double extensions, macros, or password-protected files are common in phishing."
                      >
                        <AttachmentsEditor
                          attachments={email.attachments}
                          errors={rowErrors[index]?.attachments}
                          onChange={(itemIndex, field, value) =>
                            updateCollectionItem(index, 'attachments', itemIndex, field, value)
                          }
                          onAdd={() => addCollectionItem(index, 'attachments', createAttachment)}
                          onRemove={(itemIndex) =>
                            removeCollectionItem(index, 'attachments', itemIndex)
                          }
                          title=""
                          description=""
                        />
                      </CollapsibleSection>
                    </div>
                  )}
                </>
              )}

              {email.mode === EMAIL_INPUT_MODES.RAW && (
                <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">
                      Raw Email / RFC822 Source *
                    </label>
                    <textarea
                      rows="8"
                      className={sharedTextAreaClassName}
                      value={email.raw_email}
                      onChange={(event) => updateEmail(index, 'raw_email', event.target.value)}
                    ></textarea>
                    <FieldError message={rowErrors[index]?.raw_email} />
                    <p className="mt-2 text-xs text-slate-500">
                      Raw mode sends only the pasted message source for this row.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing Batch...' : 'Run Batch Scan'}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Processed</p>
              <p className="text-3xl font-bold text-white">{results.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-900/30 bg-slate-800 p-5">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Safe</p>
              <p className="text-3xl font-bold text-emerald-300">{safeCount}</p>
            </div>
            <div className="rounded-xl border border-amber-900/30 bg-slate-800 p-5">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Suspicious</p>
              <p className="text-3xl font-bold text-amber-300">{suspiciousCount}</p>
            </div>
            <div className="rounded-xl border border-red-900/30 bg-slate-800 p-5">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Phishing</p>
              <p className="text-3xl font-bold text-red-300">{phishingCount}</p>
            </div>
          </div>

          {batchCountMismatch && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              The backend returned {results.length} results for {submittedRows.length} submitted
              emails. The table below maps rows by returned order, so double-check any mismatch.
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
            <div className="border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Batch Results</h2>
              <p className="mt-1 text-sm text-slate-400">
                Select a row to inspect the full backend explanation below.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-900/80">
                  <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Sender</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Prediction</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => {
                    const submittedRow = submittedRows[index];

                    return (
                      <tr
                        key={`batch-result-${index}`}
                        onClick={() => setSelectedIndex(index)}
                        className={`cursor-pointer border-t border-slate-700 transition ${
                          selectedIndex === index ? 'bg-slate-700/50' : 'hover:bg-slate-900/70'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-slate-300">{index + 1}</td>
                        <td className="px-6 py-4 font-mono text-sm text-slate-300">
                          {result.sender || submittedRow?.sender || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {result.subject || submittedRow?.subject || 'No subject'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getPredictionTone(
                              result.prediction,
                              result.score
                            )}`}
                          >
                            {result.prediction || 'Derived'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {formatScore(result.score)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {formatPercent(result.confidence)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Selected Result Detail</h2>
              <p className="mt-1 text-sm text-slate-400">
                Deep view of the batch item you clicked above.
              </p>
            </div>
            <ResultPanel result={selectedResult} />
          </div>
        </>
      )}
    </div>
  );
}
