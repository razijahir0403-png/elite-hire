import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  History,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Download,
  Wallet,
  Users,
  IndianRupee,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { API_PATHS } from '../constants/apiPaths';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { exportPaymentsToExcel } from '../utils/exportPaymentExcel';
import {
  calculateDueAmount,
  calculatePaymentStatus,
  calculateUpdatedTotals,
  getTotalPaidAmount,
  getRecordStatus,
} from '../utils/paymentCalculations';
import { cleanQueryParams } from '../utils/queryParams';
import { paymentFilterOptions, PaymentStatus, getStatusBadgeClass } from '../utils/statusMaster';
import StatusBadge from '../components/StatusBadge';

const emptyForm = {
  candidateName: '',
  idNumber: '',
  contactNumber: '',
  totalAmount: '',
  courseDetail: '',
  initialPaymentAmount: '',
  newPaymentAmount: '',
  remarks: '',
};

const PaymentTracker = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    totalCandidates: 0,
    totalAmount: 0,
    totalReceived: 0,
    totalDue: 0,
  });

  const [searchCandidate, setSearchCandidate] = useState('');
  const [searchIdNumber, setSearchIdNumber] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const filterParams = useMemo(
    () => ({
      searchCandidate,
      searchIdNumber,
      status: statusFilter,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    }),
    [searchCandidate, searchIdNumber, statusFilter, dateFrom, dateTo, sortBy, sortOrder]
  );

  const hasActiveFilters = Boolean(
    searchCandidate || searchIdNumber || statusFilter || dateFrom || dateTo
  );

  const alreadyPaid = activeRecord ? getTotalPaidAmount(activeRecord) : 0;
  const currentDue = activeRecord
    ? calculateDueAmount(activeRecord.totalAmount, alreadyPaid)
    : calculateDueAmount(formData.totalAmount, formData.initialPaymentAmount);

  const addTotals = {
    due: calculateDueAmount(formData.totalAmount, formData.initialPaymentAmount),
    status: calculatePaymentStatus(formData.totalAmount, formData.initialPaymentAmount),
  };

  const editTotals = activeRecord
    ? calculateUpdatedTotals(activeRecord.totalAmount, alreadyPaid, formData.newPaymentAmount)
    : { updatedPaid: 0, updatedDue: 0, updatedStatus: 0 };

  const buildApiParams = (pageOverride) =>
    cleanQueryParams({
      page: pageOverride ?? page,
      limit,
      ...filterParams,
    });

  const fetchSummary = async (pageOverride) => {
    try {
      const { data } = await api.get(API_PATHS.paymentTracker.summary, {
        params: buildApiParams(pageOverride),
      });
      setSummary(data);
    } catch {
      setSummary({ totalCandidates: 0, totalAmount: 0, totalReceived: 0, totalDue: 0 });
    }
  };

  const fetchRecords = async (pageOverride) => {
    setLoading(true);
    try {
      const { data } = await api.get(API_PATHS.paymentTracker.list, {
        params: buildApiParams(pageOverride),
      });
      setRecords(data.records || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.totalRecords || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchSummary();
  }, [page, limit, statusFilter, dateFrom, dateTo, sortBy, sortOrder, searchCandidate, searchIdNumber]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords(1);
    fetchSummary();
  };

  const resetFilters = () => {
    setSearchCandidate('');
    setSearchIdNumber('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.candidateName.trim()) errors.candidateName = 'Candidate name is required';
    if (!formData.idNumber.trim()) errors.idNumber = 'ID number is required';
    if (!/^\d{10}$/.test(formData.contactNumber)) {
      errors.contactNumber = 'Contact number must be exactly 10 digits';
    }
    if (!formData.courseDetail.trim()) errors.courseDetail = 'Course detail is required';

    const total = Number(formData.totalAmount);

    if (activeRecord) {
      const newPay = Number(formData.newPaymentAmount);
      if (formData.newPaymentAmount !== '' && formData.newPaymentAmount !== undefined) {
        if (Number.isNaN(newPay) || newPay <= 0) {
          errors.newPaymentAmount = 'New payment amount must be greater than zero';
        } else if (newPay > currentDue) {
          errors.newPaymentAmount = 'New payment amount cannot exceed due amount';
        }
      }
    } else {
      if (!formData.totalAmount || Number.isNaN(total) || total <= 0) {
        errors.totalAmount = 'Total amount must be a positive number';
      }
      const initial = formData.initialPaymentAmount === '' ? 0 : Number(formData.initialPaymentAmount);
      if (Number.isNaN(initial) || initial < 0) {
        errors.initialPaymentAmount = 'Initial payment must be zero or positive';
      } else if (initial > 0 && initial > total) {
        errors.initialPaymentAmount = 'Initial payment cannot exceed total amount';
      } else if (initial > 0 && initial < 0.01) {
        errors.initialPaymentAmount = 'Initial payment must be greater than zero when provided';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    setActiveRecord(null);
    setFormData(emptyForm);
    setFormErrors({});
    setIsAddEditOpen(true);
  };

  const handleEditClick = (record) => {
    setActiveRecord(record);
    setFormData({
      candidateName: record.candidateName || '',
      idNumber: record.idNumber || '',
      contactNumber: record.contactNumber || '',
      totalAmount: String(record.totalAmount ?? ''),
      courseDetail: record.courseDetail || '',
      initialPaymentAmount: '',
      newPaymentAmount: '',
      remarks: '',
    });
    setFormErrors({});
    setIsAddEditOpen(true);
  };

  const handleViewClick = (record) => {
    setActiveRecord(record);
    setIsViewOpen(true);
  };

  const handleAddEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (activeRecord) {
        await api.put(API_PATHS.paymentTracker.detail(activeRecord._id), {
          candidateName: formData.candidateName.trim(),
          idNumber: formData.idNumber.trim(),
          contactNumber: formData.contactNumber,
          courseDetail: formData.courseDetail.trim(),
        });

        const newPay = Number(formData.newPaymentAmount);
        if (formData.newPaymentAmount !== '' && newPay > 0) {
          await api.post(API_PATHS.paymentTracker.payments(activeRecord._id), {
            newPaymentAmount: newPay,
            remarks: formData.remarks.trim(),
          });
          toast.success('Installment recorded successfully!');
        } else {
          toast.success('Payment record updated successfully!');
        }

        setIsAddEditOpen(false);
        await fetchRecords();
        await fetchSummary();
      } else {
        const initialPaymentAmount =
          formData.initialPaymentAmount === '' ? 0 : Number(formData.initialPaymentAmount);

        await api.post(API_PATHS.paymentTracker.list, {
          candidateName: formData.candidateName.trim(),
          idNumber: formData.idNumber.trim(),
          contactNumber: formData.contactNumber,
          totalAmount: Number(formData.totalAmount),
          courseDetail: formData.courseDetail.trim(),
          initialPaymentAmount,
          remarks: formData.remarks.trim(),
        });
        toast.success('Payment record created successfully!');
        setIsAddEditOpen(false);
        setPage(1);
        await fetchRecords(1);
        await fetchSummary();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing payment record.');
    }
  };

  const handleDeleteClick = (record) => {
    setActiveRecord(record);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(API_PATHS.paymentTracker.detail(activeRecord._id));
      toast.success('Payment record deleted.');
      setIsDeleteOpen(false);
      fetchRecords();
      fetchSummary();
    } catch {
      toast.error('Failed to delete payment record.');
    }
  };

  const handleHistoryClick = async (record) => {
    setActiveRecord(record);
    setHistoryLoading(true);
    setIsHistoryOpen(true);
    try {
      const { data } = await api.get(API_PATHS.paymentTracker.history(record._id));
      setHistoryList(data);
    } catch {
      toast.error('Could not fetch payment history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchAllRecordsForExport = async () => {
    const pageSize = 100;
    const allRecords = [];
    let currentPage = 1;
    let pagesToFetch = 1;

    do {
      const { data } = await api.get(API_PATHS.paymentTracker.list, {
        params: cleanQueryParams({ page: currentPage, limit: pageSize, ...filterParams }),
      });
      allRecords.push(...(data.records || []));
      pagesToFetch = data.pagination?.totalPages || 1;
      currentPage += 1;
    } while (currentPage <= pagesToFetch);

    return allRecords;
  };

  const handleExportExcel = async () => {
    if (totalRecords === 0) {
      toast.info('No records to export.');
      return;
    }
    setExporting(true);
    try {
      const exportRecords = await fetchAllRecordsForExport();
      if (exportRecords.length === 0) {
        toast.info('No records to export.');
        return;
      }
      const prefix = hasActiveFilters ? 'payment-tracker-filtered' : 'payment-tracker-all';
      exportPaymentsToExcel(exportRecords, prefix);
      toast.success(`Exported ${exportRecords.length} record(s) to Excel.`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export records.');
    } finally {
      setExporting(false);
    }
  };

  const getRowStyle = (status) => {
    const code = Number(status);
    if (code === 2) return 'bg-emerald-50/40';
    if (code === 1) return 'bg-yellow-50/40';
    return 'bg-red-50/30';
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
      value || 0
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payment Tracker</h1>
          <p className="text-xs text-slate-500">Track candidate payments, dues, and payment history</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-brand-800 to-blue-700 hover:from-brand-700 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-glow-brand transition-all uppercase tracking-wider"
        >
          <Plus size={16} />
          <span>Add Payment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', value: summary.totalCandidates, icon: Users, color: 'brand' },
          { label: 'Total Amount', value: formatCurrency(summary.totalAmount), icon: Wallet, color: 'blue' },
          { label: 'Total Paid', value: formatCurrency(summary.totalReceived), icon: IndianRupee, color: 'emerald' },
          { label: 'Total Due', value: formatCurrency(summary.totalDue), icon: AlertCircle, color: 'red' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-50 text-brand-800">
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Candidate Name</label>
            <input
              type="text"
              value={searchCandidate}
              onChange={(e) => setSearchCandidate(e.target.value)}
              placeholder="Search name..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
            />
          </div>
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">ID Number</label>
            <input
              type="text"
              value={searchIdNumber}
              onChange={(e) => setSearchIdNumber(e.target.value)}
              placeholder="Search ID..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-brand-800"
            >
              <option value="">All Statuses</option>
              {paymentFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-brand-800"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-brand-800"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button type="submit" className="flex-1 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold">
              Search
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="p-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-xl" title="Clear Filters">
                <X size={14} />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="flex flex-row items-center justify-between gap-4 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">Show</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none focus:border-brand-800"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-500 font-medium">entries</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || totalRecords === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold uppercase tracking-wide"
          >
            {exporting ? <Spinner size="small" /> : <Download size={14} />}
            <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
          </button>
          <div className="text-slate-500 text-[11px] font-bold tracking-wide uppercase">
            Total Records: <span className="font-extrabold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">{totalRecords}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex items-center justify-center"><Spinner /></div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center">
            <Wallet size={48} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-semibold">No payment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                  <th className="px-4 py-4">S.No</th>
                  <th onClick={() => handleSort('candidateName')} className="px-4 py-4 cursor-pointer hover:text-slate-800">
                    <div className="flex items-center space-x-1">
                      <span>Candidate Name</span>
                      {sortBy === 'candidateName' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('totalAmount')} className="px-4 py-4 cursor-pointer">Total Amount</th>
                  <th onClick={() => handleSort('totalPaidAmount')} className="px-4 py-4 cursor-pointer">Total Paid</th>
                  <th onClick={() => handleSort('dueAmount')} className="px-4 py-4 cursor-pointer">Due Amount</th>
                  <th onClick={() => handleSort('lastPaymentDate')} className="px-4 py-4 cursor-pointer">Last Payment</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {records.map((r, index) => {
                  const displayStatus = getRecordStatus(r);
                  return (
                  <tr key={r._id} className={`hover:opacity-90 transition-colors ${getRowStyle(displayStatus)}`}>
                    <td className="px-4 py-4 font-bold text-slate-600">{(page - 1) * limit + index + 1}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">{r.candidateName}</td>
                    <td className="px-4 py-4 font-medium">{formatCurrency(r.totalAmount)}</td>
                    <td className="px-4 py-4 font-medium text-emerald-700">{formatCurrency(getTotalPaidAmount(r))}</td>
                    <td className="px-4 py-4 font-medium text-red-700">{formatCurrency(calculateDueAmount(r.totalAmount, getTotalPaidAmount(r)))}</td>
                    <td className="px-4 py-4 text-slate-500">
                      {r.lastPaymentDate ? new Date(r.lastPaymentDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={displayStatus} type="payment" />
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button onClick={() => handleViewClick(r)} className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-blue-50 rounded-lg text-slate-500" title="View"><Eye size={13} /></button>
                        <button onClick={() => handleEditClick(r)} className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-brand-50 rounded-lg text-slate-500" title="Record Payment"><Edit2 size={13} /></button>
                        <button onClick={() => handleDeleteClick(r)} className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-red-50 rounded-lg text-slate-500" title="Delete"><Trash2 size={13} /></button>
                        <button onClick={() => handleHistoryClick(r)} className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-blue-50 rounded-lg text-slate-500" title="View History"><History size={13} /></button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && records.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalRecords)} of {totalRecords}
            </span>
            <div className="flex items-center space-x-1.5">
              <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-50"><ChevronLeft size={14} /></button>
              <span className="text-xs font-bold px-3 py-1 border border-slate-200 rounded-lg">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-50"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={activeRecord ? `Record Payment: ${activeRecord.idNumber}` : 'Add Payment Record'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddEditSubmit} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Candidate Name *</label>
            <input type="text" required value={formData.candidateName} onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            {formErrors.candidateName && <p className="text-[10px] text-red-600 mt-1">{formErrors.candidateName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">ID Number *</label>
              <input type="text" required value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              {formErrors.idNumber && <p className="text-[10px] text-red-600 mt-1">{formErrors.idNumber}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Contact Number *</label>
              <input type="text" maxLength={10} value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              {formErrors.contactNumber && <p className="text-[10px] text-red-600 mt-1">{formErrors.contactNumber}</p>}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Course Detail *</label>
            <textarea rows={3} required value={formData.courseDetail} onChange={(e) => setFormData({ ...formData, courseDetail: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            {formErrors.courseDetail && <p className="text-[10px] text-red-600 mt-1">{formErrors.courseDetail}</p>}
          </div>

          {!activeRecord ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Total Amount *</label>
                  <input type="number" min="0.01" step="0.01" required value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                  {formErrors.totalAmount && <p className="text-[10px] text-red-600 mt-1">{formErrors.totalAmount}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Initial Payment Amount</label>
                  <input type="number" min="0" step="0.01" value={formData.initialPaymentAmount} onChange={(e) => setFormData({ ...formData, initialPaymentAmount: e.target.value })} placeholder="0 for Pending" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                  {formErrors.initialPaymentAmount && <p className="text-[10px] text-red-600 mt-1">{formErrors.initialPaymentAmount}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Due Amount</label>
                  <input type="text" readOnly value={addTotals.due} className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status</label>
                  <input type="text" readOnly value={PaymentStatus[addTotals.status] || ''} className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold ${getStatusBadgeClass('payment', addTotals.status)}`} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Total Amount</label>
                  <input type="text" readOnly value={formatCurrency(activeRecord.totalAmount)} className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Already Paid</label>
                  <input type="text" readOnly value={formatCurrency(alreadyPaid)} className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-emerald-700 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Current Due Amount</label>
                <input type="text" readOnly value={formatCurrency(currentDue)} className="w-full px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">New Payment Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.newPaymentAmount}
                  onChange={(e) => setFormData({ ...formData, newPaymentAmount: e.target.value })}
                  placeholder={`Max ${currentDue}`}
                  disabled={currentDue <= 0}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:opacity-50"
                />
                {formErrors.newPaymentAmount && <p className="text-[10px] text-red-600 mt-1">{formErrors.newPaymentAmount}</p>}
                {currentDue <= 0 && <p className="text-[10px] text-emerald-600 mt-1">Payment is already fully paid.</p>}
              </div>
              {formData.newPaymentAmount !== '' && Number(formData.newPaymentAmount) > 0 && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-brand-50/50 border border-brand-100 rounded-xl">
                  <div>
                    <p className="text-[9px] uppercase text-slate-500 font-bold">Updated Paid</p>
                    <p className="text-xs font-extrabold text-emerald-700">{formatCurrency(editTotals.updatedPaid)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-slate-500 font-bold">Updated Due</p>
                    <p className="text-xs font-extrabold text-red-700">{formatCurrency(editTotals.updatedDue)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-slate-500 font-bold">Status</p>
                    <p className={`text-[10px] font-bold ${getStatusBadgeClass('payment', editTotals.updatedStatus)} px-1 py-0.5 rounded`}>{PaymentStatus[editTotals.updatedStatus] || ''}</p>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Remarks</label>
            <input type="text" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Optional payment note" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsAddEditOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-brand-800 to-blue-700 text-white font-bold text-xs rounded-xl">
              {activeRecord ? 'Save / Record Payment' : 'Add Payment'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={`View Payment: ${activeRecord?.idNumber}`} maxWidth="max-w-md">
        {activeRecord && (
          <div className="space-y-3 text-xs text-slate-700">
            <p><span className="font-bold">Candidate:</span> {activeRecord.candidateName}</p>
            <p><span className="font-bold">ID Number:</span> {activeRecord.idNumber}</p>
            <p><span className="font-bold">Contact:</span> {activeRecord.contactNumber}</p>
            <p><span className="font-bold">Course:</span> {activeRecord.courseDetail}</p>
            <p><span className="font-bold">Total:</span> {formatCurrency(activeRecord.totalAmount)}</p>
            <p><span className="font-bold">Total Paid:</span> {formatCurrency(getTotalPaidAmount(activeRecord))}</p>
            <p><span className="font-bold">Due:</span> {formatCurrency(activeRecord.dueAmount)}</p>
            <p><span className="font-bold">Last Payment:</span> {activeRecord.lastPaymentDate ? new Date(activeRecord.lastPaymentDate).toLocaleString() : '—'}</p>
            <p><span className="font-bold">Status:</span> {PaymentStatus[getRecordStatus(activeRecord)] || ''}</p>
            <p><span className="font-bold">Created:</span> {new Date(activeRecord.createdAt).toLocaleString()}</p>
          </div>
        )}
      </Modal>

      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`Payment History: ${activeRecord?.idNumber}`} maxWidth="max-w-2xl">
        {historyLoading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : historyList.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-8">No payment transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Paid Now</th>
                  <th className="px-3 py-2">Total Paid</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Remarks</th>
                  <th className="px-3 py-2">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyList.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(h.paymentDate || h.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 font-bold text-emerald-700">{formatCurrency(h.paidAmount)}</td>
                    <td className="px-3 py-2 font-bold">{formatCurrency(h.updatedTotalPaid)}</td>
                    <td className="px-3 py-2 font-bold text-red-700">{formatCurrency(h.updatedDue)}</td>
                    <td className="px-3 py-2 text-slate-600">{h.remarks || '—'}</td>
                    <td className="px-3 py-2">{h.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Delete">
        <p className="text-xs text-slate-600 mb-4">Delete payment record for <strong>{activeRecord?.candidateName}</strong> ({activeRecord?.idNumber})?</p>
        <div className="flex space-x-3">
          <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold">Cancel</button>
          <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentTracker;
