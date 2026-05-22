import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

const unwrap = (request) =>
  request.then((response) => {
    if (response.data?.error) {
      throw new Error(response.data.error)
    }

    return response.data
  })

export const bankApi = {
  health: () => unwrap(api.get('/')),
  initDb: () => unwrap(api.get('/init-db')),
  login: (data) => unwrap(api.get('/login', { params: data })),
  addUser: (data) => unwrap(api.get('/add-user', { params: data })),
  getBalance: (userId) => unwrap(api.get('/balance', { params: { user_id: userId } })),
  transfer: (data) => unwrap(api.get('/transfer', { params: data })),
  getTransactions: () => unwrap(api.get('/transactions')),
  getUsers: () => unwrap(api.get('/users')),
}

export { API_BASE }
export default api
