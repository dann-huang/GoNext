const apiURL = '/api';

type ApiResponse<T> = {
  data?: T;
  message?: string;
  error?: string;
};

async function handleSend<T>(route: string, options: RequestInit): Promise<T> {
  const response = await fetch(route, options).catch(e => {
    console.warn('fetch err ', e);
    throw new Error('Network error');
  });
  const data: ApiResponse<T> = await response.json().catch(e => {
    console.error('json err ', e);
    return {};
  });
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Something went quite wrong...');
  }
  return data as T;
}

const api = {
  postJson<T = void, U = unknown>(route: string, payload: U): Promise<T> {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    return handleSend<T>(apiURL + route, options);
  },

  get<T = void>(route: string): Promise<T> {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    return handleSend<T>(apiURL + route, options);
  },
};

export default api;
