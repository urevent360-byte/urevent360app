import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EventDashboard from './EventDashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventPlanning = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  // Redirect to the new EventDashboard component
  return <EventDashboard />;
};

export default EventPlanning;