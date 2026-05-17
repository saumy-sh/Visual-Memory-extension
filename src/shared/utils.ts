export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch {
    return url;
  }
}

export function generateId(): string {
  return `vm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}