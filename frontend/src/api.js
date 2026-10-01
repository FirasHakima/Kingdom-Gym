import axios from "axios"; const api = axios.create({ baseURL: "http://127.0.0.1:3001/api", timeout: 10000 }); api.interceptors.request.use(config => { const token = localStorage.getItem("kg_token"); if (token) config.headers.Authorization = `Bearer ${token}`; return config; }); api.interceptors.response.use(
  res => res,
  err => {
    // if unauthorized and not originating from the login endpoint, force logout
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      if (!url.endsWith('/auth/login')) {
        localStorage.removeItem("kg_token");
        localStorage.removeItem("kg_admin");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
); export default api;
