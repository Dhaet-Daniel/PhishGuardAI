const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

export const compactPayload = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const items = value.map(compactPayload).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value).reduce((accumulator, [key, currentValue]) => {
      const nextValue = compactPayload(currentValue);
      if (nextValue !== undefined) {
        accumulator[key] = nextValue;
      }
      return accumulator;
    }, {});

    return Object.keys(entries).length ? entries : undefined;
  }

  return value ?? undefined;
};
