// ⚠️ Remplace par l'IP affichée dans "Metro waiting on exp://XXX.XXX.XXX.XXX"
const BASE_URL = 'http://172.20.10.3:8080/api'; // Hotspot/WiFi — même réseau que le téléphone
// const BASE_URL = 'http://10.0.2.2:8080/api';  // Android Emulator
// const BASE_URL = 'http://localhost:8080/api';  // iOS Simulator

export async function fetchAuth(endpoint, token, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Erreur serveur');
  return data;
}

export async function fetchPublic(endpoint, options = {}) {
  return fetchAuth(endpoint, null, options);
}
