import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { setToken, setUser, setError, clearError } from '../store/authSlice'
import { authService } from '../services/api'
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { error } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearError())
    setLoading(true)

    try {
      const response = await authService.login({ email, password })
      dispatch(setToken(response.data.access_token))
      dispatch(setUser({ email }))
      navigate('/dashboard')
    } catch (err) {
      dispatch(setError(err.response?.data?.detail || 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-blue-700 flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">BankUI</h1>
          <p className="text-gray-600 mb-8">Digital Banking Made Simple</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-gap-2">
              <AlertCircle size={20} className="text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader size={20} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-secondary font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
