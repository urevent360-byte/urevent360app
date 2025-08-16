import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  User, Mail, Phone, MapPin, Calendar, Edit, Settings, 
  Shield, Award, Star, Heart, Clock
} from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);

  const profileStats = {
    eventsCreated: 12,
    totalSpent: 25400,
    preferredVendors: 8,
    averageRating: 4.8
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=7c3aed&color=fff&size=120`}
                alt={user?.name}
                className="h-24 w-24 rounded-full border-4 border-white shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
                <p className="text-purple-100 mt-1">{user?.email}</p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-purple-100">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Member since {new Date(user?.created_at).getFullYear()}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                    Client Member
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/profile/edit"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="p-6">
          {/* Personal Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Full Name</span>
                </div>
                <p className="text-lg text-gray-900">{user?.name}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Email Address</span>
                </div>
                <p className="text-lg text-gray-900">{user?.email}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Phone Number</span>
                </div>
                <p className="text-lg text-gray-900">{user?.mobile || 'Not provided'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Location</span>
                </div>
                <p className="text-lg text-gray-900">{user?.location || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Profile Statistics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-600" />
              Profile Statistics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Events Created</p>
                    <p className="text-2xl font-bold text-blue-900">{profileStats.eventsCreated}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Spent</p>
                    <p className="text-2xl font-bold text-green-900">${profileStats.totalSpent.toLocaleString()}</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Preferred Vendors</p>
                    <p className="text-2xl font-bold text-purple-900">{profileStats.preferredVendors}</p>
                  </div>
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Average Rating</p>
                    <p className="text-2xl font-bold text-orange-900">{profileStats.averageRating}</p>
                  </div>
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                {user?.bio || "This user hasn't added a bio yet. Click 'Edit Profile' to add a personal description."}
              </p>
            </div>
          </div>

          {/* Account Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Client Account
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not available'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {new Date().toLocaleDateString()} (Today)
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/profile/edit"
                className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-4 rounded-lg hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <div className="text-center">
                  <Edit className="h-8 w-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="font-medium text-gray-900 mb-1">Edit Profile</h4>
                  <p className="text-xs text-gray-500">Update your personal information</p>
                </div>
              </Link>

              <Link
                to="/settings/account"
                className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 p-4 rounded-lg hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div className="text-center">
                  <Settings className="h-8 w-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="font-medium text-gray-900 mb-1">Account Settings</h4>
                  <p className="text-xs text-gray-500">Manage billing and payments</p>
                </div>
              </Link>

              <Link
                to="/profile/security"
                className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 p-4 rounded-lg hover:border-orange-300 hover:shadow-md transition-all group"
              >
                <div className="text-center">
                  <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="font-medium text-gray-900 mb-1">Security Settings</h4>
                  <p className="text-xs text-gray-500">Manage security and 2FA</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;