import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Megaphone, Calendar, Users, Award, Clock, ArrowRight, CheckCircle2, 
  Sparkles, Trophy, Bell, ChevronRight, MapPin, Tag, Heart, Eye, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { getMediaUrl } from '../utils/media';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [recruitments, setRecruitments] = useState([]);
  const [news, setNews] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [subscribed, setSubscribed] = useState(false);
  const [emailSub, setEmailSub] = useState('');
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(null);
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    try {
      const requests = [
        api.get('events/'),
        api.get('societies/'),
        api.get('recruitments/'),
        api.get('news/'),
        api.get('gallery/')
      ];
      if (user) {
        requests.push(api.get('registrations/'));
      }

      const results = await Promise.allSettled(requests);
      const [evRes, socRes, recRes, newsRes, galRes, regRes] = results;

      if (evRes?.status === 'fulfilled') setEvents(evRes.value.data);
      if (socRes?.status === 'fulfilled') setSocieties(socRes.value.data);
      if (recRes?.status === 'fulfilled') setRecruitments(recRes.value.data);
      if (newsRes?.status === 'fulfilled') setNews(newsRes.value.data);
      if (galRes?.status === 'fulfilled') setGalleries(galRes.value.data);
      if (regRes?.status === 'fulfilled') {
        const ids = new Set(regRes.value.data.map(r => r.event));
        setRegisteredEventIds(ids);
      }
    } catch (err) {
      console.error("Error loading campus hub data", err);
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      await api.post('registrations/', { event: eventId });
      setRegisteredEventIds(prev => new Set([...prev, eventId]));
      alert('Successfully registered for event! Your ticket is now available in My Profile.');
    } catch (err) {
      alert(err.response?.data?.error || 'Registration could not be completed.');
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailSub) return;
    setSubscribed(true);
  };

  const now = new Date();
  const approvedEvents = events.filter(e => e.status === 'approved');
  const upcomingEvents = approvedEvents.filter(e => new Date(e.date) >= now);
  const pastEvents = approvedEvents.filter(e => new Date(e.date) < now);
  const openRecruitments = recruitments.filter(r => r.status === 'open');

  // If no future events, fall back to approved events so user can always see active events
  const baseUpcoming = upcomingEvents.length > 0 ? upcomingEvents : approvedEvents;

  const filteredUpcomingEvents = baseUpcoming.filter(e => {
    if (eventCategoryFilter === 'workshops') return e.title.toLowerCase().includes('workshop');
    if (eventCategoryFilter === 'competitions') return e.title.toLowerCase().includes('hackathon') || e.title.toLowerCase().includes('competition') || e.title.toLowerCase().includes('ctf');
    if (eventCategoryFilter === 'free') return !e.is_paid;
    if (eventCategoryFilter === 'paid') return e.is_paid;
    return true;
  });

  const displayGalleries = galleries.slice(0, 4);

  const portalRoute = user?.role === 'admin' ? '/admin-dashboard' :
                      user?.role === 'faculty' ? '/advisor-dashboard' :
                      user?.role === 'president' ? '/president-dashboard' :
                      '/student-dashboard';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* 1. FEATURED UNIVERSITY ANNOUNCEMENT BAR */}
      {news.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-4 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3 font-medium">
              <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Megaphone size={14} className="animate-pulse" /> Official Notice
              </span>
              <p className="line-clamp-1">
                <strong>{news[0]?.title}:</strong> {news[0]?.content}
              </p>
            </div>
            <Link to="/news" className="text-xs text-indigo-300 hover:text-white font-bold flex items-center gap-1 whitespace-nowrap">
              All Announcements <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* WELCOME HERO / ROLE HUB */}
      <div className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Semester Fall 2026
              </span>
            </div>
            {user ? (
              <>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{user?.first_name || user?.username}</span>!
                </h1>
                <p className="mt-1 text-slate-600 text-base max-w-2xl font-medium">
                  Discover verified student societies, enroll in upcoming campus workshops, track recruitment drives, and view verified certificates.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Discover Campus Life & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Student Societies</span>
                </h1>
                <p className="mt-1 text-slate-600 text-base max-w-2xl font-medium">
                  Explore departmental societies, register for workshops and competitions, track recruitment drives, and download verified digital certificates.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                to={portalRoute}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <span>Go to {user?.role === 'student' ? 'My Profile' : user?.role === 'president' ? 'President Portal' : user?.role === 'faculty' ? 'Advisor Desk' : 'Admin Console'}</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/societies"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <span>Explore Societies</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                >
                  Sign In / Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-14">

        {/* NEWS & ANNOUNCEMENTS (Posted by Admin, Advisors, or Presidents) */}
        {news.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Megaphone className="text-indigo-600" size={24} />
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Campus News & Announcements</h2>
                </div>
                <p className="text-sm text-slate-500 mt-1">Official updates from Society Presidents, Faculty Advisors, and Administration.</p>
              </div>
              <Link to="/news" className="text-xs font-bold text-indigo-600 hover:underline">
                View All News ({news.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.slice(0, 3).map((item) => {
                const roleBadge = item.author_role === 'admin' ? { label: 'Admin Notice', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100' } :
                                  item.author_role === 'faculty' ? { label: 'Advisor Memo', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' } :
                                  { label: 'Society Update', bg: 'bg-violet-50 text-violet-700 border-violet-100' };
                return (
                  <div key={item.id} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {/* Society logo or author role badge */}
                          {item.society_logo ? (
                            <div className="w-7 h-7 rounded-lg overflow-hidden shadow-sm shrink-0">
                              <img src={item.society_logo} alt={item.author_society || ''} className="w-full h-full object-cover" />
                            </div>
                          ) : null}
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleBadge.bg}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{item.content}</p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Author avatar */}
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                          {item.society_logo ? (
                            <img src={item.society_logo} alt={item.author_name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-[10px] uppercase">
                              {(item.author_name || 'A').charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                          {item.author_name || 'Campus Office'}{item.author_society ? ` · ${item.author_society}` : ''}
                        </span>
                      </div>
                      <Link to="/news" className="text-xs font-bold text-indigo-600 hover:underline">
                        Read →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. REGISTRATION DEADLINES & URGENT ALERTS */}
        {openRecruitments.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-950">Active Recruitment Drives & Application Deadlines</h3>
                  <p className="text-sm text-amber-800">
                    {openRecruitments.length} societies have open positions for cabinet and team members this week.
                  </p>
                </div>
              </div>
              <Link 
                to="/societies" 
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition"
              >
                Explore Open Drives
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {openRecruitments.map(rec => (
                <div key={rec.id} className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {rec.society_logo ? (
                        <div className="w-6 h-6 rounded-md overflow-hidden shadow-sm shrink-0">
                          <img src={rec.society_logo} alt={rec.society_name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-[9px] shrink-0">
                          {(rec.society_name || 'S').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-widest">
                        {rec.society_name}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{rec.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Deadline: {new Date(rec.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Applications Open
                    </span>
                    <Link to={`/societies/${rec.society}`} className="text-xs font-bold text-indigo-600 hover:underline">
                      Apply Now →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. UPCOMING EVENTS & WORKSHOPS SECTION */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-600" size={24} />
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upcoming Events & Workshops</h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">Explore campus seminars, hackathons, and technical bootcamps.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'workshops', label: 'Workshops' },
                { id: 'competitions', label: 'Competitions' },
                { id: 'free', label: 'Free' },
                { id: 'paid', label: 'Paid' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setEventCategoryFilter(f.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                    eventCategoryFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredUpcomingEvents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
              <Calendar className="mx-auto text-slate-300 mb-3" size={40} />
              <h3 className="font-bold text-slate-700">No events found in this category</h3>
              <p className="text-sm text-slate-400 mt-1">Check back later or view our event calendar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUpcomingEvents.map(event => {
                const isRegistered = registeredEventIds.has(event.id);
                const eventDate = new Date(event.date);

                return (
                  <div key={event.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {event.society_logo ? (
                            <div className="w-7 h-7 rounded-lg overflow-hidden shadow-sm shrink-0">
                              <img src={event.society_logo} alt={event.society_name || ''} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-[9px] shrink-0">
                              {(event.society_name || 'S').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                            {event.society_name || 'Campus Society'}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${event.is_paid ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {event.is_paid ? `PKR ${event.price}` : 'Free Entry'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="mt-5 space-y-2 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-indigo-500 shrink-0" />
                          <span>{eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-indigo-500 shrink-0" />
                          <span>Main Auditorium / Campus Lab</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                      <Link to={`/events`} className="text-xs font-bold text-slate-600 hover:text-indigo-600">
                        View Details
                      </Link>

                      {user?.role === 'student' && (
                        <Link
                          to={`/events?event=${event.id}`}
                          className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                            isRegistered
                              ? 'bg-emerald-100 text-emerald-700 cursor-default pointer-events-none'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30'
                          }`}
                        >
                          {isRegistered ? (
                            <>
                              <CheckCircle2 size={14} /> Registered
                            </>
                          ) : event.is_paid ? (
                            'Get Ticket'
                          ) : (
                            'Register Free'
                          )}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 text-center">
            <Link to="/events" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">
              Browse All Upcoming Events & Filter by Society <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* 4. FEATURED SOCIETIES & POPULAR RANKING PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Societies (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="text-indigo-600" size={24} /> Featured Campus Societies
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Explore active departmental and technical chapters.</p>
              </div>
              <Link to="/societies" className="text-xs font-bold text-indigo-600 hover:underline">
                View All ({societies.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {societies.slice(0, 4).map(soc => (
                <div key={soc.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-lg mb-3 overflow-hidden">
                      {soc.logo ? (
                        <img src={soc.logo} alt={soc.name} className="w-full h-full object-cover" />
                      ) : (
                        soc.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{soc.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{soc.description || 'Active university society promoting student activities and workshops.'}</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      Advisor: {soc.advisor_name || 'Assigned'}
                    </span>
                    <Link to={`/societies/${soc.id}`} className="text-xs font-bold text-indigo-600 hover:underline">
                      View Profile →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. SOCIETY LEADERBOARD PODIUM PREVIEW (1 Col) */}
          <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-800/60 px-3 py-1 rounded-full border border-indigo-700/50 flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-400" /> Leaderboard
                </span>
                <Link to="/leaderboards" className="text-xs text-indigo-300 hover:text-white font-bold">
                  Full Roster →
                </Link>
              </div>
              <h3 className="text-xl font-black text-white">Top Active Societies</h3>
              <p className="text-xs text-slate-400 mt-1">Ranked based on approved events, volunteer hours, and attendance velocity.</p>

              <div className="mt-6 space-y-3">
                {societies.slice(0, 3).map((soc, idx) => {
                  const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
                  const score = 95 - idx * 7;
                  return (
                    <div key={soc.id} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-amber-400">{medals[idx]}</span>
                        <div className="w-8 h-8 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                          {soc.logo ? (
                            <img src={soc.logo} alt={soc.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black text-indigo-300">{(soc.name || 'S').substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{soc.name}</h4>
                          <span className="text-[10px] text-slate-400">{score} Health Score</span>
                        </div>
                      </div>
                      <Link to={`/societies/${soc.id}`} className="text-xs text-indigo-400 font-bold hover:underline">
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <Link to="/leaderboards" className="text-xs text-indigo-300 font-bold hover:text-white">
                View Full Scorecard & Points Formula →
              </Link>
            </div>
          </div>
        </div>

        {/* 6. RECENTLY CONCLUDED EVENTS & SOCIETY ACHIEVEMENTS */}
        {pastEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={24} /> Concluded Events & Highlights
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Verified certificates are available for attended participants.</p>
              </div>
              <Link to="/verify" className="text-xs font-bold text-indigo-600 hover:underline">
                Verify Issued Certificates →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {pastEvents.slice(0, 3).map(pe => (
                <div key={pe.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Completed
                  </span>
                  <h4 className="font-bold text-slate-900 text-base mt-2 line-clamp-1">{pe.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pe.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>{new Date(pe.date).toLocaleDateString()}</span>
                    <span className="text-indigo-600 font-bold">Certificates Released</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. LATEST EVENT GALLERIES PREVIEW */}
        {displayGalleries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="text-indigo-600" size={24} /> Campus Media & Event Galleries
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Capturing memorable moments from hackathons, workshops, and galas.</p>
              </div>
              <Link to="/gallery" className="text-xs font-bold text-indigo-600 hover:underline">
                View Full Gallery →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayGalleries.map((img, i) => (
                <div 
                  key={img.id || i}
                  onClick={() => setSelectedGalleryImg(getMediaUrl(img.image_url || img.image))}
                  className="group relative h-52 bg-slate-200 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition"
                >
                  <img 
                    src={getMediaUrl(img.image_url || img.image)} 
                    alt="Gallery" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4">
                    <span className="text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      {img.society_name || 'Campus Society'}
                    </span>
                    <p className="text-white text-xs font-bold line-clamp-1">{img.event_title || 'Past Event Memory'}</p>
                    <span className="text-white/80 text-[11px] font-bold flex items-center gap-1 mt-1">
                      <Eye size={12} /> Click to Enlarge
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. NEWSLETTER & NOTIFICATION SUBSCRIPTION CARD */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-200 bg-indigo-500/40 px-3 py-1 rounded-full border border-indigo-400/30">
              Campus Notifications
            </span>
            <h3 className="text-2xl sm:text-3xl font-black mt-3">Stay Updated on Upcoming Drives & Events</h3>
            <p className="text-sm text-indigo-100 mt-2 font-medium">
              Receive instant alerts whenever your followed societies publish a workshop, open recruitment, or release certificates.
            </p>
          </div>

          <div className="w-full md:w-auto">
            {subscribed ? (
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-center">
                <CheckCircle2 className="mx-auto text-emerald-300 mb-1" size={28} />
                <p className="font-bold text-sm">Preferences Saved!</p>
                <p className="text-xs text-indigo-100">You will receive priority campus alerts.</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  placeholder="Enter your university email..."
                  value={emailSub}
                  onChange={(e) => setEmailSub(e.target.value)}
                  className="px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl placeholder-indigo-200 text-sm outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition whitespace-nowrap cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* LIGHTBOX MODAL FOR GALLERY PREVIEW */}
      {selectedGalleryImg && (
        <div 
          onClick={() => setSelectedGalleryImg(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
            <img src={selectedGalleryImg} alt="Preview" className="w-full h-full object-contain" />
            <button 
              onClick={() => setSelectedGalleryImg(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full font-bold text-sm backdrop-blur-md"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
