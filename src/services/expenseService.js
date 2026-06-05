import { fetchAuth } from './api';

export const expenseService = {
  create: (token, data) => fetchAuth('/expenses', token, { method: 'POST', body: JSON.stringify(data) }),
  getByMonth: (token, mois, annee) => {
    const params = new URLSearchParams();
    if (mois) params.set('mois', String(mois));
    if (annee) params.set('annee', String(annee));
    return fetchAuth(`/expenses?${params}`, token);
  },
  getByCategory: (token, categoryId) =>
    fetchAuth(`/expenses/category/${categoryId}`, token),
  delete: (token, id) => fetchAuth(`/expenses/${id}`, token, { method: 'DELETE' }),
};
