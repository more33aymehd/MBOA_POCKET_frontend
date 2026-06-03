import { fetchAuth } from './api';

export const aiService = {
  proposeBudget: (token, data) => fetchAuth('/ai/propose-budget', token, { method: 'POST', body: JSON.stringify(data) }),
  saveAllocation: (token, categories) => fetchAuth('/ai/save-allocation', token, { method: 'POST', body: JSON.stringify({ categories }) }),
};
