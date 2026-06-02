import { fetchAuth } from './api';

export const dealService = {
  getNearby: (token, lat, lng, rayon = 10, categorie) => {
    const params = new URLSearchParams({ lat, lng, rayon });
    if (categorie && categorie !== 'TOUS') params.set('categorie', categorie);
    return fetchAuth(`/deals/nearby?${params}`, token);
  },
  getById: (token, id) => fetchAuth(`/deals/${id}`, token),
  create: (token, data) =>
    fetchAuth('/deals', token, { method: 'POST', body: JSON.stringify(data) }),
};
