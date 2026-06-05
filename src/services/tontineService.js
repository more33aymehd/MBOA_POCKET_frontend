import { fetchAuth } from './api';

export const tontineService = {
  create: (token, data) =>
    fetchAuth('/tontines', token, { method: 'POST', body: JSON.stringify(data) }),

  getMy: (token) => fetchAuth('/tontines/my', token),

  getById: (token, id) => fetchAuth(`/tontines/${id}`, token),

  join: (token, id) =>
    fetchAuth(`/tontines/${id}/join`, token, { method: 'POST', body: '{}' }),

  pay: (token, id, montant) =>
    fetchAuth(`/tontines/${id}/pay`, token, {
      method: 'POST',
      body: JSON.stringify({ montant }),
    }),

  advanceTour: (token, id) =>
    fetchAuth(`/tontines/${id}/tour`, token, { method: 'PUT', body: '{}' }),
};
