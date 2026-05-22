import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Bills() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-light p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-secondary mb-6">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Pay Bills</h2>
          <p className="text-gray-600">Coming soon - Pay electricity, water, internet bills</p>
        </div>
      </div>
    </div>
  )
}
