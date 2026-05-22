const { PAYMENT_STATUS } = require('./statusMaster');

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const calculateDueAmount = (totalAmount, totalPaidAmount) => {
  const total = roundMoney(totalAmount);
  const paid = roundMoney(totalPaidAmount);
  return Math.max(0, roundMoney(total - paid));
};

const calculatePaymentStatus = (totalAmount, totalPaidAmount) => {
  const total = roundMoney(totalAmount);
  const paid = roundMoney(totalPaidAmount);
  const due = calculateDueAmount(total, paid);

  if (paid <= 0) return PAYMENT_STATUS.PENDING;
  if (due < 0.01 || paid >= total - 0.01) return PAYMENT_STATUS.PAID;
  return PAYMENT_STATUS.PARTIALLY_PAID;
};

const getTotalPaidAmount = (record) =>
  roundMoney(record?.totalPaidAmount ?? record?.receivedAmount ?? 0);

const syncPaymentTotals = (record) => {
  const totalAmount = roundMoney(record.totalAmount);
  const totalPaidAmount = getTotalPaidAmount(record);
  const dueAmount = calculateDueAmount(totalAmount, totalPaidAmount);
  const status = calculatePaymentStatus(totalAmount, totalPaidAmount);

  return {
    totalAmount,
    totalPaidAmount,
    dueAmount,
    status,
  };
};

const validateContactNumber = (contactNumber) => {
  const digits = String(contactNumber).replace(/\D/g, '');
  if (digits.length !== 10) {
    return 'Contact number must be exactly 10 digits';
  }
  return null;
};

const validateNewPaymentAmount = (newPaymentAmount, currentDueAmount) => {
  const amount = roundMoney(newPaymentAmount);

  if (Number.isNaN(amount) || amount <= 0) {
    return 'New payment amount must be greater than zero';
  }

  const due = roundMoney(currentDueAmount);
  if (amount > due + 0.001) {
    return 'New payment amount cannot exceed due amount';
  }

  return null;
};

const validateInitialPaymentAmount = (totalAmount, initialPaymentAmount) => {
  const total = roundMoney(totalAmount);
  const initial = roundMoney(initialPaymentAmount) || 0;

  if (Number.isNaN(total) || total <= 0) {
    return 'Total amount must be a positive number';
  }

  if (Number.isNaN(initial) || initial < 0) {
    return 'Initial payment amount must be zero or positive';
  }

  if (initial > total) {
    return 'Initial payment cannot exceed total amount';
  }

  if (initial > 0 && initial < 0.01) {
    return 'Initial payment amount must be greater than zero when provided';
  }

  return null;
};

module.exports = {
  PAYMENT_STATUS,
  roundMoney,
  calculateDueAmount,
  calculatePaymentStatus,
  getTotalPaidAmount,
  syncPaymentTotals,
  validateContactNumber,
  validateNewPaymentAmount,
  validateInitialPaymentAmount,
};
