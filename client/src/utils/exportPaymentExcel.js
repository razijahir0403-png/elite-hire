import * as XLSX from 'xlsx';
import { PaymentStatus } from './statusMaster';

const getPaid = (r) => r.totalPaidAmount ?? r.receivedAmount ?? 0;

const statusLabel = (code) => PaymentStatus[Number(code)] ?? '';

export const exportPaymentsToExcel = (records, filenamePrefix = 'payment-tracker-export') => {
  const rows = records.map((r) => ({
    'Candidate Name': r.candidateName || '',
    'ID Number': r.idNumber || '',
    'Contact Number': r.contactNumber || '',
    'Course Detail': r.courseDetail || '',
    'Total Amount': r.totalAmount ?? '',
    'Total Paid': getPaid(r),
    'Due Amount': r.dueAmount ?? '',
    Status: statusLabel(r.status),
    'Last Payment': r.lastPaymentDate ? new Date(r.lastPaymentDate).toLocaleDateString() : '',
    'Created At': r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}-${dateStamp}.xlsx`);
};
