import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, User, Phone, Mail, MapPin, CheckCircle, X, Eye } from 'lucide-react';

const VendorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock data for vendor bookings
    setBookings([
      {
        id: '1',
        eventName: 'Sarah & John Wedding',
        clientName: 'Sarah Johnson',
        clientEmail: 'sarah.johnson@email.com',
        clientPhone: '(555) 123-4567',
        serviceDate: '2024-02-15',
        serviceTime: '6:00 PM',
        location: 'Grand Ballroom Hotel',
        service: 'Wedding Catering',
        status: 'confirmed',
        amount: 2500,
        notes: 'Vegetarian options required for 20 guests'
      },
      {
        id: '2',
        eventName: 'Corporate Annual Gala',
        clientName: 'TechCorp Inc.',
        clientEmail: 'events@techcorp.com',
        clientPhone: '(555) 987-6543',
        serviceDate: '2024-02-20',
        serviceTime: '7:00 PM',
        location: 'Convention Center',
        service: 'Corporate Catering',
        status: 'pending',
        amount: 3200,
        notes: 'Formal dinner for 150 guests'
      },
      {
        id: '3',
        eventName: 'Birthday Celebration',
        clientName: 'Mike Wilson',
        clientEmail: 'mike.wilson@email.com',
        clientPhone: '(555) 456-7890',
        serviceDate: '2024-01-25',
        serviceTime: '2:00 PM',
        location: 'Private Residence',
        service: 'Party Catering',
        status: 'completed',
        amount: 800,
        notes: 'Casual buffet style'
      }
    ]);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleStatusUpdate = (bookingId, newStatus) => {
    setBookings(bookings.map(booking => 
      booking.id === bookingId ? { ...booking, status: newStatus } : booking
    ));
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600">Manage your service bookings</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1">
          {[
            { id: 'all', name: 'All', count: bookings.length },
            { id: 'pending', name: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
            { id: 'confirmed', name: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
            { id: 'completed', name: 'Completed', count: bookings.filter(b => b.status === 'completed').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                filter === tab.id
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{booking.eventName}</h3>
                <p className="text-gray-600">{booking.service}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">${booking.amount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Client Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Client Information</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  {booking.clientName}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {booking.clientEmail}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {booking.clientPhone}
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Event Details</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(booking.serviceDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {booking.serviceTime}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {booking.location}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Special Notes</h4>
                <p className="text-sm text-gray-600">{booking.notes}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm">
                  <Eye className="w-4 h-4 inline mr-2" />
                  View Details
                </button>
                <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Contact Client
                </button>
              </div>

              <div className="flex items-center gap-2">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <X className="w-4 h-4 inline mr-2" />
                      Decline
                    </button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'completed')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">
            {filter === 'all' ? 'You have no bookings yet.' : `No ${filter} bookings found.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorBookings;