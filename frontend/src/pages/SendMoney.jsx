import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setBalance, addTransaction, setError, clearError } from '../store/paymentSlice'
import { paymentService } from '../services/api'
import { formatCurrency, validatePhone, maskPhone } from '../utils/helpers'
import { AlertCircle, CheckCircle, Loader, ArrowLeft } from 'lucide-react'

export default function SendMoney() {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipient, setRecipient] = useState(null)
  const [transaction, setTransaction] = useState(null)
  const { error } = useSelector((state) => state.payment)
  const { balance } = useSelector((state) => state.payment)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const validateAndProceed = async () => {
    dispatch(clearError())

    if (!validatePhone(phone)) {
      dispatch(setError('Invalid phone number'))
      return
    }

    if (!amount || amount <= 0 || amount > 100000) {
      dispatch(setError('Amount must be between ₹1 and ₹100,000'))
      return
    }

    if (amount > balance) {
      dispatch(setError('Insufficient balance'))
      return
    }

    setLoading(true)
    try {
      const response = await paymentService.validateTransfer({
        recipient_phone: phone,
        amount: parseFloat(amount),
      })

      if (response.data.valid) {
        setRecipient(response.data)
        setStep(2)
      } else {
        dispatch(setError(response.data.error))
      }
    } catch (err) {
      dispatch(setError(err.response?.data?.detail || 'Validation failed'))
    } finally {
      setLoading(false)
    }
  }

  const processTransfer = async () => {
    setLoading(true)
    try {
      const response = await paymentService.transfer({
        recipient_phone: phone,
        amount: parseFloat(amount),
        description: description,
      })

      dispatch(setBalance(balance - parseFloat(amount)))
      dispatch(addTransaction(response.data))
      setTransaction(response.data)
      setStep(3)
    } catch (err) {
      dispatch(setError(err.response?.data?.detail || 'Transfer failed'))
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-light p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-secondary mb-6 hover:underline"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Step 1: Enter Amount */}
        {step === 1 && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">Send Money</h2>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Recipient Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input-field text-lg"
                placeholder="9876543210"
              />
              {phone && <p className="text-gray-500 text-sm mt-1">{maskPhone(phone)}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-2xl font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-10 text-2xl font-bold"
                  placeholder="0"
                  max="100000"
                />
              </div>
              <p className="text-gray-500 text-sm mt-2">
                Available: {formatCurrency(balance)} | Max: ₹100,000
              </p>
            </div>

            <button
              onClick={validateAndProceed}
              disabled={loading || !phone || !amount}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && recipient && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">Confirm Transfer</h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-3">
                <span className="text-gray-600">To:</span>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{recipient.recipient_name}</p>
                  <p className="text-gray-500 text-sm">{maskPhone(recipient.recipient_phone)}</p>
                </div>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-gray-600 font-medium">Amount:</span>
                <p className="text-2xl font-bold text-secondary">{formatCurrency(amount)}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Note (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                placeholder="Add a note..."
                maxLength="100"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={processTransfer}
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader className="animate-spin" size={20} />}
                Transfer Now
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && transaction && (
          <div className="card p-6 text-center">
            <CheckCircle size={64} className="mx-auto text-accent mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">Transfer Successful!</h2>
            <p className="text-gray-600 mb-6">{formatCurrency(amount)} sent to {recipient.recipient_name}</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-gray-600 text-sm mb-1">Reference ID</p>
              <p className="font-mono font-bold">{transaction.transaction_id}</p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
