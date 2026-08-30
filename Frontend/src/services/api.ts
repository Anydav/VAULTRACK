import axios from 'axios'

const baseURL = `${import.meta.env.VITE_API_BASE_URL}/api`

const api = axios.create({
  baseURL,
  withCredentials: true,
  // Render's free tier can take 20-30s to wake a sleeping backend on the
  // first request after a period of inactivity — give it room before we
  // give up, instead of hanging indefinitely.
  timeout: 45000,
})

export default api
