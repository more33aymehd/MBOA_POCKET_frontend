import { fetchPublic } from './api';

export const authService = {
  login: (email, password) =>
    fetchPublic('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  verify2fa: (tempToken, code) =>
    fetchPublic('/auth/verify-2fa', { method: 'POST', body: JSON.stringify({ tempToken, code }) }),

  register: (data) =>
    fetchPublic('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};
