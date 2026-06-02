import { fetchAuth } from './api';

export const statsService = {
  getMonthly: (token, mois, annee) => {
    const params = new URLSearchParams();
    if (mois) params.set('mois', String(mois));
    if (annee) params.set('annee', String(annee));
    return fetchAuth(`/stats/monthly?${params}`, token);
  },
};
