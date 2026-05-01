import React from 'react';
import { X, User, Mail, MapPin, Phone, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { StudentDetails } from '../../types/student';
import { StatusBadge } from '../common/StatusBadge';

interface StudentDetailsModalProps {
  student: StudentDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !student) return null;

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-semibold">
              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{student.name}</h2>
              <p className="text-gray-500">{student.collegeId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Student Info */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{student.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Route</p>
                  <p className="text-sm font-medium text-gray-900">{student.routeName || 'Not assigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Fee Status</span>
                </div>
                <StatusBadge status={student.feeStatus} variant="fee" />
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Attendance</span>
                </div>
                <span className={`text-lg font-bold ${getAttendanceColor(student.attendancePercentage)}`}>
                  {student.attendancePercentage}%
                </span>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Status</span>
                </div>
                <StatusBadge status={student.status} />
              </div>
            </div>

            {/* Payment History */}
            {student.payments && student.payments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Payment History
                </h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Month</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {student.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-2 text-gray-900">{payment.month}</td>
                          <td className="px-4 py-2 text-gray-900">₹{payment.amount}</td>
                          <td className="px-4 py-2">
                            <StatusBadge status={payment.status} variant="fee" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attendance Summary */}
            {student.attendance && student.attendance.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Attendance Summary
                </h3>
                <div className="space-y-2">
                  {student.attendance.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">{record.month}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">{record.present}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">{record.absent}</span>
                        </div>
                        <span className={`text-sm font-bold w-12 text-right ${getAttendanceColor(record.percentage)}`}>
                          {record.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
