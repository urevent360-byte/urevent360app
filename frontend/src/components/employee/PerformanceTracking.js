import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Target, Star, Calendar, BarChart3 } from 'lucide-react';

const PerformanceTracking = () => {
  const [performanceData, setPerformanceData] = useState({
    overallScore: 87,
    taskCompletionRate: 94,
    clientSatisfaction: 4.8,
    punctuality: 98,
    teamCollaboration: 4.6,
    monthlyGoals: {
      tasksCompleted: { current: 23, target: 25 },
      hoursWorked: { current: 156, target: 160 },
      clientMeetings: { current: 8, target: 10 }
    },
    recentAchievements: [
      { id: 1, title: 'Perfect Week', description: 'Completed all tasks on time for a full week', date: '2024-02-10' },
      { id: 2, title: 'Client Appreciation', description: 'Received excellent feedback from Johnson Wedding', date: '2024-02-08' },
      { id: 3, title: 'Team Player', description: 'Helped colleague complete urgent project', date: '2024-02-05' }
    ]
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Tracking</h1>
          <p className="text-gray-600">Monitor your performance metrics and goals</p>
        </div>
      </div>

      {/* Overall Performance Score */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-orange-600 mb-2">{performanceData.overallScore}%</div>
          <div className="text-lg font-medium text-gray-900">Overall Performance Score</div>
          <div className="flex items-center justify-center mt-2 text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            +5% from last month
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Task Completion</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.taskCompletionRate}%</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Client Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.clientSatisfaction}/5</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Star className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Punctuality</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.punctuality}%</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Collaboration</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.teamCollaboration}/5</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Goals */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Goals Progress</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {Object.entries(performanceData.monthlyGoals).map(([key, goal]) => {
              const percentage = Math.round((goal.current / goal.target) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {goal.current} / {goal.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Achievements</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {performanceData.recentAchievements.map(achievement => (
              <div key={achievement.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Award className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(achievement.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTracking;