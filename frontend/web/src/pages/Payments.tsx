import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, CreditCard, CheckCircle, XCircle, Clock, DollarSign, Calendar } from 'lucide-react';
import axios from 'axios';

interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  type: 'MONTHLY_PASS' | 'SEMESTER_PASS' | 'ONE_TIME';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  month: string;
  createdAt: string;
}

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-04');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, typeFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/admin/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          month: selectedMonth,
        },
      });
      
      setPayments(response.data.data.payments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
      setPayments([
        { id: '1', studentId: 'STU001', studentName: 'John Doe', amount: 1500, currency: 'INR', status: 'COMPLETED', type: 'MONTHLY_PASS', razorpayOrderId: 'order_123', razorpayPaymentId: 'pay_123', month: '2024-04', createdAt: '2024-04-01' },
        { id: '2', studentId: 'STU002', studentName: 'Jane Smith', amount: 4000, currency: 'INR', status: 'COMPLETED', type: 'SEMESTER_PASS', razorpayOrderId: 'order_124', razorpayPaymentId: 'pay_124', month: '2024-04', createdAt: '2024-04-02' },
        { id: '3', studentId: 'STU003', studentName: 'Mike Johnson', amount: 1500, currency: 'INR', status: 'PENDING', type: 'MONTHLY_PASS', month: '2024-04', createdAt: '2024-04-03' },
        { id: '4', studentId: 'STU004', studentName: 'Sarah Williams', amount: 1500, currency: 'INR', status: 'FAILED', type: 'MONTHLY_PASS', month: '2024-04', createdAt: '2024-04-04' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'PENDING')
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Revenue</h1>
          <p className="text-gray-500 mt-1">Track payments, revenue, and transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Pending Amount', value: `₹${pendingAmount.toLocaleString()}`, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Total Transactions', value: payments.length, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Successful', value: payments.filter(p => p.status === 'COMPLETED').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by student name or payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Types</option>
          <option value="MONTHLY_PASS">Monthly Pass</option>
          <option value="SEMESTER_PASS">Semester Pass</option>
          <option value="ONE_TIME">One Time</option>
        </select>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading payments...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.studentName}</p>
                          <p className="text-sm text-gray-500">{payment.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {payment.type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {payment.razorpayPaymentId || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
