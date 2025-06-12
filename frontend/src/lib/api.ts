
const apiURL = '/api';

const postJson = (route: string, payload: unknown) => fetch(apiURL + route, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const api = {
  postJson
};

export default api;