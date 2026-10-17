import { EMAIL_MODE_OPTIONS } from '../utils/emailContract';
import { sharedInputClassName, sharedTextAreaClassName } from './emailFieldStyles';

export function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs text-red-300">{message}</p>;
}

export function EmailModeSelector({ value, onChange, namePrefix = 'email-mode' }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {EMAIL_MODE_OPTIONS.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500'
              }`}
              aria-pressed={active}
              aria-label={`${namePrefix}-${option.value}`}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-1 text-xs text-slate-400">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SenderDetailsFields({ email, errors = {}, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-400">Display Name</label>
        <input
          type="text"
          className={sharedInputClassName}
          value={email.display_name}
          onChange={(event) => onChange('display_name', event.target.value)}
          placeholder="e.g., HR Payroll Team"
        />
        <FieldError message={errors.display_name} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-400">Reply-To</label>
        <input
          type="email"
          className={sharedInputClassName}
          value={email.reply_to}
          onChange={(event) => onChange('reply_to', event.target.value)}
          placeholder="e.g., reply@company.com"
        />
        <FieldError message={errors.reply_to} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-400">Return-Path</label>
        <input
          type="email"
          className={sharedInputClassName}
          value={email.return_path}
          onChange={(event) => onChange('return_path', event.target.value)}
          placeholder="e.g., bounce@company.com"
        />
        <FieldError message={errors.return_path} />
      </div>
    </div>
  );
}

export function HeadersEditor({
  headers,
  errors = [],
  onChange,
  onAdd,
  onRemove,
  title,
  description,
}) {
  return (
    <div className={title ? 'space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-5' : ''}>
      {title && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="text-sm text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
          >
            Add Header
          </button>
        </div>
      )}

      <div className={`space-y-4 ${title ? '' : 'rounded-xl border border-slate-700 bg-slate-900/60 p-5'}`}>
        <div className={!title ? 'flex items-center justify-between gap-3 mb-4' : ''}>
          {!title && (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
            >
              Add Header
            </button>
          )}
        </div>

        {headers.map((header, index) => (
          <div key={`header-${index}`} className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <label className="mb-1 block text-xs font-medium text-slate-400">Header (optional)</label>
              <input
                type="text"
                className={sharedInputClassName}
                value={header.key}
                onChange={(event) => onChange(index, 'key', event.target.value)}
                placeholder="e.g., Authentication-Results"
              />
              <FieldError message={errors[index]?.key} />
            </div>
            <div className="lg:col-span-6">
              <label className="mb-1 block text-xs font-medium text-slate-400">Value (optional)</label>
              <input
                type="text"
                className={sharedInputClassName}
                value={header.value}
                onChange={(event) => onChange(index, 'value', event.target.value)}
                placeholder="e.g., spf=pass; dkim=pass; dmarc=pass"
              />
              <FieldError message={errors[index]?.value} />
            </div>
            <div className="flex items-end lg:col-span-2">
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={headers.length === 1}
                className="w-full rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LinksEditor({
  links,
  errors = [],
  onChange,
  onAdd,
  onRemove,
  title,
  description,
}) {
  return (
    <div className={title ? 'space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-5' : ''}>
      {title && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="text-sm text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
          >
            Add Link
          </button>
        </div>
      )}

      <div className={`space-y-4 ${title ? '' : 'rounded-xl border border-slate-700 bg-slate-900/60 p-5'}`}>
        <div className={!title ? 'flex items-center justify-between gap-3 mb-4' : ''}>
          {!title && (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
            >
              Add Link
            </button>
          )}
        </div>

        {links.map((link, index) => (
          <div key={`link-${index}`} className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-slate-400">Label (optional)</label>
              <input
                type="text"
                className={sharedInputClassName}
                value={link.text}
                onChange={(event) => onChange(index, 'text', event.target.value)}
                placeholder="e.g., Click here"
              />
              <FieldError message={errors[index]?.text} />
            </div>
            <div className="lg:col-span-5">
              <label className="mb-1 block text-xs font-medium text-slate-400">URL (optional)</label>
              <input
                type="url"
                className={sharedInputClassName}
                value={link.url}
                onChange={(event) => onChange(index, 'url', event.target.value)}
                placeholder="e.g., https://bit.ly/example"
              />
              <FieldError message={errors[index]?.url} />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">Source (optional)</label>
              <select
                className={sharedInputClassName}
                value={link.source}
                onChange={(event) => onChange(index, 'source', event.target.value)}
              >
                <option value="manual">manual</option>
                <option value="text">text</option>
                <option value="html">html</option>
                <option value="button">button</option>
              </select>
              <FieldError message={errors[index]?.source} />
            </div>
            <div className="flex items-end lg:col-span-2">
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={links.length === 1}
                className="w-full rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AttachmentsEditor({
  attachments,
  errors = [],
  onChange,
  onAdd,
  onRemove,
  title,
  description,
}) {
  return (
    <div className={title ? 'space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-5' : ''}>
      {title && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="text-sm text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
          >
            Add Attachment
          </button>
        </div>
      )}

      <div className={`space-y-4 ${title ? '' : 'rounded-xl border border-slate-700 bg-slate-900/60 p-5'}`}>
        <div className={!title ? 'flex items-center justify-between gap-3 mb-4' : ''}>
          {!title && (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
            >
              Add Attachment
            </button>
          )}
        </div>

        {attachments.map((attachment, index) => (
          <div key={`attachment-${index}`} className="space-y-3 rounded-xl border border-slate-800 p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <label className="mb-1 block text-xs font-medium text-slate-400">Filename (optional)</label>
                <input
                  type="text"
                  className={sharedInputClassName}
                  value={attachment.filename}
                  onChange={(event) => onChange(index, 'filename', event.target.value)}
                  placeholder="e.g., invoice.pdf.exe"
                />
                <FieldError message={errors[index]?.filename} />
              </div>
              <div className="lg:col-span-4">
                <label className="mb-1 block text-xs font-medium text-slate-400">Content Type (optional)</label>
                <input
                  type="text"
                  className={sharedInputClassName}
                  value={attachment.content_type}
                  onChange={(event) => onChange(index, 'content_type', event.target.value)}
                  placeholder="e.g., application/octet-stream"
                />
                <FieldError message={errors[index]?.content_type} />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-400">Size (bytes) (optional)</label>
                <input
                  type="number"
                  min="0"
                  className={sharedInputClassName}
                  value={attachment.size}
                  onChange={(event) => onChange(index, 'size', event.target.value)}
                  placeholder="e.g., 375000"
                />
                <FieldError message={errors[index]?.size} />
              </div>
              <div className="flex items-end lg:col-span-2">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={attachments.length === 1}
                  className="w-full rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <label className="mb-1 block text-xs font-medium text-slate-400">SHA-256 (optional)</label>
                <input
                  type="text"
                  className={`${sharedInputClassName} font-mono text-sm`}
                  value={attachment.sha256}
                  onChange={(event) => onChange(index, 'sha256', event.target.value)}
                />
                <FieldError message={errors[index]?.sha256} />
              </div>
              <div className="flex items-end lg:col-span-4">
                <label className="flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={attachment.is_password_protected}
                    onChange={(event) =>
                      onChange(index, 'is_password_protected', event.target.checked)
                    }
                  />
                  Password protected
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Extracted Text / OCR (optional)
              </label>
              <textarea
                rows="3"
                className={sharedTextAreaClassName}
                value={attachment.extracted_text}
                onChange={(event) => onChange(index, 'extracted_text', event.target.value)}
              ></textarea>
              <FieldError message={errors[index]?.extracted_text} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
