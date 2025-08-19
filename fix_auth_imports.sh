#!/bin/bash

# Fix AuthContext imports from App.js to contexts/AuthContext.js

# Files with single-level imports (../App)
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/AppointmentBooking.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/VendorMarketplace.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/VenueCreate.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/Register.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/Profile.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/CEOSuccession.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/InteractiveEventPlanner.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/EventHistory.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/Navbar.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/Calendar.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/VendorLayout.js
sed -i "s|import { AuthContext } from '../App';|import { AuthContext } from '../contexts/AuthContext';|g" /app/frontend/src/components/EmployeeLayout.js

# Files with double-level imports (../../App)
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/admin/AdminLayout.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/employee/EmployeeDashboard.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/employee/EmployeeLayout.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/vendor/VendorDashboard.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/vendor/VendorLayout.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/settings/EnhancedAccountSettings.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/settings/EditProfile.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/settings/ProfileSettings.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/ceo/CEOAnalytics.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/ceo/CEOSecurity.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/ceo/CEOLayout.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/ceo/AIIntelligenceCenter.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/ceo/CEODashboard.js
sed -i "s|import { AuthContext } from '../../App';|import { AuthContext } from '../../contexts/AuthContext';|g" /app/frontend/src/components/ceo/AICopilot.js

echo "✅ Fixed AuthContext imports in all components"