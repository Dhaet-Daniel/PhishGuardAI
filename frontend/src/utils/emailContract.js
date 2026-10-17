import { compactPayload } from './payload';

export const EMAIL_INPUT_MODES = {
  QUICK: 'quick',
  STRUCTURED: 'structured',
  RAW: 'raw',
};

export const EMAIL_MODE_OPTIONS = [
  {
    value: EMAIL_INPUT_MODES.QUICK,
    label: 'Quick',
    description: 'Simple subject, sender, and body input.',
  },
  {
    value: EMAIL_INPUT_MODES.STRUCTURED,
    label: 'Structured',
    description: 'Advanced sender, headers, links, and attachments.',
  },
  {
    value: EMAIL_INPUT_MODES.RAW,
    label: 'Raw',
    description: 'Paste the full RFC822 message for backend parsing.',
  },
];

export const createHeader = () => ({
  key: '',
  value: '',
});

export const createLink = () => ({
  text: '',
  url: '',
  source: 'manual',
});

export const createAttachment = () => ({
  filename: '',
  content_type: '',
  size: '',
  sha256: '',
  is_password_protected: false,
  extracted_text: '',
});

export const createEmailForm = (overrides = {}) => ({
  mode: EMAIL_INPUT_MODES.QUICK,
  subject: '',
  sender: '',
  body: '',
  display_name: '',
  reply_to: '',
  return_path: '',
  body_text: '',
  body_html: '',
  raw_email: '',
  headers: [createHeader()],
  links: [createLink()],
  attachments: [createAttachment()],
  ...overrides,
});

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isMeaningfulHeader = (header) =>
  isNonEmptyString(header?.key) || isNonEmptyString(header?.value);

export const isMeaningfulLink = (link) =>
  isNonEmptyString(link?.text) || isNonEmptyString(link?.url);

export const isMeaningfulAttachment = (attachment) =>
  isNonEmptyString(attachment?.filename) ||
  isNonEmptyString(attachment?.content_type) ||
  isNonEmptyString(attachment?.size) ||
  isNonEmptyString(attachment?.sha256) ||
  isNonEmptyString(attachment?.extracted_text) ||
  attachment?.is_password_protected === true;

export const filterMeaningfulHeaders = (headers = []) => headers.filter(isMeaningfulHeader);

export const filterMeaningfulLinks = (links = []) => links.filter(isMeaningfulLink);

export const filterMeaningfulAttachments = (attachments = []) =>
  attachments.filter(isMeaningfulAttachment);

const toHeaderObject = (headers = []) =>
  filterMeaningfulHeaders(headers).reduce((accumulator, header) => {
    accumulator[header.key.trim()] = header.value.trim();
    return accumulator;
  }, {});

const toLinkPayload = (links = []) =>
  filterMeaningfulLinks(links).map((link) => ({
    text: link.text,
    url: link.url,
    source: link.source || 'manual',
  }));

const toAttachmentPayload = (attachments = []) =>
  filterMeaningfulAttachments(attachments).map((attachment) => ({
    filename: attachment.filename,
    content_type: attachment.content_type,
    size: attachment.size === '' ? undefined : Number.parseInt(attachment.size, 10),
    sha256: attachment.sha256,
    is_password_protected: attachment.is_password_protected,
    extracted_text: attachment.extracted_text,
  }));

export const buildEmailPayload = (email) => {
  if (email.mode === EMAIL_INPUT_MODES.RAW) {
    return compactPayload({
      raw_email: email.raw_email,
    });
  }

  if (email.mode === EMAIL_INPUT_MODES.QUICK) {
    return compactPayload({
      subject: email.subject,
      sender: email.sender,
      body: email.body,
    });
  }

  return compactPayload({
    subject: email.subject,
    sender: email.sender,
    sender_info: {
      email: email.sender,
      display_name: email.display_name,
      reply_to: email.reply_to,
      return_path: email.return_path,
    },
    body_text: email.body_text,
    body_html: email.body_html,
    headers: toHeaderObject(email.headers),
    links: toLinkPayload(email.links),
    attachments: toAttachmentPayload(email.attachments),
  });
};

const createCollectionErrors = (collection = [], factory) => collection.map(factory);

export const createEmptyValidationState = (email = {}) => ({
  headers: createCollectionErrors(email.headers || [], () => ({})),
  links: createCollectionErrors(email.links || [], () => ({})),
  attachments: createCollectionErrors(email.attachments || [], () => ({})),
});

