import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setBalance, setTransactions } from '../store/paymentSlice'
import { userService, paymentService } from '../services/api'
import { PaymentCard } from '../components'
import { Send, ArrowDownLeft, FileText, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/helpers'

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth)
  const { balance, transactions } = useSelector((state) => state.payment)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [profileRes, historyRes] = await Promise.all([
        userService.getBalance(),
        paymentService.getHistory(),
      ])
      dispatch(setBalance(profileRes.data.balance))
      dispatch(setTransactions(historyRes.data))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-light p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <PaymentCard balance={balance} userName={user?.name || 'User'} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigate('/send')}
            className="card p-4 hover:shadow-md transition-shadow text-center"
          >
            <Send className="mx-auto mb-2 text-secondary" size={32} />
            <p className="font-semibold text-sm">Send Money</p>
          </button>

          <button
            onClick={() => navigate('/request')}
            className="card p-4 hover:shadow-md transition-shadow text-center"
          >
            <ArrowDownLeft className="mx-auto mb-2 text-accent" size={32} />
            <p className="font-semibold text-sm">Request Money</p>
          </button>

          <button
            onClick={() => navigate('/bills')}
            className="card p-4 hover:shadow-md transition-shadow text-center"
          >
            <FileText className="mx-auto mb-2 text-orange-500" size={32} />
            <p className="font-semibold text-sm">Pay Bills</p>
          </button>

          <button
            onClick={() => navigate('/cards')}
            className="card p-4 hover:shadow-md transition-shadow text-center"
          >
            <CreditCard className="mx-auto mb-2 text-purple-500" size={32} />
            <p className="font-semibold text-sm">Cards</p>
          </button>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.transaction_id} className="flex justify-between items-center border-b pb-3">
                  <div>
                    <p className="font-medium text-gray-800">{tx.type}</p>
                    <p className="text-sm text-gray-500">{formatDate(tx.timestamp)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{formatCurrency(tx.amount)}</p>
                    <p className={`text-sm ${tx.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
