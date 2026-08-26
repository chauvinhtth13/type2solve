export function isRemoteReference(reference) {
  const value = String(reference || '').trim();
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(value)
    || /^(data|mailto|tel|javascript):/i.test(value)
    || value.startsWith('#');
}

export function isLocalReference(reference) {
  const value = String(reference || '').trim();
  return Boolean(value) && !value.includes('${') && !isRemoteReference(value);
}

export function extractHtmlReferences(html) {
  const references = [];
  const pattern = /\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi;
  for (const match of String(html || '').matchAll(pattern)) {
    if (isLocalReference(match[2]) && !references.includes(match[2])) references.push(match[2]);
  }
  return references;
}

export function cleanReferencePath(reference) {
  if (!isLocalReference(reference)) return null;
  return String(reference).trim().replace(/^\.\//, '').split(/[?#]/)[0] || null;
}
