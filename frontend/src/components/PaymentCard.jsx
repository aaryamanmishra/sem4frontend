import { formatCurrency } from '../utils/helpers'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function PaymentCard({ balance, userName }) {
  const [showBalance, setShowBalance] = useState(true)

  return (
    <div className="payment-card max-w-md mx-auto mb-8">
      <div className="flex justify-between items-start mb-12">
        <div>
          <p className="text-blue-100 text-sm mb-1">Account Balance</p>
          <div className="flex items-center gap-2">
            <h2 className="text-4xl font-bold">
              {showBalance ? formatCurrency(balance) : '••••••'}
            </h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-blue-100 text-xs">ACCOUNT</p>
          <p className="font-semibold">Savings</p>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-blue-100 text-xs mb-1">CARDHOLDER</p>
          <p className="font-semibold text-lg">{userName}</p>
        </div>
        <div className="text-blue-100 text-xs">
          <p>•••• •••• •••• 8901</p>
        </div>
      </div>
    </div>
  )
}
