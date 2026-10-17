import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { scanEmail } from '../services/api';
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
import {
  buildEmailPayload,
  createAttachment,
  createEmailForm,
  createEmptyValidationState,
  createHeader,
  createLink,
  EMAIL_INPUT_MODES,
  hasValidationErrors,
  mapValidationIssuesToSingleErrors,
  validateEmailForm,
} from '../utils/emailContract';

export default function Scanner() {
  const [formData, setFormData] = useState(createEmailForm());
  const [fieldErrors, setFieldErrors] = useState(createEmptyValidationState(createEmailForm()));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const resetErrors = (nextForm) => {
    setFieldErrors(createEmptyValidationState(nextForm));
  };

  const updateField = (field, value) => {
    setFormData((current) => {
      const nextForm = { ...current, [field]: value };
      resetErrors(nextForm);
      return nextForm;
    });
  };

  const updateCollectionItem = (collection, index, field, value) => {
    setFormData((current) => {
      const nextForm = {
        ...current,
        [collection]: current[collection].map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      };
      resetErrors(nextForm);
      return nextForm;
    });
  };

  const addCollectionItem = (collection, factory) => {
    setFormData((current) => {
      const nextForm = {
        ...current,
        [collection]: [...current[collection], factory()],
      };
      resetErrors(nextForm);
      return nextForm;
    });
  };

  const removeCollectionItem = (collection, index) => {
    setFormData((current) => {
      const nextForm = {
        ...current,
        [collection]: current[collection].filter((_, itemIndex) => itemIndex !== index),
      };
      resetErrors(nextForm);
      return nextForm;
    });
  };

  const handleModeChange = (mode) => {
    setFormData((current) => {
      const nextForm = { ...current, mode };
      resetErrors(nextForm);
      return nextForm;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateEmailForm(formData);
    if (hasValidationErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      toast.error('Fix the highlighted fields before scanning.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = buildEmailPayload(formData);
      const data = await scanEmail(payload);
      setResult(data);
      setFieldErrors(createEmptyValidationState(formData));
      toast.success('Analysis complete');
    } catch (error) {
      if (error.status === 422 && error.validationIssues?.length) {
        setFieldErrors(
          mapValidationIssuesToSingleErrors(
            error.validationIssues,
            createEmptyValidationState(formData)
          )
        );
      }
      toast.error(error.message || 'Failed to scan email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h2 className="mb-4 text-2xl font-bold text-white">Single Email Scanner</h2>
        <p className="mb-6 text-sm text-slate-400">
          Choose the same input shape the backend expects so the form stays consistent with the
          scanner API and catches invalid combinations before submit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Input Mode</h3>
              <p className="text-sm text-slate-400">
                Quick mode is the beginner path, Structured mode exposes the full schema, and Raw
                mode sends only the pasted message source.
              </p>
            </div>
            <EmailModeSelector value={formData.mode} onChange={handleModeChange} />
          </div>

          {fieldErrors.form && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {fieldErrors.form}
            </div>
          )}

          {formData.mode === EMAIL_INPUT_MODES.QUICK && (
            <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-400">
                    Sender Email *
                  </label>
                  <input
                    type="email"
                    className={sharedInputClassName}
                    value={formData.sender}
                    onChange={(event) => updateField('sender', event.target.value)}
                  />
                  <FieldError message={fieldErrors.sender} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-400">Subject *</label>
                  <input
                    type="text"
                    className={sharedInputClassName}
                    value={formData.subject}
                    onChange={(event) => updateField('subject', event.target.value)}
                  />
                  <FieldError message={fieldErrors.subject} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Body *</label>
                <textarea
                  rows="8"
                  className={sharedTextAreaClassName}
                  value={formData.body}
                  onChange={(event) => updateField('body', event.target.value)}
                ></textarea>
                <FieldError message={fieldErrors.body} />
              </div>
            </div>
          )}

          {formData.mode === EMAIL_INPUT_MODES.STRUCTURED && (
            <>
              <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">
                      Sender Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      className={sharedInputClassName}
                      value={formData.sender}
                      onChange={(event) => updateField('sender', event.target.value)}
                      placeholder="sender@example.com"
                    />
                    <FieldError message={fieldErrors.sender} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={sharedInputClassName}
                      value={formData.subject}
                      onChange={(event) => updateField('subject', event.target.value)}
                      placeholder="Email subject line"
                    />
                    <FieldError message={fieldErrors.subject} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">
                      Email Body (Text) <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows="6"
                      className={sharedTextAreaClassName}
                      value={formData.body_text}
                      onChange={(event) => updateField('body_text', event.target.value)}
                      placeholder="Plain text email body"
                    ></textarea>
                    <FieldError message={fieldErrors.body_text} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">
                      Email Body (HTML)
                    </label>
                    <textarea
                      rows="6"
                      className={sharedTextAreaClassName}
                      value={formData.body_html}
                      onChange={(event) => updateField('body_html', event.target.value)}
                      placeholder="HTML email body"
                    ></textarea>
                    <FieldError message={fieldErrors.body_html} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/30 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  id="showAdvanced"
                  checked={showAdvancedFields}
                  onChange={(e) => setShowAdvancedFields(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="showAdvanced" className="text-sm font-medium text-slate-300 cursor-pointer">
                  I have additional details (sender info, headers, links, attachments)
                </label>
              </div>

              {showAdvancedFields && (
                <div className="space-y-4">
                  <CollapsibleSection
                    title="Sender Details"
                    tooltip="Mismatched reply-to or return-path can indicate spoofing."
                  >
                    <SenderDetailsFields
                      email={formData}
                      errors={fieldErrors}
                      onChange={updateField}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Authentication Headers"
                    tooltip="SPF/DKIM/DMARC results determine email trustworthiness."
                  >
                    <HeadersEditor
                      headers={formData.headers}
                      errors={fieldErrors.headers}
                      onChange={(index, field, value) => updateCollectionItem('headers', index, field, value)}
                      onAdd={() => addCollectionItem('headers', createHeader)}
                      onRemove={(index) => removeCollectionItem('headers', index)}
                      title=""
                      description=""
                    />
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Links & URLs"
                    tooltip="Suspicious links, shorteners, and new domains increase risk."
                  >
                    <LinksEditor
                      links={formData.links}
                      errors={fieldErrors.links}
                      onChange={(index, field, value) => updateCollectionItem('links', index, field, value)}
                      onAdd={() => addCollectionItem('links', createLink)}
                      onRemove={(index) => removeCollectionItem('links', index)}
                      title=""
                      description=""
                    />
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Attachments"
                    tooltip="Double extensions, macros, or password-protected files are common in phishing."
                  >
                    <AttachmentsEditor
                      attachments={formData.attachments}
                      errors={fieldErrors.attachments}
                      onChange={(index, field, value) =>
                        updateCollectionItem('attachments', index, field, value)
                      }
                      onAdd={() => addCollectionItem('attachments', createAttachment)}
                      onRemove={(index) => removeCollectionItem('attachments', index)}
                      title=""
                      description=""
                    />
                  </CollapsibleSection>
                </div>
              )}
            </>
          )}

          {formData.mode === EMAIL_INPUT_MODES.RAW && (
            <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Raw Email / RFC822 Source *
                </label>
                <textarea
                  rows="12"
                  className={sharedTextAreaClassName}
                  value={formData.raw_email}
                  onChange={(event) => updateField('raw_email', event.target.value)}
                  placeholder={'From: sender@example.com\nSubject: Verify your account\n\nMessage body...'}
                ></textarea>
                <FieldError message={fieldErrors.raw_email} />
                <p className="mt-2 text-xs text-slate-500">
                  Raw mode sends only the pasted message source so the backend can extract sender,
                  subject, and body directly.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing Layers...' : 'Scan Email'}
          </button>
        </form>
      </div>

      <ResultPanel result={result} />
    </div>
  );
}
