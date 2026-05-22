export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const maskPhone = (phone) => {
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '+91 $1 $2 $3')
}

export const getTransactionIcon = (type) => {
  switch (type) {
    case 'TRANSFER':
      return '↗'
    case 'REQUEST':
      return '↙'
    case 'BILL_PAYMENT':
      return '💳'
    default:
      return '↔'
  }
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-600'
    case 'PENDING':
      return 'text-yellow-600'
    case 'FAILED':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}
