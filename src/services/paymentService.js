import { fetchAuth } from './api';

export const paymentService = {
  initiate: (token, data) =>
    fetchAuth('/payments/initiate', token, { method: 'POST', body: JSON.stringify(data) }),
  checkStatus: (token, reference) =>
    fetchAuth(`/payments/status/${reference}`, token),
  getHistory: (token) =>
    fetchAuth('/payments/history', token),
};
