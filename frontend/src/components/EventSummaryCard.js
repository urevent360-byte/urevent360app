import React, { useState } from 'react';
import { 
  Calendar, MapPin, Users, Heart, Building, Utensils, 
  DollarSign, Edit3, RefreshCw, CheckCircle, AlertTriangle,
  Sparkles, Tag, Clock
} from 'lucide-react';

const EventSummaryCard = ({ event, onEditAnswers, onResyncPlanner }) => {
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'not_synced', 'syncing'
  
  if (!event?.wizard_answers) {
    return null; // Don't show card if no wizard answers available
  }

  const answers = event.wizard_answers;
  
  // Format date nicely
  const formatEventDate = (date, time) => {
    if (!date) return 'Date TBD';
    const eventDate = new Date(date);
    const timeStr = time ? ` at ${time}` : '';
    return eventDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) + timeStr;
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency || 'USD' 
    }).format(amount);
  };

  // Get event type display name
  const getEventTypeDisplay = (type, mitzvahType) => {
    if (type === 'mitzvah') {
      return mitzvahType === 'bar_mitzvah' ? 'Bar Mitzvah' : 
             mitzvahType === 'bat_mitzvah' ? 'Bat Mitzvah' : 'Bar/Bat Mitzvah';
    }
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  // Handle sync status
  const handleResync = async () => {
    setSyncStatus('syncing');
    try {
      await onResyncPlanner?.();
      setSyncStatus('synced');
    } catch (error) {
      setSyncStatus('not_synced');
    }
  };

  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Synced to Planner</span>
          </div>
        );
      case 'not_synced':
        return (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Changes not synced</span>
            <button
              onClick={handleResync}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium underline"
            >
              Resync
            </button>
          </div>
        );
      case 'syncing':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Syncing...</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{answers.event_name || 'Your Event'}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span>{getEventTypeDisplay(answers.event_type, answers.mitzvah_type)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatEventDate(answers.date, answers.time)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{answers.guest_count || 0} guests</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{answers.location_city || 'Location TBD'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {getSyncStatusDisplay()}
            <button
              onClick={onEditAnswers}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
            >
              <Edit3 className="h-4 w-4" />
              Edit Answers
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Your Preferences
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Venue Types */}
            {answers.preferred_venue_types && answers.preferred_venue_types.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  Venue Types
                </h5>
                <div className="flex flex-wrap gap-2">
                  {answers.preferred_venue_types.map((venue, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200"
                    >
                      {venue}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Core Services */}
            {answers.needed_core_services && answers.needed_core_services.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-gray-500" />
                  Core Services
                </h5>
                <div className="flex flex-wrap gap-2">
                  {answers.needed_core_services.map((service, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cultural Style */}
            {answers.cultural_style && answers.cultural_style.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-gray-500" />
                  Cultural Style
                </h5>
                <div className="flex flex-wrap gap-2">
                  {answers.cultural_style.map((style, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-800 border border-pink-200"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Services Selected & Extras */}
            {((answers.needed_core_services && answers.needed_core_services.length > 0) || 
              (answers.needed_extras && answers.needed_extras.length > 0)) && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Services Selected</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  {answers.needed_core_services && answers.needed_core_services.length > 0 && (
                    <div>
                      <span className="font-medium">Core:</span> {answers.needed_core_services.join(', ')}
                    </div>
                  )}
                  {answers.needed_extras && answers.needed_extras.length > 0 && (
                    <div>
                      <span className="font-medium">Extras:</span> {answers.needed_extras.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Theme/Format */}
            {answers.theme_or_format && answers.theme_or_format.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Theme/Format</h5>
                <div className="flex flex-wrap gap-2">
                  {answers.theme_or_format.map((theme, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 border border-indigo-200"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Budget */}
            {answers.budget_target && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Target Budget
                </h5>
                <div className="text-lg font-semibold text-green-700">
                  {formatCurrency(answers.budget_target, answers.budget_currency)}
                </div>
              </div>
            )}

            {/* Wizard Completion */}
            {answers.wizard_completed_at && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Questionnaire Completed
                </h5>
                <div className="text-sm text-gray-600">
                  {new Date(answers.wizard_completed_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSummaryCard;