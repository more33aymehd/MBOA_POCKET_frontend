import { fetchAuth } from './api';

export const budgetService = {
  create: (token, data) => fetchAuth('/budgets', token, { method: 'POST', body: JSON.stringify(data) }),
  getCurrent: (token) => fetchAuth('/budgets/current', token),
  update: (token, id, data) => fetchAuth(`/budgets/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
};
