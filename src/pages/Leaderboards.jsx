import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Trophy, CalendarDays, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Leaderboards = () => {
  const [societies, setSocieties] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [socRes, evRes] = await Promise.all([
          api.get('societies/'),
          api.get('events/')
        ]);
        
        // Calculate points based on events (just an example metric)
        const enrichedSocieties = socRes.data.map(soc => {
          const socEvents = evRes.data.filter(e => e.society === soc.id);
          const score = socEvents.length * 50; // simple points logic
          return { ...soc, score, events_count: socEvents.length };
        });
        
        // Sort by score
        setSocieties(enrichedSocieties.sort((a, b) => b.score - a.score));
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Trophy size={28} /></div>
          Society Leaderboards
        </h1>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {societies.map((soc, index) => (
            <div key={soc.id} className={`p-6 border-b border-slate-100 flex items-center justify-between ${index < 3 ? 'bg-amber-50/30' : ''}`}>
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl ${
                  index === 0 ? 'bg-amber-100 text-amber-600' : 
                  index === 1 ? 'bg-slate-200 text-slate-600' :
                  index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  #{index + 1}
                </div>
                <div>
                  <Link to={`/societies/${soc.id}`} className="text-xl font-bold text-slate-900 hover:text-indigo-600 transition-colors">{soc.name}</Link>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Events</p>
                  <p className="font-extrabold text-slate-800 flex items-center justify-center gap-1"><CalendarDays size={14}/> {soc.events_count}</p>
                </div>
                <div className="text-center bg-indigo-50 px-4 py-2 rounded-xl">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Score</p>
                  <p className="font-extrabold text-indigo-700 flex items-center justify-center gap-1"><Star size={14}/> {soc.score}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
