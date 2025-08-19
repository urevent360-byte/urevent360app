import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h1 className="text-xl font-bold text-red-800 mb-4">Something went wrong</h1>
          
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Error Details:</h2>
            <pre className="text-sm text-red-600 whitespace-pre-wrap bg-red-100 p-3 rounded border overflow-auto">
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>

          {this.state.errorInfo && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-red-700 mb-2">Stack Trace:</h2>
              <pre className="text-xs text-red-600 whitespace-pre-wrap bg-red-100 p-3 rounded border max-h-64 overflow-auto">
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}

          <div className="flex space-x-3">
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Try Again
            </button>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Development mode: Show more details */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Development Info:</h3>
              <p className="text-sm text-yellow-700">
                This error boundary caught a React error. Check the console for more details.
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;