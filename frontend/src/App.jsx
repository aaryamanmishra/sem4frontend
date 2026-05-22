import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  IndianRupee,
  Loader2,
  LogOut,
  Receipt,
  RefreshCw,
  ShieldCheck,
  User,
  UserPlus,
  WalletCards,
  XCircle,
} from 'lucide-react'
import { API_BASE, bankApi } from './services/api'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const emptyRegisterForm = {
  name: '',
  phone: '',
  email: '',
  pan: '',
  aadhar: '',
  balance: '',
}

const emptyTransferForm = {
  receiver_id: '',
  amount: '',
}

const emptyLoginForm = {
  user_id: '',
  pan: '',
}

function cleanPayload(form) {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, value === '' ? undefined : value]),
  )
}

function formatTimestamp(value) {
  if (!value) return 'Time not available'

  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return 'Time not available'

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function Notice({ notice, onClear }) {
  if (!notice) return null

  const isError = notice.type === 'error'

  return (
    <div className={`notice ${isError ? 'notice-error' : 'notice-success'}`}>
      {isError ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{notice.message}</span>
      <button type="button" onClick={onClear} aria-label="Dismiss message">
        <XCircle size={16} />
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label>
      {label}
      {children}
    </label>
  )
}

function TransactionList({ transactions, userId }) {
  if (!transactions.length) {
    return <div className="empty-state">No transactions yet</div>
  }

  return (
    <div className="activity-list">
      {transactions.map((txn) => {
        const sent = Number(txn.sender_id) === Number(userId)
        return (
          <div className="activity-item" key={txn.txn_id}>
            <span className={`activity-icon ${sent ? 'activity-debit' : 'activity-credit'}`}>
              <ArrowRightLeft size={18} />
            </span>
            <span className="activity-copy">
              <strong>{sent ? `Sent to #${txn.receiver_id}` : `Received from #${txn.sender_id}`}</strong>
              <small>{formatTimestamp(txn.timestamp)}</small>
            </span>
            <span className={sent ? 'amount-debit' : 'amount-credit'}>
              {sent ? '-' : '+'}
              {currency.format(Number(txn.amount || 0))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [sessionUserId, setSessionUserId] = useState(() => localStorage.getItem('bank_user_id') || '')
  const [loginForm, setLoginForm] = useState(emptyLoginForm)
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm)
  const [transferForm, setTransferForm] = useState(emptyTransferForm)
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState(null)
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState({
    boot: false,
    login: false,
    register: false,
    transfer: false,
    refresh: false,
  })

  const currentUser = useMemo(
    () => users.find((user) => Number(user.user_id) === Number(sessionUserId)),
    [users, sessionUserId],
  )

  const userTransactions = useMemo(
    () =>
      transactions.filter(
        (txn) =>
          Number(txn.sender_id) === Number(sessionUserId) ||
          Number(txn.receiver_id) === Number(sessionUserId),
      ),
    [transactions, sessionUserId],
  )

  const showNotice = (type, message) => setNotice({ type, message })

  const setBusy = (key, value) =>
    setLoading((current) => ({
      ...current,
      [key]: value,
    }))

  const loadCustomerData = async ({ quiet = false } = {}) => {
    setBusy('refresh', true)

    try {
      const [usersResponse, transactionsResponse] = await Promise.allSettled([
        bankApi.getUsers(),
        bankApi.getTransactions(),
      ])

      if (usersResponse.status === 'fulfilled') {
        setUsers(usersResponse.value.users || [])
      }

      if (transactionsResponse.status === 'fulfilled') {
        setTransactions(transactionsResponse.value.transactions || [])
      }

      if (sessionUserId) {
        const balanceResponse = await bankApi.getBalance(Number(sessionUserId))
        setBalance(balanceResponse.balance)
      }

      if (!quiet) {
        showNotice('success', 'Account updated')
      }
    } catch (error) {
      showNotice('error', error.message)
    } finally {
      setBusy('refresh', false)
    }
  }

  useEffect(() => {
    setBusy('boot', true)

    bankApi
      .health()
      .then(() => loadCustomerData({ quiet: true }))
      .catch((error) => showNotice('error', `API unavailable at ${API_BASE}: ${error.message}`))
      .finally(() => setBusy('boot', false))
  }, [])

  useEffect(() => {
    if (sessionUserId) {
      loadCustomerData({ quiet: true })
    }
  }, [sessionUserId])

  const handleLogin = async (event) => {
    event.preventDefault()
    setBusy('login', true)

    try {
      const response = await bankApi.login({
        user_id: Number(loginForm.user_id),
        pan: loginForm.pan.trim().toUpperCase(),
      })
      const userId = String(response.user.user_id)

      setUsers((current) => {
        const withoutUser = current.filter((user) => Number(user.user_id) !== Number(userId))
        return [...withoutUser, response.user]
      })
      setBalance(response.user.balance)
      setSessionUserId(userId)
      setLoginForm(emptyLoginForm)
      localStorage.setItem('bank_user_id', userId)
      showNotice('success', 'Signed in successfully')
    } catch (error) {
      showNotice('error', 'Invalid customer ID or PAN')
    } finally {
      setBusy('login', false)
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setBusy('register', true)

    try {
      const response = await bankApi.addUser({
        ...cleanPayload(registerForm),
        balance: Number(registerForm.balance || 0),
      })

      const newUserId = String(response.user_id)
      setRegisterForm(emptyRegisterForm)
      setSessionUserId(newUserId)
      localStorage.setItem('bank_user_id', newUserId)
      showNotice('success', `Account opened. Your customer ID is #${newUserId}`)
      await loadCustomerData({ quiet: true })
    } catch (error) {
      showNotice('error', error.message)
    } finally {
      setBusy('register', false)
    }
  }

  const handleTransfer = async (event) => {
    event.preventDefault()
    setBusy('transfer', true)

    try {
      const response = await bankApi.transfer({
        sender_id: Number(sessionUserId),
        receiver_id: Number(transferForm.receiver_id),
        amount: Number(transferForm.amount),
      })

      setTransferForm(emptyTransferForm)
      setBalance(response.sender_balance)
      showNotice('success', 'Money sent successfully')
      await loadCustomerData({ quiet: true })
    } catch (error) {
      showNotice('error', error.message)
    } finally {
      setBusy('transfer', false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('bank_user_id')
    setSessionUserId('')
    setLoginForm(emptyLoginForm)
    setBalance(null)
    setNotice(null)
  }

  if (!sessionUserId) {
    return (
      <main className="auth-page">
        <section className="auth-hero">
          <div className="brand-lockup">
            <span className="brand-mark">K</span>
            <span>
              <strong>Kodama Bank</strong>
              <small>Personal banking</small>
            </span>
          </div>
          <h1>Bank from your own account.</h1>
          <p>Register once, sign in with your customer ID, and manage your balance and transfers.</p>
        </section>

        <section className="auth-panel">
          <div className="auth-tabs">
            <button
              className={authMode === 'login' ? 'active-tab' : ''}
              type="button"
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              className={authMode === 'register' ? 'active-tab' : ''}
              type="button"
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <Notice notice={notice} onClear={() => setNotice(null)} />

          {authMode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-heading">
                <User size={20} />
                <h2>Customer Login</h2>
              </div>
              <Field label="Customer ID">
                <input
                  required
                  min="1"
                  type="number"
                  value={loginForm.user_id}
                  onChange={(event) => setLoginForm({ ...loginForm, user_id: event.target.value })}
                  placeholder="Enter your customer ID"
                />
              </Field>
              <Field label="PAN Number">
                <input
                  required
                  value={loginForm.pan}
                  onChange={(event) => setLoginForm({ ...loginForm, pan: event.target.value })}
                  placeholder="ABCDE1234F"
                />
              </Field>
              <button className="primary-button full" type="submit" disabled={loading.login}>
                {loading.login ? <Loader2 size={18} className="spin" /> : <User size={18} />}
                Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-heading">
                <UserPlus size={20} />
                <h2>Open Account</h2>
              </div>
              <Field label="Full Name">
                <input
                  required
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                  placeholder="Your name"
                />
              </Field>
              <div className="field-pair">
                <Field label="Phone">
                  <input
                    required
                    value={registerForm.phone}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, phone: event.target.value })
                    }
                    placeholder="9876543210"
                  />
                </Field>
                <Field label="Email">
                  <input
                    required
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, email: event.target.value })
                    }
                    placeholder="you@example.com"
                  />
                </Field>
              </div>
              <div className="field-pair">
                <Field label="PAN">
                  <input
                    required
                    value={registerForm.pan}
                    onChange={(event) => setRegisterForm({ ...registerForm, pan: event.target.value })}
                    placeholder="ABCDE1234F"
                  />
                </Field>
                <Field label="Aadhar">
                  <input
                    required
                    value={registerForm.aadhar}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, aadhar: event.target.value })
                    }
                    placeholder="123412341234"
                  />
                </Field>
              </div>
              <Field label="Opening Balance">
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={registerForm.balance}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, balance: event.target.value })
                  }
                  placeholder="5000"
                />
              </Field>
              <button className="primary-button full" type="submit" disabled={loading.register}>
                {loading.register ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
                Create Account
              </button>
            </form>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="customer-app">
      <header className="customer-header">
        <div className="brand-lockup">
          <span className="brand-mark">K</span>
          <span>
            <strong>Kodama Bank</strong>
            <small>Customer #{sessionUserId}</small>
          </span>
        </div>
        <div className="header-actions">
          <button className="icon-button" type="button" onClick={() => loadCustomerData()}>
            <RefreshCw size={18} className={loading.refresh ? 'spin' : ''} />
          </button>
          <button className="secondary-button" type="button" onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <Notice notice={notice} onClear={() => setNotice(null)} />

      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>{currentUser?.name || 'Customer'}</h1>
          <p>Your account, transfers, and KYC status in one place.</p>
        </div>
        <div className="balance-tile">
          <span>Available balance</span>
          <strong>{balance === null ? currency.format(0) : currency.format(balance)}</strong>
        </div>
      </section>

      <section className="customer-grid">
        <div className="account-card">
          <div className="section-heading">
            <WalletCards size={20} />
            <h2>Account Summary</h2>
          </div>
          <div className="summary-row">
            <span>Customer ID</span>
            <strong>#{sessionUserId}</strong>
          </div>
          <div className="summary-row">
            <span>KYC Status</span>
            <strong className={currentUser?.kyc ? 'text-success' : 'text-muted'}>
              {currentUser?.kyc ? 'Verified' : 'Pending'}
            </strong>
          </div>
          <div className="summary-row">
            <span>Phone</span>
            <strong>{currentUser?.phone || '-'}</strong>
          </div>
          <div className="summary-row">
            <span>Email</span>
            <strong>{currentUser?.email || '-'}</strong>
          </div>
        </div>

        <form className="account-card" onSubmit={handleTransfer}>
          <div className="section-heading">
            <ArrowRightLeft size={20} />
            <h2>Send Money</h2>
          </div>
          <Field label="Receiver Customer ID">
            <input
              required
              min="1"
              type="number"
              value={transferForm.receiver_id}
              onChange={(event) =>
                setTransferForm({ ...transferForm, receiver_id: event.target.value })
              }
              placeholder="Enter receiver ID"
            />
          </Field>
          <Field label="Amount">
            <input
              required
              min="1"
              step="0.01"
              type="number"
              value={transferForm.amount}
              onChange={(event) => setTransferForm({ ...transferForm, amount: event.target.value })}
              placeholder="1000"
            />
          </Field>
          <p className="limit-note">Single transfer limit: ₹1,00,000. Daily limit: ₹5,00,000.</p>
          <button className="primary-button full" type="submit" disabled={loading.transfer}>
            {loading.transfer ? <Loader2 size={18} className="spin" /> : <IndianRupee size={18} />}
            Send Money
          </button>
        </form>

        <div className="account-card wide-card">
          <div className="section-heading">
            <Receipt size={20} />
            <h2>Your Transactions</h2>
          </div>
          <TransactionList transactions={userTransactions} userId={sessionUserId} />
        </div>

        <div className="account-card">
          <div className="section-heading">
            <ShieldCheck size={20} />
            <h2>KYC Details</h2>
          </div>
          <div className="summary-row">
            <span>PAN</span>
            <strong>{currentUser?.pan || '-'}</strong>
          </div>
          <div className="summary-row">
            <span>Aadhar</span>
            <strong>{currentUser?.aadhar || '-'}</strong>
          </div>
          <button className="secondary-button full" type="button" onClick={handleLogout}>
            <ArrowLeft size={17} />
            Switch Account
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
