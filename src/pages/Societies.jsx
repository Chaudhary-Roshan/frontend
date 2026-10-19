import { MediaImage } from '../components/common/AuthenticatedMedia';
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { getMediaUrl, handleImageError } from '../utils/media';
import { 
  Users, ArrowRight, Search, Filter, ShieldCheck, Sparkles, 
  Award, Calendar, UserCheck, CheckCircle2, ChevronRight,
  ExternalLink, Briefcase, GraduationCap
} from 'lucide-react';

const InstagramIcon = () => (
  <svg className="w-3.5 h-3.5 text-pink-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const Societies = () => {
  const [societies, setSocieties] = useState(() => {
    try {
      const cached = sessionStorage.getItem('dsms_cached_societies');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [recruitments, setRecruitments] = useState(() => {
    try {
      const cached = sessionStorage.getItem('dsms_cached_recruitments');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [events, setEvents] = useState(() => {
    try {
      const cached = sessionStorage.getItem('dsms_cached_events');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('dsms_cached_societies');
    } catch (e) {
      return true;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const isFetchingSocietiesRef = useRef(false);

  useEffect(() => {
    fetchData();

    const handleSync = () => {
      fetchData();
    };

    window.addEventListener('dsms:data_synced', handleSync);
    window.addEventListener('dsms:society_updated', handleSync);
    window.addEventListener('dsms:event_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('dsms:data_synced', handleSync);
      window.removeEventListener('dsms:society_updated', handleSync);
      window.removeEventListener('dsms:event_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const fetchData = async () => {
    if (isFetchingSocietiesRef.current) return;
    isFetchingSocietiesRef.current = true;
    // 1. Fetch societies first and unblock UI immediately
    api.get('societies/')
      .then(res => {
        setSocieties(res.data);
        try {
          sessionStorage.setItem('dsms_cached_societies', JSON.stringify(res.data));
        } catch (e) {}
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch societies', error);
        setLoading(false);
      });

    // 2. Fetch auxiliary stats in parallel (non-blocking)
    api.get('recruitments/')
      .then(res => {
        setRecruitments(res.data);
        try {
          sessionStorage.setItem('dsms_cached_recruitments', JSON.stringify(res.data));
        } catch (e) {}
      })
      .catch(console.error);

    api.get('events/')
      .then(res => {
        setEvents(res.data);
        try {
          sessionStorage.setItem('dsms_cached_events', JSON.stringify(res.data));
        } catch (e) {}
      })
      .catch(console.error)
      .finally(() => {
        isFetchingSocietiesRef.current = false;
      });
  };

  const categories = [
    { id: 'all', label: 'All Chapters' },
    { id: 'tech', label: 'Computing & Cyber' },
    { id: 'emergency', label: 'Health & Emergency' },
    { id: 'academic', label: 'Departmental Clubs' },
  ];

  const filteredSocieties = societies.filter(soc => {
    const matchesSearch = 
      soc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (soc.description && soc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (soc.president_full_name && soc.president_full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (soc.president_name && soc.president_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (soc.advisor_full_name && soc.advisor_full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (soc.advisor_name && soc.advisor_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'tech') {
      return soc.name.toLowerCase().includes('cyber') || soc.name.toLowerCase().includes('digital') || soc.name.toLowerCase().includes('tech') || soc.name.toLowerCase().includes('computer');
    }
    if (selectedCategory === 'emergency') {
      return soc.name.toLowerCase().includes('emergency') || soc.name.toLowerCase().includes('response') || soc.name.toLowerCase().includes('health');
    }
    return true;
  }).sort((a, b) => {
    const aCSSC = (a.name || '').toLowerCase().includes('cyber security student club');
    const bCSSC = (b.name || '').toLowerCase().includes('cyber security student club');
    if (aCSSC && !bCSSC) return -1;
    if (!aCSSC && bCSSC) return 1;
    return (a.id || 0) - (b.id || 0);
  });

  const getOpenRecruitment = (socId) => {
    return recruitments.find(r => r.society === socId && r.status === 'open');
  };

  const getSocietyEventCount = (socId) => {
    return events.filter(e => e.society === socId).length;
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="relative z-10 max-w-3xl">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
              <Sparkles size={13} /> Official Student Organizations
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Departmental Societies & Student Clubs
            </h1>
            <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
              Discover accredited campus societies, join departmental chapters, apply for executive cabinet recruitments, and build your co-curricular transcript.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{societies.length}</span>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Accredited Societies</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-indigo-600">
                {recruitments.filter(r => r.status === 'open').length}
              </span>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Open Intakes</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{events.length}</span>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Campus Events</p>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">100%</span>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Faculty Supervised</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by club name, president, or advisor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Societies Grid */}
        {loading && societies.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden animate-pulse">
                <div className="h-44 sm:h-48 bg-slate-200"></div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl"></div>
                  <div className="h-8 bg-slate-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSocieties.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No societies found matching your search</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or choosing another category filter.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSocieties.map((society) => {
              const openRec = getOpenRecruitment(society.id);
              const eventCount = getSocietyEventCount(society.id);

              return (
                <div 
                  key={society.id} 
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header Wrapper */}
                  <div className="relative">
                    {/* Society Cover Photo / Banner (with overflow hidden for scale effect) */}
                    <div className="w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[16/9] overflow-hidden shrink-0 bg-slate-900">
                      {(society.cover_image || society.cover_photo) ? (
                        <MediaImage
                          src={getMediaUrl(society.cover_image || society.cover_photo)}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          alt={`${society.name} cover`}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-end p-4">
                          <span className="text-white/20 text-5xl font-black uppercase tracking-tighter leading-none">
                            {society.name.substring(0, 4)}
                          </span>
                        </div>
                      )}
                      
                      {/* Status badge */}
                      <div className="absolute top-3 right-3 z-10">
                        {openRec ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            Intake Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Logo overlay (outside overflow-hidden to prevent clipping) */}
                    <div className="absolute bottom-0 left-4 translate-y-1/2 w-14 h-14 rounded-2xl border-2 border-white shadow-lg overflow-hidden bg-white shrink-0 z-10">
                      {society.logo ? (
                        <MediaImage
                          src={getMediaUrl(society.logo)}
                          onError={handleImageError}
                          alt={society.name}
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-lg">
                          {society.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 pt-10">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      {society.name}
                    </h3>

                    
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-normal">
                      {society.description || "Official university departmental society driving student engagement, workshops, and competitions."}
                    </p>

                    {/* Meta info */}
                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                          <Award size={14} className="text-indigo-500" /> President:
                        </span>
                        <span className="font-bold text-slate-800">
                          {society.president_full_name || society.president_name || 'Assigned by Admin'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                          <GraduationCap size={14} className="text-emerald-500" /> Faculty Advisor:
                        </span>
                        <span className="font-bold text-slate-800">
                          {society.advisor_full_name || society.advisor_name || 'Faculty Member'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                          <Calendar size={14} className="text-amber-500" /> Hosted Events:
                        </span>
                        <span className="font-bold text-slate-700">
                          {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {society.social_links?.instagram && <InstagramIcon />}
                      {society.social_links?.linkedin && <LinkedinIcon />}
                      {society.bank_account_number && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full" title="Official Verified Bank Account Configured">
                          Bank Verified
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/societies/${society.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition"
                    >
                      <span>Explore Chapter</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Societies;