export const validateEmailForm = (email) => {
  const errors = createEmptyValidationState(email);

  if (email.mode === EMAIL_INPUT_MODES.RAW) {
    if (!isNonEmptyString(email.raw_email)) {
      errors.raw_email = 'Raw email is required in Raw mode.';
    }

    return errors;
  }

  if (!isNonEmptyString(email.sender)) {
    errors.sender = 'Sender email is required.';
  } else if (!isValidEmail(email.sender)) {
    errors.sender = 'Enter a valid sender email address.';
  }

  if (!isNonEmptyString(email.subject)) {
    errors.subject = 'Subject is required.';
  }

  if (email.mode === EMAIL_INPUT_MODES.QUICK) {
    if (!isNonEmptyString(email.body)) {
      errors.body = 'Body text is required in Quick mode.';
    }

    return errors;
  }

  if (!isNonEmptyString(email.body_text) && !isNonEmptyString(email.body_html)) {
    errors.body_text = 'Provide a text body or HTML body.';
  }

  if (isNonEmptyString(email.reply_to) && !isValidEmail(email.reply_to)) {
    errors.reply_to = 'Enter a valid Reply-To address.';
  }

  if (isNonEmptyString(email.return_path) && !isValidEmail(email.return_path)) {
    errors.return_path = 'Enter a valid Return-Path address.';
  }

  email.headers.forEach((header, index) => {
    if (!isMeaningfulHeader(header)) {
      return;
    }

    if (!isNonEmptyString(header.key)) {
      errors.headers[index].key = 'Header name is required.';
    }
    if (!isNonEmptyString(header.value)) {
      errors.headers[index].value = 'Header value is required.';
    }
  });

  email.links.forEach((link, index) => {
    if (!isMeaningfulLink(link)) {
      return;
    }

    if (!isNonEmptyString(link.url)) {
      errors.links[index].url = 'URL is required.';
    } else if (!isValidHttpUrl(link.url.trim())) {
      errors.links[index].url = 'Enter a valid http or https URL.';
    }
  });

  email.attachments.forEach((attachment, index) => {
    if (!isMeaningfulAttachment(attachment)) {
      return;
    }

    if (!isNonEmptyString(attachment.filename)) {
      errors.attachments[index].filename = 'Filename is required when attachment details are added.';
    }

    if (isNonEmptyString(attachment.size)) {
      const size = Number.parseInt(attachment.size, 10);
      if (!Number.isInteger(size) || size < 0) {
        errors.attachments[index].size = 'Attachment size must be a non-negative integer.';
      }
    }

    if (isNonEmptyString(attachment.sha256) && !/^[a-fA-F0-9]{64}$/.test(attachment.sha256.trim())) {
      errors.attachments[index].sha256 = 'SHA-256 must be a 64-character hexadecimal string.';
    }
  });

  return errors;
};

export const hasValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') {
    return false;
  }

  return Object.entries(errors).some(([, value]) => {
    if (Array.isArray(value)) {
      return value.some((item) => hasValidationErrors(item));
    }

    if (value && typeof value === 'object') {
      return hasValidationErrors(value);
    }

    return Boolean(value);
  });
};

const stripBodyPrefix = (path = []) => {
  if (path[0] === 'body') {
    return path.slice(1);
  }
  return path;
};

const addNestedError = (target, path, message) => {
  if (!path.length) {
    target.form = message;
    return;
  }

  let pointer = target;

  path.forEach((segment, index) => {
    const isLast = index === path.length - 1;
    const nextSegment = path[index + 1];

    if (typeof segment === 'number') {
      if (!Array.isArray(pointer)) {
        return;
      }

      if (!pointer[segment]) {
        pointer[segment] = typeof nextSegment === 'number' ? [] : {};
      }

      if (isLast) {
        pointer[segment] = message;
        return;
      }

      pointer = pointer[segment];
      return;
    }

    if (isLast) {
      pointer[segment] = message;
      return;
    }

    if (!(segment in pointer)) {
      pointer[segment] = typeof nextSegment === 'number' ? [] : {};
    }

    pointer = pointer[segment];
  });
};

const normalizeIssuePath = (path = []) => {
  const trimmedPath = stripBodyPrefix(path);

  if (trimmedPath[0] === 'sender_info' && trimmedPath[1] === 'email') {
    return ['sender'];
  }

  if (trimmedPath[0] === 'sender_info' && trimmedPath[1]) {
    return [trimmedPath[1]];
  }

  return trimmedPath;
};

export const mapValidationIssuesToSingleErrors = (issues = [], fallback) => {
  const errors = fallback
    ? {
        ...fallback,
        headers: (fallback.headers || []).map((item) => ({ ...item })),
        links: (fallback.links || []).map((item) => ({ ...item })),
        attachments: (fallback.attachments || []).map((item) => ({ ...item })),
      }
    : {};

  issues.forEach((issue) => {
    const path = normalizeIssuePath(issue.path || issue.loc || []);
    addNestedError(errors, path, issue.message || issue.msg || 'Invalid value.');
  });

  return errors;
};

export const mapValidationIssuesToBatchErrors = (issues = [], emails = []) => {
  const errors = emails.map((email) => createEmptyValidationState(email));

  issues.forEach((issue) => {
    const stripped = stripBodyPrefix(issue.path || issue.loc || []);
    const rowIndex = typeof stripped[0] === 'number' ? stripped[0] : null;

    if (rowIndex === null || !errors[rowIndex]) {
      return;
    }

    addNestedError(
      errors[rowIndex],
      normalizeIssuePath(stripped.slice(1)),
      issue.message || issue.msg || 'Invalid value.'
    );
  });

  return errors;
};
