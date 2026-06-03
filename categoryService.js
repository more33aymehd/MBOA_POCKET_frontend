import { fetchAuth } from './api';

export const categoryService = {
  create: (token, data) => fetchAuth('/categories', token, { method: 'POST', body: JSON.stringify(data) }),
  getAll: (token, mois, annee) => {
    const params = new URLSearchParams();
    if (mois) params.set('mois', String(mois));
    if (annee) params.set('annee', String(annee));
    return fetchAuth(`/categories?${params}`, token);
  },
  update: (token, id, data) => fetchAuth(`/categories/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (token, id) => fetchAuth(`/categories/${id}`, token, { method: 'DELETE' }),
};
