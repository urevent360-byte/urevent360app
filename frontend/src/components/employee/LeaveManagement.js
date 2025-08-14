import React, { useState } from 'react';
import { Calendar, Plus, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([
    {
      id: '1',
      type: 'Annual Leave',
      startDate: '2024-02-20',
      endDate: '2024-02-22',
      days: 3,
      status: 'approved',
      reason: 'Family vacation',
      appliedDate: '2024-02-10'
    },
    {
      id: '2',
      type: 'Sick Leave',
      startDate: '2024-02-15',
      endDate: '2024-02-15',
      days: 1,
      status: 'pending',
      reason: 'Medical appointment',
      appliedDate: '2024-02-14'
    }
  ]);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const leaveBalance = {
    annual: { used: 5, total: 20 },
    sick: { used: 2, total: 10 },
    personal: { used: 1, total: 5 }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return X;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Manage your leave requests and track balance</p>
        </div>
        <button
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" />
          Apply Leave
        </button>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(leaveBalance).map(([type, balance]) => (
          <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 capitalize">{type} Leave</h3>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {balance.total - balance.used} days left
            </div>
            <div className="text-sm text-gray-600">
              Used: {balance.used} / {balance.total} days
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${(balance.used / balance.total) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Leave Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Leave Requests</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {leaves.map(leave => {
              const StatusIcon = getStatusIcon(leave.status);
              return (
                <div key={leave.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{leave.type}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {leave.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Duration:</span><br />
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Days:</span><br />
                          {leave.days} day{leave.days > 1 ? 's' : ''}
                        </div>
                        <div>
                          <span className="font-medium">Applied:</span><br />
                          {new Date(leave.appliedDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="font-medium text-sm text-gray-700">Reason:</span>
                        <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Apply for Leave</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal Leave">Personal Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    rows="3"
                    placeholder="Please provide reason for leave"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle leave application
                    setShowLeaveModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Apply Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;