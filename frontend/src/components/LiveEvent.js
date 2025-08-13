import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Users, Camera, MessageCircle, Share2, Heart, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LiveEvent = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventStatus, setEventStatus] = useState('live');
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      generateLiveUpdates();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}`);
      setEvent(response.data);
      
      // Determine event status based on date
      const eventDate = new Date(response.data.date);
      const now = new Date();
      const diffTime = eventDate - now;
      const diffHours = diffTime / (1000 * 60 * 60);
      
      if (diffHours > 24) {
        setEventStatus('upcoming');
      } else if (diffHours > 0) {
        setEventStatus('starting_soon');
      } else if (diffHours > -24) {
        setEventStatus('live');
      } else {
        setEventStatus('ended');
      }
    } catch (error) {
      console.error('Failed to fetch event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLiveUpdates = () => {
    const sampleUpdates = [
      {
        id: '1',
        type: 'status',
        message: 'Event is now live! Welcome everyone!',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        author: 'Event Organizer'
      },
      {
        id: '2',
        type: 'photo',
        message: 'Beautiful decorations are ready for our guests',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
        author: 'Decoration Team',
        image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=600&h=400&fit=crop'
      },
      {
        id: '3',
        type: 'announcement',
        message: 'Dinner will be served in 30 minutes in the main hall',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        author: 'Catering Team'
      },
      {
        id: '4',
        type: 'guest',
        message: 'Having an amazing time! Thank you for organizing this wonderful event',
        timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 min ago
        author: 'Sarah Johnson'
      }
    ];
    setLiveUpdates(sampleUpdates);
  };

  const handlePostUpdate = (e) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;

    const update = {
      id: Date.now().toString(),
      type: 'announcement',
      message: newUpdate,
      timestamp: new Date().toISOString(),
      author: 'Event Organizer'
    };

    setLiveUpdates([update, ...liveUpdates]);
    setNewUpdate('');
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return time.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800';
      case 'starting_soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live':
        return 'LIVE NOW';
      case 'starting_soon':
        return 'Starting Soon';
      case 'upcoming':
        return 'Upcoming';
      case 'ended':
        return 'Event Ended';
      default:
        return 'Unknown';
    }
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'announcement':
        return <MessageCircle className="h-4 w-4" />;
      case 'guest':
        return <Users className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

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
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Event not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested event could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-64 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="relative p-6 flex items-end h-full">
            <div className="text-white">
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold mr-4">{event.name}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(eventStatus)}`}>
                  {eventStatus === 'live' && <div className="animate-pulse w-2 h-2 bg-red-600 rounded-full mr-2"></div>}
                  {getStatusText(eventStatus)}
                </span>
              </div>
              <div className="flex items-center text-purple-100 space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{event.location || 'Location TBD'}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{event.guest_count || 'TBD'} guests</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Update Form */}
          {(eventStatus === 'live' || eventStatus === 'starting_soon') && (
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handlePostUpdate}>
                <div className="flex items-start space-x-4">
                  <img
                    src="https://ui-avatars.com/api/?name=Event+Organizer&background=7c3aed&color=fff"
                    alt="Organizer"
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newUpdate}
                      onChange={(e) => setNewUpdate(e.target.value)}
                      placeholder="Share an update with your guests..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Photo
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!newUpdate.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post Update
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Live Updates */}
          <div className="space-y-4">
            {liveUpdates.map((update) => (
              <div key={update.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${update.author}&background=random&color=fff`}
                    alt={update.author}
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{update.author}</h4>
                      <div className="flex items-center text-gray-500">
                        {getUpdateIcon(update.type)}
                      </div>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatTime(update.timestamp)}</span>
                    </div>
                    <p className="text-gray-800 mb-3">{update.message}</p>
                    
                    {update.image && (
                      <img
                        src={update.image}
                        alt="Update"
                        className="rounded-lg max-w-full h-64 object-cover mb-3"
                      />
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                        <Heart className="h-4 w-4" />
                        <span>Like</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        <span>Comment</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Info Sidebar */}
        <div className="space-y-6">
          {/* Event Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Details</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-gray-900">{new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                  <p className="text-gray-500">{new Date(event.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
              
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-gray-900">{event.location || 'Location TBD'}</p>
                </div>
              </div>
              
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-gray-900">{event.guest_count || 'TBD'} expected guests</p>
                </div>
              </div>
            </div>
            
            {event.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
            )}
          </div>

          {/* Event Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Welcome & Registration</p>
                  <p className="text-sm text-gray-500">6:00 PM - 6:30 PM</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Cocktail Hour</p>
                  <p className="text-sm text-gray-500">6:30 PM - 7:30 PM</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dinner & Speeches</p>
                  <p className="text-sm text-gray-500">7:30 PM - 9:00 PM</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dancing & Entertainment</p>
                  <p className="text-sm text-gray-500">9:00 PM - 12:00 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Share2 className="mr-2 h-4 w-4" />
                Share Event
              </button>
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Camera className="mr-2 h-4 w-4" />
                Upload Photos
              </button>
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveEvent;