import { MediaImage } from '../components/common/AuthenticatedMedia';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, 
  MapPin, Clock, Tag, X, CheckCircle2, Ticket
} from 'lucide-react';
import api from '../utils/api';
import { getMediaUrl, handleImageError } from '../utils/media';

const EventCalendar = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dateClaims, setDateClaims] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'agenda'
  const [selectedSociety, setSelectedSociety] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evRes, socRes, claimsRes] = await Promise.all([
          api.get('events/'),
          api.get('societies/'),
          api.get('date-claims/calendar_locks/')
        ]);
        setEvents(evRes.data);
        setSocieties(socRes.data);
        setDateClaims(claimsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Calendar Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Filter events by society
  const filteredEvents = events.filter(e => {
    if (selectedSociety !== 'all' && e.society !== parseInt(selectedSociety)) return false;
    return true;
  });

  // Export .ics calendar file
  const exportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//University DSMS//Campus Calendar//EN\n";
    filteredEvents.forEach(e => {
      const dt = new Date(e.date);
      const dtFormatted = dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:${e.title}\n`;
      icsContent += `DESCRIPTION:${e.description || ''}\n`;
      icsContent += `DTSTART:${dtFormatted}\n`;
      icsContent += `LOCATION:Campus Auditorium / Lab\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campus-events-${year}-${month + 1}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="relative bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden flex flex-col md:flex-row md:items-end justify-between gap-6 border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
          
          <div className="relative z-10">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-900/50 px-3 py-1.5 rounded-full border border-indigo-500/30 shadow-inner">
              Campus Schedule
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-4 flex items-center gap-3">
              <CalendarIcon className="text-indigo-400 drop-shadow-md" size={36} /> Event Calendar
            </h1>
            <p className="text-indigo-100 text-sm mt-2 font-medium max-w-xl leading-relaxed">
              Discover university workshops, hackathons, and deadlines through our unified interactive planner.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <select
              value={selectedSociety}
              onChange={(e) => setSelectedSociety(e.target.value)}
              className="px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer [&>option]:text-slate-900"
            >
              <option value="all">All Societies</option>
              {societies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <button
              onClick={exportICS}
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition cursor-pointer"
            >
              <Download size={16} /> Export (.ics)
            </button>
          </div>
        </div>

        {/* CALENDAR CONTROLS & TOGGLES */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 ml-2">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda List
            </button>
          </div>
        </div>

        {/* VIEW 1: MONTH GRID */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden border border-slate-200">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-px bg-slate-100 border-b border-slate-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-slate-50 py-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-px bg-slate-100">
              {/* Blank leading slots */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[120px] bg-slate-50/50 p-2"></div>
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = new Date(year, month, dayNum);
                const dayEvents = filteredEvents.filter(e => {
                  const ed = new Date(e.date);
                  return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === dayNum;
                });
                const dayClaim = dateClaims.find(claim => claim.date === `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`);
                
                const isToday = new Date().toDateString() === dateKey.toDateString();

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`min-h-[120px] p-2 sm:p-3 bg-white transition-all duration-300 flex flex-col group hover:bg-indigo-50/30 ${
                      isToday ? 'relative z-10 shadow-[0_0_20px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500 rounded-xl' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black transition-colors ${
                        isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 group-hover:text-indigo-600 group-hover:bg-indigo-100'
                      }`}>
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:hidden pr-1">
                      {dayEvents.map(e => (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg border flex items-center gap-2 transition cursor-pointer shadow-sm hover:-translate-y-0.5 ${
                            e.is_paid 
                              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900 hover:shadow-amber-200/50' 
                              : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 text-indigo-900 hover:shadow-indigo-200/50'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.is_paid ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                          <span className="text-[10px] font-bold truncate tracking-tight">{e.title}</span>
                        </button>
                      ))}
                      {dayClaim && !dayEvents.length && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 border-dashed rounded-lg px-2 py-1 truncate cursor-help" title={`Date Locked by: ${dayClaim.society_name}`}>
                          <span className="truncate">Reserved</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: AGENDA LIST */}
        {viewMode === 'agenda' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            {filteredEvents.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">No upcoming events scheduled in this agenda.</p>
            ) : (
              filteredEvents.map(e => (
                <div
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  className="p-5 border border-slate-100 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl font-black text-center min-w-[60px]">
                      <span className="block text-xs uppercase opacity-80">
                        {new Date(e.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-lg">
                        {new Date(e.date).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        {e.society_logo ? (
                          <MediaImage
                            src={getMediaUrl(e.society_logo)}
                            onError={handleImageError}
                            alt=""
                            className="w-6 h-6 rounded-lg object-cover"
                          />
                        ) : null}
                        <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider block">{e.society_name}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{e.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{e.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${e.is_paid ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {e.is_paid ? `PKR ${e.price}` : 'Free'}
                    </span>
                    <button className="text-xs font-bold text-indigo-600 hover:underline">
                      View →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* EVENT POPUP MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              {selectedEvent.society_name}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">{selectedEvent.title}</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{selectedEvent.description}</p>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl space-y-2 text-xs text-slate-700 font-semibold">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                <span>{new Date(selectedEvent.date).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" />
                <span>Campus Auditorium / Lab Hall</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2.5 bg-slate-100 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
