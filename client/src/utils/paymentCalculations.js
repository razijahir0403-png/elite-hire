import { PAYMENT_STATUS } from './statusMaster';

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const getTotalPaidAmount = (record) =>
  roundMoney(record?.totalPaidAmount ?? record?.receivedAmount ?? 0);

export const calculateDueAmount = (totalAmount, totalPaidAmount) => {
  const total = roundMoney(totalAmount);
  const paid = roundMoney(totalPaidAmount);
  return Math.max(0, roundMoney(total - paid));
};

export const calculatePaymentStatus = (totalAmount, totalPaidAmount) => {
  const total = roundMoney(totalAmount);
  const paid = roundMoney(totalPaidAmount);
  const due = calculateDueAmount(total, paid);

  if (paid <= 0) return PAYMENT_STATUS.PENDING;
  if (due < 0.01 || paid >= total - 0.01) return PAYMENT_STATUS.PAID;
  return PAYMENT_STATUS.PARTIALLY_PAID;
};

export const getRecordStatus = (record) =>
  calculatePaymentStatus(record?.totalAmount, getTotalPaidAmount(record));

export const calculateUpdatedTotals = (totalAmount, alreadyPaid, newPaymentAmount) => {
  const total = roundMoney(totalAmount);
  const existingPaid = roundMoney(alreadyPaid);
  const newPay = roundMoney(newPaymentAmount);
  const updatedPaid = roundMoney(existingPaid + newPay);
  const updatedDue = calculateDueAmount(total, updatedPaid);
  const updatedStatus = calculatePaymentStatus(total, updatedPaid);
  return { updatedPaid, updatedDue, updatedStatus };
};
