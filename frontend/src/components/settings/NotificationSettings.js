import React, { useState } from 'react';
import { Bell, Mail, Smartphone, MessageCircle, Calendar, CreditCard, Users, Heart } from 'lucide-react';

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    email: {
      eventReminders: true,
      vendorMessages: true,
      paymentUpdates: true,
      marketingEmails: false,
      systemUpdates: true,
      weeklyDigest: true
    },
    sms: {
      eventReminders: true,
      urgentUpdates: true,
      paymentAlerts: false,
      vendorMessages: false
    },
    push: {
      eventReminders: true,
      vendorMessages: true,
      paymentUpdates: true,
      newFeatures: true,
      promotions: false
    },
    inApp: {
      allNotifications: true,
      soundEnabled: true,
      desktopNotifications: true
    }
  });

  const updateNotificationSetting = (category, setting) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
  };

  const NotificationToggle = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
        enabled ? 'bg-purple-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose how and when you want to receive notifications
        </p>
      </div>

      {/* Email Notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Email Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Event Reminders</p>
                <p className="text-sm text-gray-500">Get notified about upcoming events and deadlines</p>
              </div>
              <NotificationToggle
                enabled={notifications.email.eventReminders}
                onChange={() => updateNotificationSetting('email', 'eventReminders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Vendor Messages</p>
                <p className="text-sm text-gray-500">Receive messages and updates from your vendors</p>
              </div>
              <NotificationToggle
                enabled={notifications.email.vendorMessages}
                onChange={() => updateNotificationSetting('email', 'vendorMessages')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Updates</p>
                <p className="text-sm text-gray-500">Invoice notifications and payment confirmations</p>
              </div>
              <NotificationToggle
                enabled={notifications.email.paymentUpdates}
                onChange={() => updateNotificationSetting('email', 'paymentUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Weekly Digest</p>
                <p className="text-sm text-gray-500">Weekly summary of your events and activities</p>
              </div>
              <NotificationToggle
                enabled={notifications.email.weeklyDigest}
                onChange={() => updateNotificationSetting('email', 'weeklyDigest')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                <p className="text-sm text-gray-500">Tips, trends, and promotional content</p>
              </div>
              <NotificationToggle
                enabled={notifications.email.marketingEmails}
                onChange={() => updateNotificationSetting('email', 'marketingEmails')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">System Updates</p>
                <p className="text-sm text-gray-500">Important platform updates and maintenance notices</p>
              </div>
              <NotificationToggle
                enabled={notifications.email.systemUpdates}
                onChange={() => updateNotificationSetting('email', 'systemUpdates')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Smartphone className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">SMS Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Event Reminders</p>
                <p className="text-sm text-gray-500">SMS reminders for important event dates</p>
              </div>
              <NotificationToggle
                enabled={notifications.sms.eventReminders}
                onChange={() => updateNotificationSetting('sms', 'eventReminders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Urgent Updates</p>
                <p className="text-sm text-gray-500">Critical notifications that need immediate attention</p>
              </div>
              <NotificationToggle
                enabled={notifications.sms.urgentUpdates}
                onChange={() => updateNotificationSetting('sms', 'urgentUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Alerts</p>
                <p className="text-sm text-gray-500">SMS alerts for payment confirmations and issues</p>
              </div>
              <NotificationToggle
                enabled={notifications.sms.paymentAlerts}
                onChange={() => updateNotificationSetting('sms', 'paymentAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Vendor Messages</p>
                <p className="text-sm text-gray-500">SMS notifications for vendor communications</p>
              </div>
              <NotificationToggle
                enabled={notifications.sms.vendorMessages}
                onChange={() => updateNotificationSetting('sms', 'vendorMessages')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Push Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Event Reminders</p>
                <p className="text-sm text-gray-500">Browser notifications for upcoming events</p>
              </div>
              <NotificationToggle
                enabled={notifications.push.eventReminders}
                onChange={() => updateNotificationSetting('push', 'eventReminders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Vendor Messages</p>
                <p className="text-sm text-gray-500">Instant notifications for vendor communications</p>
              </div>
              <NotificationToggle
                enabled={notifications.push.vendorMessages}
                onChange={() => updateNotificationSetting('push', 'vendorMessages')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Updates</p>
                <p className="text-sm text-gray-500">Real-time payment and invoice notifications</p>
              </div>
              <NotificationToggle
                enabled={notifications.push.paymentUpdates}
                onChange={() => updateNotificationSetting('push', 'paymentUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">New Features</p>
                <p className="text-sm text-gray-500">Updates about new platform features and improvements</p>
              </div>
              <NotificationToggle
                enabled={notifications.push.newFeatures}
                onChange={() => updateNotificationSetting('push', 'newFeatures')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Promotions</p>
                <p className="text-sm text-gray-500">Special offers and promotional notifications</p>
              </div>
              <NotificationToggle
                enabled={notifications.push.promotions}
                onChange={() => updateNotificationSetting('push', 'promotions')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Notification Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Mail className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">
                {Object.values(notifications.email).filter(Boolean).length} Email
              </p>
              <p className="text-xs text-gray-500">notifications enabled</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Smartphone className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">
                {Object.values(notifications.sms).filter(Boolean).length} SMS
              </p>
              <p className="text-xs text-gray-500">notifications enabled</p>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Bell className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">
                {Object.values(notifications.push).filter(Boolean).length} Push
              </p>
              <p className="text-xs text-gray-500">notifications enabled</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">All Channels</p>
              <p className="text-xs text-gray-500">configured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;