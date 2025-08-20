'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

const locales = {
  'en-IN': require('date-fns/locale/en-IN'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function ScheduleCalendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    axios
      .get(`/api/calendar-slots?date=${dateString}`)
      .then((res) => {
        const data = res.data;

        const mappedEvents = data.map((slot) => {
          const start = new Date(slot.time);
          const end = new Date(start.getTime() + 30 * 60000); // 30 mins slot
          return {
            title: `Post ${slot.post}`,
            start,
            end,
          };
        });

        setEvents(mappedEvents);
      })
      .catch((err) => {
        console.error('Error fetching calendar slots:', err);
      });
  }, []);

  return (
    <div style={{ height: '80vh' }} className="p-4">
      <h2 className="text-xl font-bold mb-4">Scheduled Posts (Today)</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="day"
        views={['day']}
        step={30}
        timeslots={2}
        min={new Date().setHours(8, 0)}
        max={new Date().setHours(22, 0)}
        style={{ height: '100%' }}
      />
    </div>
  );
}