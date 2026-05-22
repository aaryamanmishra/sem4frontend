import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token'),
    user: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload
      localStorage.setItem('token', action.payload)
    },
    setUser: (state, action) => {
      state.user = action.payload
    },
    logout: (state) => {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const { setToken, setUser, logout, setError, clearError } = authSlice.actions
export default authSlice.reducer
