import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EventDashboard from './EventDashboard';

const EventPlanning = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Redirect to the new EventDashboard component
  return <EventDashboard />;
};

export default EventPlanning;