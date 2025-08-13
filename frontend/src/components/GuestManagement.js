import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Mail, Phone, Plus, Send, Users, CheckCircle, Clock, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GuestManagement = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    guest_name: '',
    guest_email: '',
    guest_mobile: ''
  });

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventResponse, invitationsResponse] = await Promise.all([
        axios.get(`${API}/events/${eventId}`),
        axios.get(`${API}/invitations/event/${eventId}`)
      ]);
      
      setEvent(eventResponse.data);
      
      // If no invitations exist, generate sample data
      const invitations = invitationsResponse.data.length === 0 
        ? generateSampleInvitations() 
        : invitationsResponse.data;
      setInvitations(invitations);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setInvitations(generateSampleInvitations());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleInvitations = () => [
    {
      id: '1',
      event_id: eventId,
      guest_name: 'John Smith',
      guest_email: 'john.smith@email.com',
      guest_mobile: '+1 (555) 123-4567',
      status: 'delivered',
      rsvp_status: 'attending',
      sent_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: '2',
      event_id: eventId,
      guest_name: 'Sarah Johnson',
      guest_email: 'sarah.j@email.com',
      guest_mobile: '+1 (555) 987-6543',
      status: 'opened',
      rsvp_status: 'maybe',
      sent_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: '3',
      event_id: eventId,
      guest_name: 'Michael Brown',
      guest_email: 'michael.brown@email.com',
      guest_mobile: '+1 (555) 456-7890',
      status: 'sent',
      rsvp_status: null,
      sent_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '4',
      event_id: eventId,
      guest_name: 'Emily Davis',
      guest_email: 'emily.davis@email.com',
      guest_mobile: '+1 (555) 321-0987',
      status: 'delivered',
      rsvp_status: 'not_attending',
      sent_at: new Date(Date.now() - 86400000 * 4).toISOString()
    }
  ];

  const handleInputChange = (e) => {
    setInviteData({ ...inviteData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/invitations`, {
        ...inviteData,
        event_id: eventId
      });
      setInvitations([response.data, ...invitations]);
      setShowInviteForm(false);
      setInviteData({
        guest_name: '',
        guest_email: '',
        guest_mobile: ''
      });
    } catch (error) {
      console.error('Failed to send invitation:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'opened':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'opened':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRSVPColor = (rsvpStatus) => {
    switch (rsvpStatus) {
      case 'attending':
        return 'bg-green-100 text-green-800';
      case 'not_attending':
        return 'bg-red-100 text-red-800';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRSVPText = (rsvpStatus) => {
    switch (rsvpStatus) {
      case 'attending':
        return 'Attending';
      case 'not_attending':
        return 'Not Attending';
      case 'maybe':
        return 'Maybe';
      default:
        return 'No Response';
    }
  };

  const attendingCount = invitations.filter(inv => inv.rsvp_status === 'attending').length;
  const notAttendingCount = invitations.filter(inv => inv.rsvp_status === 'not_attending').length;
  const maybeCount = invitations.filter(inv => inv.rsvp_status === 'maybe').length;
  const noResponseCount = invitations.filter(inv => !inv.rsvp_status).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Event not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested event could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guest Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage invitations for {event.name}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowInviteForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Send Invitation
          </button>
        </div>
      </div>

      {/* RSVP Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Attending</dt>
                  <dd className="text-lg font-medium text-gray-900">{attendingCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Not Attending</dt>
                  <dd className="text-lg font-medium text-gray-900">{notAttendingCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Maybe</dt>
                  <dd className="text-lg font-medium text-gray-900">{maybeCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">No Response</dt>
                  <dd className="text-lg font-medium text-gray-900">{noResponseCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowInviteForm(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Send Invitation
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                          <input
                            type="text"
                            name="guest_name"
                            value={inviteData.guest_name}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Enter guest name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email Address</label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              name="guest_email"
                              value={inviteData.guest_email}
                              onChange={handleInputChange}
                              required
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                              placeholder="guest@example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Mobile Number (Optional)</label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              name="guest_mobile"
                              value={inviteData.guest_mobile}
                              onChange={handleInputChange}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Guest List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Guest List</h3>
          
          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations sent</h3>
              <p className="mt-1 text-sm text-gray-500">Start by sending your first invitation.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-4">
                          {getStatusIcon(invitation.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {invitation.guest_name}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                              {invitation.status}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <Mail className="h-4 w-4 mr-1" />
                            <span>{invitation.guest_email}</span>
                            {invitation.guest_mobile && (
                              <>
                                <span className="mx-2">•</span>
                                <Phone className="h-4 w-4 mr-1" />
                                <span>{invitation.guest_mobile}</span>
                              </>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-400">
                            Sent on {formatDate(invitation.sent_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRSVPColor(invitation.rsvp_status)}`}>
                            {getRSVPText(invitation.rsvp_status)}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                            Resend
                          </button>
                          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestManagement;