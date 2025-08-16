import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import {
  Calendar, Clock, MapPin, Phone, Video, User, CheckCircle, XCircle,
  AlertTriangle, ChevronLeft, ChevronRight, Plus, Users, DollarSign,
  MessageCircle, Bell
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AppointmentBooking = ({ vendor, cartItems = [], onClose, onAppointmentCreated }) => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: type selection, 2: date/time, 3: details, 4: confirmation
  const [appointmentType, setAppointmentType] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [clientNotes, setClientNotes] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [vendorAvailability, setVendorAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  
  const appointmentTypes = [
    {
      id: 'in_person',
      title: 'In-Person Meeting',
      description: 'Meet face-to-face at the vendor\'s location or venue',
      icon: <MapPin className="h-6 w-6" />,
      color: 'from-blue-500 to-blue-600',
      details: 'Perfect for venue tours, equipment demos, and detailed planning discussions'
    },
    {
      id: 'phone',
      title: 'Phone Call',
      description: 'Speak directly via phone call',
      icon: <Phone className="h-6 w-6" />,
      color: 'from-green-500 to-green-600',
      details: 'Quick discussions, pricing clarification, and initial consultation'
    },
    {
      id: 'virtual',
      title: 'Virtual Meeting',
      description: 'Video call via Zoom, Google Meet, or similar',
      icon: <Video className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600',
      details: 'Screen sharing, portfolio reviews, and remote consultations'
    }
  ];

  useEffect(() => {
    fetchVendorAvailability();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchVendorAvailability = async () => {
    try {
      const response = await axios.get(`${API}/vendors/${vendor.id}/availability`, {
        headers: getAuthHeaders()
      });
      setVendorAvailability(response.data.availability || []);
    } catch (error) {
      console.error('Failed to fetch vendor availability:', error);
      // Mock availability for development
      setVendorAvailability([
        {
          day_of_week: 1, // Monday
          start_time: '09:00',
          end_time: '17:00',
          appointment_types: ['in_person', 'phone', 'virtual']
        },
        {
          day_of_week: 2, // Tuesday
          start_time: '09:00',
          end_time: '17:00',
          appointment_types: ['in_person', 'phone', 'virtual']
        },
        {
          day_of_week: 3, // Wednesday
          start_time: '10:00',
          end_time: '16:00',
          appointment_types: ['phone', 'virtual']
        }
      ]);
    }
  };

  const generateTimeSlots = () => {
    if (!appointmentType) return [];

    const slots = [];
    const today = new Date();
    
    // Generate slots for next 14 days
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const availability = vendorAvailability.find(a => 
        a.day_of_week === dayOfWeek && 
        a.appointment_types.includes(appointmentType)
      );
      
      if (availability) {
        const [startHour, startMinute] = availability.start_time.split(':').map(Number);
        const [endHour, endMinute] = availability.end_time.split(':').map(Number);
        
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        
        // Generate hourly slots
        for (let time = startTime; time < endTime; time += 60) {
          const hours = Math.floor(time / 60);
          const minutes = time % 60;
          
          const slotDate = new Date(date);
          slotDate.setHours(hours, minutes, 0, 0);
          
          slots.push({
            datetime: slotDate.toISOString(),
            displayDate: slotDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }),
            displayTime: slotDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })
          });
        }
      }
    }
    
    return slots;
  };

  useEffect(() => {
    if (appointmentType) {
      setAvailableSlots(generateTimeSlots());
    }
  }, [appointmentType, vendorAvailability]);

  const submitAppointment = async () => {
    setLoading(true);
    setError('');

    try {
      const appointmentData = {
        vendor_id: vendor.id,
        appointment_type: appointmentType,
        scheduled_datetime: selectedDateTime,
        duration_minutes: duration,
        client_notes: clientNotes,
        cart_items: cartItems,
        estimated_budget: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };

      // Add type-specific fields
      if (appointmentType === 'in_person') {
        appointmentData.location = location;
      } else if (appointmentType === 'phone') {
        appointmentData.phone_number = phoneNumber;
      }

      const response = await axios.post(`${API}/appointments`, appointmentData, {
        headers: getAuthHeaders()
      });

      setStep(4); // Show confirmation
      if (onAppointmentCreated) {
        onAppointmentCreated(response.data.appointment_id);
      }
    } catch (error) {
      console.error('Failed to create appointment:', error);
      setError(error.response?.data?.detail || 'Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div>
      <h3 className="text-xl font-semibold mb-6 text-center">Choose Appointment Type</h3>
      <div className="space-y-4">
        {appointmentTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => setAppointmentType(type.id)}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              appointmentType === type.id 
                ? 'border-purple-500 bg-purple-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${type.color} text-white flex-shrink-0`}>
                {type.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-2">{type.title}</h4>
                <p className="text-gray-600 mb-2">{type.description}</p>
                <p className="text-sm text-gray-500">{type.details}</p>
              </div>
              {appointmentType === type.id && (
                <CheckCircle className="h-6 w-6 text-purple-500 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 className="text-xl font-semibold mb-6 text-center">Select Date & Time</h3>
      
      {availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No available time slots for this appointment type.</p>
          <button
            onClick={() => setStep(1)}
            className="mt-4 text-purple-600 hover:text-purple-800"
          >
            Choose different appointment type
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {availableSlots.map((slot, index) => (
            <button
              key={index}
              onClick={() => setSelectedDateTime(slot.datetime)}
              className={`p-4 text-left rounded-lg border transition-all ${
                selectedDateTime === slot.datetime
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{slot.displayDate}</div>
              <div className="text-sm text-gray-600">{slot.displayTime}</div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meeting Duration
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
          <option value={120}>2 hours</option>
        </select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 className="text-xl font-semibold mb-6 text-center">Appointment Details</h3>
      
      <div className="space-y-6">
        {/* Appointment Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-3">Appointment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Vendor:</span>
              <span className="font-medium">{vendor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{appointmentTypes.find(t => t.id === appointmentType)?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium">
                {new Date(selectedDateTime).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{duration} minutes</span>
            </div>
          </div>
        </div>

        {/* Type-specific fields */}
        {appointmentType === 'in_person' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Vendor's office, venue, or other location"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {appointmentType === 'phone' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Your phone number"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {appointmentType === 'virtual' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Video className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Virtual Meeting</span>
            </div>
            <p className="text-sm text-blue-700">
              The vendor will provide a meeting link after approving your appointment request.
            </p>
          </div>
        )}

        {/* Cart Items Summary */}
        {cartItems.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Items to Discuss</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.service_name} x{item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                <span>Total Estimated:</span>
                <span>${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes for Vendor
          </label>
          <textarea
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="Any specific questions or requirements you'd like to discuss..."
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">Appointment Request Sent!</h3>
        <p className="text-gray-600">
          Your appointment request has been sent to {vendor.name}. 
          They will review and respond within 24 hours.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>The vendor will receive notifications via app, email, and SMS</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>They'll review your cart items and appointment details</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Once approved, you'll need to confirm the appointment</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>The confirmed appointment will appear in your calendar</span>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
      >
        Close
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Schedule Appointment</h2>
            <p className="text-gray-600">with {vendor.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step >= stepNum
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNum}
                </div>
              ))}
            </div>
            <div className="flex text-xs text-gray-500">
              <span className="flex-1">Type</span>
              <span className="flex-1 text-center">Schedule</span>
              <span className="flex-1 text-right">Details</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            
            <button
              onClick={() => {
                if (step === 1 && appointmentType) setStep(2);
                else if (step === 2 && selectedDateTime) setStep(3);
                else if (step === 3) submitAppointment();
              }}
              disabled={
                loading ||
                (step === 1 && !appointmentType) ||
                (step === 2 && !selectedDateTime) ||
                (step === 3 && appointmentType === 'phone' && !phoneNumber)
              }
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : step === 3 ? 'Send Request' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentBooking;