import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import {
  Calendar, CalendarDays, Clock, MapPin, Phone, Video, Users, DollarSign,
  Plus, ChevronLeft, ChevronRight, Bell, CheckCircle, XCircle, 
  AlertTriangle, Pencil, Trash2, Eye, Filter, Grid3X3, List,
  StickyNote, CreditCard, User, Calendar as CalendarIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CalendarComponent = () => {
  const { user } = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day, agenda
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventFilter, setEventFilter] = useState('all');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'note',
    date: '',
    all_day: false,
    reminder_minutes: []
  });

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, view]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = getViewStartDate().toISOString();
      const endDate = getViewEndDate().toISOString();

      // Fetch calendar events and appointments
      const [eventsResponse, appointmentsResponse] = await Promise.all([
        axios.get(`${API}/calendar`, {
          headers: getAuthHeaders(),
          params: { start_date: startDate, end_date: endDate }
        }),
        axios.get(`${API}/appointments`, {
          headers: getAuthHeaders()
        })
      ]);

      setEvents(eventsResponse.data.events || []);
      setAppointments(appointmentsResponse.data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      // Use mock data for development
      setEvents(getMockCalendarEvents());
      setAppointments(getMockAppointments());
    } finally {
      setLoading(false);
    }
  };

  const getMockCalendarEvents = () => [
    {
      id: '1',
      title: 'Payment Due: Elegant Catering Co.',
      description: 'Final payment of $12,500 for wedding catering',
      event_type: 'payment_deadline',
      date: new Date(2025, 7, 20, 10, 0).toISOString(),
      booking_id: 'booking_123'
    },
    {
      id: '2',
      title: 'Wedding Planning Notes',
      description: 'Finalize menu choices and seating arrangements',
      event_type: 'note',
      date: new Date(2025, 7, 18, 14, 0).toISOString(),
      all_day: false
    },
    {
      id: '3',
      title: 'Payment Reminder: DJ Mike\'s Music',
      description: 'Payment of $1,200 due in 3 days',
      event_type: 'reminder',
      date: new Date(2025, 7, 22, 9, 0).toISOString(),
      booking_id: 'booking_456'
    }
  ];

  const getMockAppointments = () => [
    {
      id: 'apt_1',
      vendor_info: {
        name: 'Premier Photography',
        service: 'Photography'
      },
      appointment_type: 'virtual',
      scheduled_datetime: new Date(2025, 7, 19, 15, 0).toISOString(),
      status: 'confirmed',
      client_notes: 'Discuss wedding photo package and timeline'
    },
    {
      id: 'apt_2', 
      vendor_info: {
        name: 'Royal Decorations',
        service: 'Decoration'
      },
      appointment_type: 'in_person',
      scheduled_datetime: new Date(2025, 7, 21, 11, 0).toISOString(),
      status: 'approved',
      client_notes: 'Venue walkthrough and decoration planning',
      location: 'Grand Ballroom Plaza'
    }
  ];

  const getViewStartDate = () => {
    const start = new Date(currentDate);
    switch (view) {
      case 'month':
        start.setDate(1);
        start.setDate(start.getDate() - start.getDay());
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        break;
      case 'day':
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getViewEndDate = () => {
    const end = new Date(currentDate);
    switch (view) {
      case 'month':
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setDate(end.getDate() + (6 - end.getDay()));
        break;
      case 'week':
        end.setDate(end.getDate() + 6 - end.getDay());
        break;
      case 'day':
        break;
      default:
        end.setMonth(end.getMonth() + 1);
    }
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
    }
    setCurrentDate(newDate);
  };

  const createNewEvent = async () => {
    try {
      const eventData = {
        ...newEvent,
        date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
        reminder_minutes: newEvent.reminder_minutes.filter(m => m > 0)
      };

      await axios.post(`${API}/calendar`, eventData, {
        headers: getAuthHeaders()
      });

      setShowNewEventModal(false);
      setNewEvent({
        title: '',
        description: '',
        event_type: 'note',
        date: '',
        all_day: false,
        reminder_minutes: []
      });
      fetchCalendarData();
    } catch (error) {
      console.error('Failed to create calendar event:', error);
    }
  };

  const getEventTypeIcon = (type, appointmentType = null) => {
    switch (type) {
      case 'appointment':
        switch (appointmentType) {
          case 'virtual': return <Video className="h-4 w-4" />;
          case 'phone': return <Phone className="h-4 w-4" />;
          case 'in_person': return <MapPin className="h-4 w-4" />;
          default: return <Users className="h-4 w-4" />;
        }
      case 'payment_deadline':
        return <CreditCard className="h-4 w-4" />;
      case 'reminder':
        return <Bell className="h-4 w-4" />;
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type, status = null) => {
    switch (type) {
      case 'appointment':
        switch (status) {
          case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
          case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
      case 'payment_deadline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reminder':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'note':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const renderMonthView = () => {
    const startDate = getViewStartDate();
    const endDate = getViewEndDate();
    const days = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          const dayEvents = [...events, ...appointments.map(apt => ({
            ...apt,
            title: `${apt.vendor_info?.name || 'Appointment'}`,
            event_type: 'appointment',
            date: apt.scheduled_datetime,
            appointment_type: apt.appointment_type,
            status: apt.status
          }))].filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === day.toDateString();
          });

          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => {
                setSelectedDate(day);
                setNewEvent({ ...newEvent, date: day.toISOString() });
                setShowNewEventModal(true);
              }}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                {day.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, idx) => (
                  <div
                    key={idx}
                    className={`text-xs p-1 rounded border ${getEventTypeColor(event.event_type, event.status)} truncate`}
                    title={event.title}
                  >
                    <div className="flex items-center">
                      {getEventTypeIcon(event.event_type, event.appointment_type)}
                      <span className="ml-1 truncate">{event.title}</span>
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAgendaView = () => {
    const allEvents = [...events, ...appointments.map(apt => ({
      ...apt,
      title: `${apt.vendor_info?.name || 'Appointment'}`,
      event_type: 'appointment',
      date: apt.scheduled_datetime,
      appointment_type: apt.appointment_type,
      status: apt.status
    }))].sort((a, b) => new Date(a.date) - new Date(b.date));

    const filteredEvents = eventFilter === 'all' ? allEvents : allEvents.filter(e => e.event_type === eventFilter);

    return (
      <div className="space-y-4">
        {filteredEvents.map((event, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getEventTypeColor(event.event_type, event.status)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getEventTypeIcon(event.event_type, event.appointment_type)}
                  <h3 className="font-semibold">{event.title}</h3>
                  {event.status && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      event.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-1">{formatDate(event.date)}</p>
                
                {event.description && (
                  <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                )}
                
                {event.client_notes && (
                  <p className="text-sm text-gray-600 italic">Notes: {event.client_notes}</p>
                )}
                
                {event.location && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {event.location}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                {event.event_type === 'appointment' && (
                  <Link
                    to={`/appointments/${event.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                )}
                {event.event_type === 'note' && (
                  <button className="text-purple-600 hover:text-purple-800">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No events found for the selected filter.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CalendarDays className="h-8 w-8 mr-3 text-purple-600" />
              Calendar & Appointments
            </h1>
            <p className="text-gray-600 mt-2">
              Manage appointments, track payment deadlines, and organize your event planning notes.
            </p>
          </div>
          
          <button
            onClick={() => setShowNewEventModal(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note/Reminder
          </button>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-semibold">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric',
                ...(view === 'day' && { day: 'numeric' })
              })}
            </h2>
            
            <button
              onClick={() => navigateDate(1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Event Filter */}
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-1 text-sm border rounded-lg"
            >
              <option value="all">All Events</option>
              <option value="appointment">Appointments</option>
              <option value="payment_deadline">Payment Deadlines</option>
              <option value="reminder">Reminders</option>
              <option value="note">Notes</option>
            </select>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'month', icon: Grid3X3, label: 'Month' },
                { key: 'agenda', icon: List, label: 'Agenda' }
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    view === key 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : view === 'agenda' ? renderAgendaView() : renderMonthView()}
      </div>

      {/* Add Event Modal */}
      {showNewEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Note/Reminder</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Enter description..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newEvent.event_type}
                  onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="note">Note</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={selectedDate ? selectedDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setSelectedDate(date);
                    setNewEvent({ ...newEvent, date: date.toISOString() });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewEventModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createNewEvent}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;