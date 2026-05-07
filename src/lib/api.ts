const URLS = {
  auth: "https://functions.poehali.dev/f2a77697-8adc-4d34-aa5a-a978ed5ff856",
  products: "https://functions.poehali.dev/8c0bb2cb-659d-4e2a-aa83-783cd9715fa1",
  orders: "https://functions.poehali.dev/de092afe-b169-4e50-933e-c9d25d9974cc",
  users: "https://functions.poehali.dev/3ddd8ac1-d870-4dea-8499-23d37dd01937",
};

function getToken() {
  return localStorage.getItem("pos_token") || "";
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function req(url: string, options?: RequestInit) {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options?.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      req(`${URLS.auth}/login`, { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, name: string) =>
      req(`${URLS.auth}/register`, { method: "POST", body: JSON.stringify({ email, password, name }) }),
    me: () => req(`${URLS.auth}/me`),
    logout: () => req(`${URLS.auth}/logout`, { method: "POST" }),
  },
  products: {
    list: (params?: { category?: string; search?: string; active_only?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set("category", params.category);
      if (params?.search) q.set("search", params.search);
      if (params?.active_only !== undefined) q.set("active_only", String(params.active_only));
      return req(`${URLS.products}/?${q}`);
    },
    byBarcode: (barcode: string) => req(`${URLS.products}/barcode/${barcode}`),
    create: (data: object) => req(`${URLS.products}/`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: object) => req(`${URLS.products}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  orders: {
    create: (items: object[], payment_method: string, note?: string) =>
      req(`${URLS.orders}/create`, { method: "POST", body: JSON.stringify({ items, payment_method, note }) }),
    my: () => req(`${URLS.orders}/my`),
    all: (status?: string) => {
      const q = status ? `?status=${status}` : "";
      return req(`${URLS.orders}/${q}`);
    },
    setStatus: (id: number, status: string) =>
      req(`${URLS.orders}/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  },
  users: {
    list: () => req(`${URLS.users}/`),
    topup: (email: string, amount: number) =>
      req(`${URLS.users}/topup`, { method: "POST", body: JSON.stringify({ email, amount }) }),
  },
};
