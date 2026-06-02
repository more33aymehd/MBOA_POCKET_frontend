import { fetchAuth } from './api';

export const userService = {
  getProfile: (token) => fetchAuth('/users/me', token),

  updateProfile: (token, data) =>
    fetchAuth('/users/me', token, { method: 'PUT', body: JSON.stringify(data) }),

  updatePreferences: (token, data) =>
    fetchAuth('/users/me/preferences', token, { method: 'PUT', body: JSON.stringify(data) }),

  changePassword: (token, currentPassword, newPassword) =>
    fetchAuth('/users/me/change-password', token, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  deleteAccount: (token) =>
    fetchAuth('/users/me', token, { method: 'DELETE' }),
};
