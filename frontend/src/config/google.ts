export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

export function hasGoogleClientId() {
  return GOOGLE_CLIENT_ID.length > 0;
}

export function currentOrigin() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.origin;
}
