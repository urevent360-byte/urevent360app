import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Star, ThumbsUp, MessageCircle, Download, Share2, Calendar, Users, DollarSign, Camera } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PostEvent = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    vendor_id: ''
  });

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const eventResponse = await axios.get(`${API}/events/${eventId}`);
      setEvent(eventResponse.data);
      
      // Generate sample reviews for demo
      setReviews(generateSampleReviews());
    } catch (error) {
      console.error('Failed to fetch event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleReviews = () => [
    {
      id: '1',
      event_id: eventId,
      vendor_id: 'vendor_1',
      user_id: 'user_1',
      rating: 5,
      comment: 'Amazing decorations! The team transformed our venue into a magical space. Highly recommended!',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      vendor_name: 'Elegant Decorations',
      service_type: 'Decoration'
    },
    {
      id: '2',
      event_id: eventId,
      vendor_id: 'vendor_2',
      user_id: 'user_1',
      rating: 4,
      comment: 'Great photography service. Captured all the precious moments perfectly. Very professional team.',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      vendor_name: 'Capture Moments Photography',
      service_type: 'Photography'
    },
    {
      id: '3',
      event_id: eventId,
      vendor_id: 'vendor_3',
      user_id: 'user_1',
      rating: 5,
      comment: 'Outstanding catering service! The food was delicious and the presentation was beautiful.',
      created_at: new Date(Date.now() - 259200000).toISOString(),
      vendor_name: 'Elite Catering Services',
      service_type: 'Catering'
    }
  ];

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/reviews`, {
        ...reviewData,
        event_id: eventId
      });
      setReviews([response.data, ...reviews]);
      setShowReviewForm(false);
      setReviewData({
        rating: 5,
        comment: '',
        vendor_id: ''
      });
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const eventPhotos = [
    'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
  ];

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
      {/* Event Summary Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative p-6 flex items-end h-full">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">{event.name} - Event Summary</h1>
              <p className="text-green-100">Your event was successfully completed!</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-2">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Event Date</h3>
              <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Guests</h3>
              <p className="text-sm text-gray-600">{event.guest_count || 'TBD'} attendees</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-purple-100 rounded-full mb-2">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Total Cost</h3>
              <p className="text-sm text-gray-600">{event.budget ? formatCurrency(event.budget) : 'TBD'}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-2">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Rating</h3>
              <div className="flex items-center justify-center">
                {renderStars(Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) || 5)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Photos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Event Photos</h2>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Camera className="mr-2 h-4 w-4" />
              Upload More
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" />
              Download All
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventPhotos.map((photo, index) => (
            <div key={index} className="relative group cursor-pointer">
              <img
                src={photo}
                alt={`Event photo ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="bg-white text-gray-800 p-2 rounded-full shadow-lg mr-2">
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button className="bg-white text-gray-800 p-2 rounded-full shadow-lg">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Reviews & Feedback</h2>
          <button
            onClick={() => setShowReviewForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Star className="mr-2 h-4 w-4" />
            Write Review
          </button>
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowReviewForm(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleReviewSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                          Write a Review
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      star <= reviewData.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Review
                            </label>
                            <textarea
                              value={reviewData.comment}
                              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                              placeholder="Share your experience with this event..."
                              required
                            />
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
                      Submit Review
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
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

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-4">
                <img
                  src={`https://ui-avatars.com/api/?name=Reviewer&background=random&color=fff`}
                  alt="Reviewer"
                  className="h-10 w-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {review.vendor_name} - {review.service_type}
                      </h4>
                      <div className="flex items-center mt-1">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-800 mb-3">{review.comment}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>Helpful</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-purple-500 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>Reply</span>
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

      {/* Action Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <Download className="h-6 w-6 text-purple-600 mr-4" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Download Event Report</h3>
              <p className="text-sm text-gray-500">Get a detailed summary of your event</p>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <Share2 className="h-6 w-6 text-purple-600 mr-4" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Share with Guests</h3>
              <p className="text-sm text-gray-500">Send photos and memories to attendees</p>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <Calendar className="h-6 w-6 text-purple-600 mr-4" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Plan Another Event</h3>
              <p className="text-sm text-gray-500">Start planning your next celebration</p>
            </div>
          </button>
          
          <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <MessageCircle className="h-6 w-6 text-purple-600 mr-4" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Contact Support</h3>
              <p className="text-sm text-gray-500">Need help or have feedback?</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostEvent;