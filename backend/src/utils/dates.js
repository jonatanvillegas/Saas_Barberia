const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnlyString(value) {
  return typeof value === 'string' && DATE_ONLY_RE.test(value);
}

// Para guardar: si viene YYYY-MM-DD, lo interpretamos como fecha local (sin Z)
// y le ponemos hora 12:00 para evitar desfases por UTC.
function parseForStorage(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (isDateOnlyString(value)) return new Date(`${value}T12:00:00`);
  return new Date(value);
}

function parseStartOfDay(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (isDateOnlyString(value)) return new Date(`${value}T00:00:00`);
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseEndOfDay(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
  }
  if (isDateOnlyString(value)) return new Date(`${value}T23:59:59.999`);
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

module.exports = {
  isDateOnlyString,
  parseForStorage,
  parseStartOfDay,
  parseEndOfDay,
};
