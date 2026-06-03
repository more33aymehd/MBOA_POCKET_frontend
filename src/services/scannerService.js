import { fetchAuth } from './api';

export const scannerService = {
  decode: (token, content) =>
    fetchAuth('/qr/decode', token, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
