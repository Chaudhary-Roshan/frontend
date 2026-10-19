import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import EventRegistrationsRoster from '../../components/events/EventRegistrationsRoster';
import { Calendar, ArrowLeft, BarChart2, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const EventRegistrationRecords = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventParam = searchParams.get('event');

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('events/');
      let allEvents = Array.isArray(res.data) ? res.data : (res.data?.results || []);

      // Role-based scoping
      if (user?.role === 'president') {
        allEvents = allEvents.filter(e => {
          if (user?.society && e.society === user.society) return true;
          if (e.society_id && user?.society_id && e.society_id === user.society_id) return true;
          return true; // backend get_queryset already scopes
        });
      } else if (user?.role === 'faculty') {
        allEvents = allEvents.filter(e => {
          if (user?.society && e.society === user.society) return true;
          return true;
        });
      }

      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to load events for registration records:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Page Title */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200">
                  Institutional Registry
                </span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-xs text-gray-500 font-medium">Official Participant Roster</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 mt-0.5">Event Registration Records & Analytics</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(user?.role === 'president' ? '/president-dashboard' : user?.role === 'faculty' ? '/advisor-dashboard' : '/admin-dashboard')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-xs">
            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-3" size={32} />
            <p className="text-sm font-bold text-gray-700">Loading University Event Records...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-xs space-y-3">
            <Calendar className="text-gray-300 mx-auto" size={48} />
            <h3 className="text-base font-bold text-gray-800">No Events Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              There are currently no active or historical events associated with your account to display registration records for.
            </p>
          </div>
        ) : (
          <EventRegistrationsRoster 
            events={events} 
            initialEventId={eventParam} 
          />
        )}
      </div>
    </div>
  );
};

export default EventRegistrationRecords;
