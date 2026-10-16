import { MediaImage } from '../components/common/AuthenticatedMedia';
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { getMediaUrl, handleImageError } from '../utils/media';
import { Megaphone, Search, Calendar } from 'lucide-react';

const News = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get('news/');
        setNewsItems(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const getRoleBadge = (role, society) => {
    if (role === 'admin') {
      return {
        label: 'Super Admin Notice',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    }
    if (role === 'faculty') {
      return {
        label: society ? `Faculty Advisor (${society})` : 'Faculty Advisor',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (role === 'president') {
      return {
        label: society ? `President (${society})` : 'Society President',
        className: 'bg-violet-50 text-violet-700 border-violet-200'
      };
    }
    return {
      label: 'Campus Official',
      className: 'bg-slate-50 text-slate-700 border-slate-200'
    };
  };

  const filteredNews = newsItems.filter(item => {
    const matchesSearch = 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author_society?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedFilter === 'admin') return item.author_role === 'admin';
    if (selectedFilter === 'faculty') return item.author_role === 'faculty';
    if (selectedFilter === 'president') return item.author_role === 'president';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
                <Megaphone size={14} /> Official Feed
              </span>
              <span className="text-xs font-bold text-slate-400">Campus Dispatches</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              News & Announcements
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl font-medium">
              Official circulars, society press releases, workshop announcements, and executive directives.
            </p>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* ROLE FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All Notices (${newsItems.length})` },
            { id: 'admin', label: 'Admin Dispatches' },
            { id: 'faculty', label: 'Faculty Advisor Memos' },
            { id: 'president', label: 'Society Releases' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* NEWS LIST */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <Megaphone className="mx-auto text-slate-300 mb-3" size={44} />
            <h3 className="font-bold text-slate-700 text-base">No announcements found</h3>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search or filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNews.map(news => {
              const badge = getRoleBadge(news.author_role, news.author_society);
              return (
                <div 
                  key={news.id} 
                  className="bg-white p-7 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <Calendar size={13} /> {new Date(news.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                      {news.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-sm sm:text-base mt-3 whitespace-pre-line">
                      {news.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 border-t border-slate-100 pt-5 mt-6">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm shrink-0">
                      {news.society_logo ? (
                        <MediaImage
                          src={getMediaUrl(news.society_logo)}
                          onError={handleImageError}
                          alt={news.author_society || news.author_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-black text-sm uppercase">
                          {news.author_name ? news.author_name[0] : 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{news.author_name || 'Campus Administrator'}</p>
                      <p className="text-[11px] font-semibold text-slate-400">
                        {badge.label}
                      </p>
                    </div>
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

export default News;
