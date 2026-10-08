import React, { useState, useEffect } from 'react';
import { Award, Trophy, Sparkles, Filter, Users } from 'lucide-react';
import api from '../utils/api';

const Showcases = () => {
  const [societies, setSocieties] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await api.get('societies/');
        setSocieties(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSocieties();
  }, []);

  // Curated campus showcases
  const showcases = [
    {
      id: 1,
      title: "Autonomous Rover Project (Mars Rover Challenge)",
      society: "Computer Science Society",
      category: "Engineering & Tech",
      award: "1st Place - National Robotics Olympiad 2025",
      description: "A custom 6-wheel rocker-bogie rover built with ROS 2, computer vision for terrain mapping, and autonomous obstacle avoidance.",
      tags: ["Robotics", "ROS 2", "Python", "Computer Vision"],
      team: "12 Students (CS & EE)",
      year: "2025-2026",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: 2,
      title: "Campus Sustainable Energy Audit System",
      society: "Green Campus Initiative",
      category: "Sustainability",
      award: "Provost Innovation Grant 2026",
      description: "IoT sensor grid tracking real-time HVAC electricity consumption and carbon footprint reductions across campus buildings.",
      tags: ["IoT", "Sustainability", "Data Analytics"],
      team: "8 Students",
      year: "2026",
      image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: 3,
      title: "Annual Theatrical Play: 'Echoes of the Quad'",
      society: "Drama Club",
      category: "Arts & Culture",
      award: "Best Stage Production & Direction Award",
      description: "An original student-written three-act theater performance exploring university student life, screened to an audience of over 800 students.",
      tags: ["Stagecraft", "Production", "Scriptwriting"],
      team: "24 Actors & Crew",
      year: "2025",
      image: "https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: 4,
      title: "Decentralized University Credential Vault",
      society: "Computer Science Society",
      category: "Engineering & Tech",
      award: "Hackathon Grand Winner 2025",
      description: "Cryptographically verifiable transcripts and badges built on public blockchain rails to verify degrees and co-curricular hours.",
      tags: ["Blockchain", "Solidity", "React", "Zero-Knowledge"],
      team: "4 Students",
      year: "2025",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=60"
    }
  ];

  const filtered = showcases.filter(s => {
    if (selectedFilter === 'all') return true;
    return s.category.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HERO BANNER */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/30 px-3 py-1 rounded-full border border-indigo-400/40 inline-flex items-center gap-1.5 mb-3">
              <Sparkles size={14} className="text-amber-400" /> Student Innovation Showcase
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Society Projects & Hall of Fame
            </h1>
            <p className="text-indigo-100 text-sm mt-2 leading-relaxed">
              Explore outstanding technical prototypes, creative productions, and research initiatives created by our student societies.
            </p>
          </div>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'all', label: 'All Showcases' },
            { id: 'engineering', label: 'Engineering & Tech' },
            { id: 'sustainability', label: 'Sustainability' },
            { id: 'arts', label: 'Arts & Culture' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SHOWCASE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map(item => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="h-56 relative overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    {item.society}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 bg-amber-500/90 backdrop-blur-md text-amber-950 text-xs font-black px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                    <Trophy size={16} className="shrink-0" />
                    <span className="truncate">{item.award}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {item.tags.map(t => (
                      <span key={t} className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Users size={15} className="text-indigo-500" />
                  <span>{item.team}</span>
                </div>
                <span>Academic Year: {item.year}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Showcases;
