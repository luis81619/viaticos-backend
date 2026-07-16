// Normaliza cadenas eliminando espacios sobrantes y convirtiéndolas a mayúsculas.

export function normalizeToUpperCase(
  value: unknown,
): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}