import { fetchPublic } from './api';

export const authService = {
  login: (email, password) =>
    fetchPublic('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) =>
    fetchPublic('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};
