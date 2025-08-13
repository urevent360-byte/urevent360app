import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Eye, 
  Star, 
  Calendar,
  TrendingUp,
  Mail,
  Phone,
  Building
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssociateManagement = () => {
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssociate, setSelectedAssociate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [associateReviews, setAssociateReviews] = useState([]);
  const [associateAttendance, setAssociateAttendance] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssociate, setNewAssociate] = useState({
    name: '',
    email: '',
    mobile: '',
    business_id: '',
    role: '',
    commission_rate: 0
  });

  useEffect(() => {
    fetchAssociates();
  }, []);

  const fetchAssociates = async () => {
    try {
      const response = await axios.get(`${API}/admin/associates`);
      setAssociates(response.data || []);
    } catch (error) {
      console.error('Failed to fetch associates:', error);
      // Mock data for demo
      setAssociates([
        {
          id: '1',
          name: 'Emily Rodriguez',
          email: 'emily.r@email.com',
          mobile: '+1 (555) 123-9876',
          business_id: 'business_1',
          business_name: 'Elite Catering Services',
          role: 'Event Coordinator',
          commission_rate: 5.0,
          status: 'active',
          created_at: new Date(Date.now() - 86400000 * 60).toISOString()
        },
        {
          id: '2',
          name: 'David Chen',
          email: 'david.chen@email.com',
          mobile: '+1 (555) 987-1234',
          business_id: 'business_2',
          business_name: 'Elegant Decorations',
          role: 'Design Assistant',
          commission_rate: 3.5,
          status: 'active',
          created_at: new Date(Date.now() - 86400000 * 45).toISOString()
        },
        {
          id: '3',
          name: 'Sarah Williams',
          email: 'sarah.w@email.com',
          mobile: '+1 (555) 456-7890',
          business_id: 'business_3',
          business_name: 'Perfect Photography',
          role: 'Assistant Photographer',
          commission_rate: 4.0,
          status: 'inactive',
          created_at: new Date(Date.now() - 86400000 * 30).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociateDetails = async (associateId) => {
    try {
      const [reviewsResponse, attendanceResponse] = await Promise.all([
        axios.get(`${API}/admin/associates/${associateId}/reviews`),
        axios.get(`${API}/admin/associates/${associateId}/attendance`)
      ]);
      
      setAssociateReviews(reviewsResponse.data || []);
      setAssociateAttendance(attendanceResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch associate details:', error);
      // Mock data for demo
      setAssociateReviews([
        {
          id: '1',
          reviewer_name: 'John Smith',
          rating: 5,
          comment: 'Excellent work coordination, very professional and helpful throughout the event.',
          event_name: 'Wedding Celebration',
          created_at: new Date(Date.now() - 86400000 * 10).toISOString()
        },
        {
          id: '2',
          reviewer_name: 'Mary Johnson',
          rating: 4,
          comment: 'Great attention to detail and very responsive to requests.',
          event_name: 'Corporate Gala',
          created_at: new Date(Date.now() - 86400000 * 25).toISOString()
        }
      ]);

      setAssociateAttendance([
        { date: '2024-01-15', status: 'present', hours: 8 },
        { date: '2024-01-16', status: 'present', hours: 6 },
        { date: '2024-01-17', status: 'absent', hours: 0 },
        { date: '2024-01-18', status: 'present', hours: 8 },
        { date: '2024-01-19', status: 'present', hours: 7 }
      ]);
    }
  };

  const createAssociate = async () => {
    try {
      const response = await axios.post(`${API}/admin/associates`, newAssociate);
      setAssociates([response.data, ...associates]);
      setShowAddForm(false);
      setNewAssociate({
        name: '', email: '', mobile: '', business_id: '', role: '', commission_rate: 0
      });
    } catch (error) {
      console.error('Failed to create associate:', error);
    }
  };

  const openAssociateModal = async (associate) => {
    setSelectedAssociate(associate);
    setShowModal(true);
    await fetchAssociateDetails(associate.id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredAssociates = associates.filter(associate =>
    associate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    associate.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    associate.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const averageRating = associateReviews.length > 0 
    ? (associateReviews.reduce((sum, review) => sum + review.rating, 0) / associateReviews.length).toFixed(1)
    : 0;

  const attendanceRate = associateAttendance.length > 0
    ? ((associateAttendance.filter(a => a.status === 'present').length / associateAttendance.length) * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Associate Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage associates, their reviews, and attendance
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Associate
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search associates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Associates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssociates.map((associate) => (
          <div key={associate.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={`https://ui-avatars.com/api/?name=${associate.name}&background=7c3aed&color=fff`}
                  alt={associate.name}
                  className="h-12 w-12 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{associate.name}</h3>
                  <p className="text-sm text-gray-500">{associate.role}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  associate.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {associate.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {associate.email}
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {associate.mobile}
                </div>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-400" />
                  {associate.business_name}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Commission Rate</p>
                  <p className="text-lg font-semibold text-purple-600">{associate.commission_rate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Since</p>
                  <p className="text-sm font-medium">{formatDate(associate.created_at)}</p>
                </div>
              </div>

              <button
                onClick={() => openAssociateModal(associate)}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Associate Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddForm(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add New Associate
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newAssociate.name}
                      onChange={(e) => setNewAssociate({...newAssociate, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newAssociate.email}
                      onChange={(e) => setNewAssociate({...newAssociate, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input
                      type="tel"
                      value={newAssociate.mobile}
                      onChange={(e) => setNewAssociate({...newAssociate, mobile: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      value={newAssociate.role}
                      onChange={(e) => setNewAssociate({...newAssociate, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newAssociate.commission_rate}
                      onChange={(e) => setNewAssociate({...newAssociate, commission_rate: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={createAssociate}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Create Associate
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Associate Details Modal */}
      {showModal && selectedAssociate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${selectedAssociate.name}&background=7c3aed&color=fff&size=80`}
                      alt={selectedAssociate.name}
                      className="h-20 w-20 rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-medium text-gray-900">{selectedAssociate.name}</h3>
                      <p className="text-gray-500">{selectedAssociate.role}</p>
                      <p className="text-sm text-purple-600">{selectedAssociate.business_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        {renderStars(Math.round(averageRating))}
                      </div>
                      <p className="text-sm text-gray-500">Rating ({averageRating}/5)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{attendanceRate}%</p>
                      <p className="text-sm text-gray-500">Attendance</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Reviews */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Reviews</h4>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {associateReviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {review.reviewer_name}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{review.comment}</p>
                          <p className="text-xs text-purple-600">{review.event_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attendance */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Attendance</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {associateAttendance.map((attendance, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-900">{attendance.date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              attendance.status === 'present' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attendance.status}
                            </span>
                            <span className="text-sm text-gray-500">{attendance.hours}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociateManagement;