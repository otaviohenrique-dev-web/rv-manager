import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000, // Ajustado para 15s para suportar oscilações e processamento do Back-end
});

export default api;