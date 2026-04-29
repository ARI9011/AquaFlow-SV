import axios from 'axios';

// Configuración global de Axios
axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true; // Enviar cookies de sesión
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Interceptor para manejo de errores global
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si es no autorizado, redirigir a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
