'use client';

import React, { useEffect, useState } from 'react';
import { Calendar } from 'react-big-calendar';
import localizer from './localizer'; // your fixed localizer here
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

  const fetchSlots = async (selectedDate) => {
    const dateString = selectedDate.toISOString().split('T')[0];

    try {
      const res = await axios.get(`${BASE_URL}/calendar-slots?date=${dateString}`);
      const data = res.data;

      const mappedEvents = data.map(slot => {
  const start = new Date(slot.time);
  const end = new Date(start.getTime() + 30 * 60000);
  let typeLabel = 'Post';

  if (slot.type === 'text') typeLabel = 'Text';
  else if (slot.type === 'image') typeLabel = 'Image';
  else if (slot.type === 'image+text') typeLabel = 'Image+Text';

  return {
    title: `${typeLabel} ${slot.post || ''}`,  // make sure slot.post exists or default ''
    start,
    end,
  };
});


      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching calendar slots:', error);
    }
  };

  useEffect(() => {
    fetchSlots(date);
  }, [date]);

  const minTime = new Date();
  minTime.setHours(8, 0, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(22, 0, 0, 0);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Telegram Schedule Calendar</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={['month','day', 'week']}
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
        step={30}
        timeslots={2}
        min={minTime}
        max={maxTime}
        style={{ height: '80vh' }}
      />
    </div>
  );
}
