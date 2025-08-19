import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
            <Search className="h-10 w-10 text-purple-600" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. 
            The page might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;