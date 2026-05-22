import { createSlice } from '@reduxjs/toolkit'

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    balance: 0,
    transactions: [],
    beneficiaries: [],
    loading: false,
    error: null,
    lastTransaction: null,
  },
  reducers: {
    setBalance: (state, action) => {
      state.balance = action.payload
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload
    },
    setBeneficiaries: (state, action) => {
      state.beneficiaries = action.payload
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload)
      state.lastTransaction = action.payload
    },
    addBeneficiary: (state, action) => {
      state.beneficiaries.push(action.payload)
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setBalance,
  setTransactions,
  setBeneficiaries,
  addTransaction,
  addBeneficiary,
  setLoading,
  setError,
  clearError,
} = paymentSlice.actions
export default paymentSlice.reducer
