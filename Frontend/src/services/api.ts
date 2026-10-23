import axios from 'axios'

// Requests go to our own site; Vercel (prod) or Vite (dev) forwards them to
// the backend. Keeps the login cookie first-party, which Safari requires.
const baseURL = '/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
  // Render's free tier can take 20-30s to wake a sleeping backend on the
  // first request after a period of inactivity — give it room before we
  // give up, instead of hanging indefinitely.
  timeout: 45000,
})

// Login and signup answer a wrong password with 401 too — let the form
// show that error instead of redirecting.
const AUTH_FORM_ENDPOINTS = ['/auth/login', '/auth/signup']

// Any other 401 means the session is gone (logged out or token expired):
// send the user back to the login page. A full page load also wipes the
// old session's cached data.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''

    if (
      status === 401 &&
      !AUTH_FORM_ENDPOINTS.includes(url) &&
      window.location.pathname !== '/auth'
    ) {
      window.location.assign('/auth')
    }

    return Promise.reject(error)
  }
)

export default api
