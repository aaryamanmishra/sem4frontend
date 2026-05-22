import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store/authSlice'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { user } = useSelector((state) => state.auth)
  const [isOpen, setIsOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">BankUI</h1>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {user && (
          <div className="hidden md:flex items-center gap-4">
            <span className="text-gray-700">{user.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        )}
      </div>

      {isOpen && user && (
        <div className="md:hidden border-t px-4 py-4">
          <button
            onClick={handleLogout}
            className="w-full text-left text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      )}
    </header>
  )
}
