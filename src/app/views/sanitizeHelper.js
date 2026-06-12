/**
 * Sanitiza strings brutas para evitar injeções de scripts maliciosos (XSS).
 * @param {string} str 
 * @returns {string} String limpa codificada em entidades HTML
 */
export function sanitizeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
}
