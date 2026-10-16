import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  Menu, X, CalendarDays, LogOut, Bell, Shield, 
  GraduationCap, Award, Users, CheckCircle2, ChevronDown 
} from 'lucide-react';
import api from '../../utils/api';
import { MediaImage } from '../common/AuthenticatedMedia';
import { getMediaUrl } from '../../utils/media';
import { PWAInstallButton } from '../common/PWAInstallBanner';

const Navbar = () => {
  const { user, logout, isAuthLoading } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await api.get('notifications/');
          setNotifications(res.data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchNotifs();
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id) => {
    try {
      await api.post(`notifications/${id}/mark_read/`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const currentUser = user;
  const userRole = (user?.role || '').toUpperCase();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/societies', label: 'Societies' },
    { to: '/news', label: 'News' },
    { to: '/events', label: 'Events' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/gallery', label: 'Galleries' },
    { to: '/verify', label: 'Verify Certificates' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* LOGO & CAMPUS DISCOVERY LINKS */}
          <div className="flex items-center">
            <Link to="/" className="flex flex-shrink-0 items-center space-x-2.5 text-indigo-600 hover:opacity-90 transition">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                <CalendarDays size={22} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-slate-900 leading-none">
                  DSMS<span className="text-indigo-600">.</span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  Campus Societies
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex lg:ml-8 space-x-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    isActive(link.to)
                      ? 'text-indigo-600 bg-indigo-50 font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* USER ACTIONS & ROLE PORTAL BUTTON */}
          <div className="hidden sm:flex sm:items-center sm:space-x-3">
            <PWAInstallButton className="hidden md:flex" />
            {user ? (
              <>
                {/* ONLY Students see this */}
                {userRole === 'STUDENT' && (
                  <Link
                    to="/student-dashboard"
                    className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <GraduationCap size={15} />
                    <span>My Profile</span>
                  </Link>
                )}

                {/* ONLY Presidents see this */}
                {userRole === 'PRESIDENT' && (
                  <Link
                    to="/president-dashboard"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition hover:-translate-y-0.5"
                  >
                    <Award size={15} />
                    <span>President Portal</span>
                  </Link>
                )}

                {/* ONLY Faculty see this */}
                {userRole === 'FACULTY' && (
                  <Link
                    to="/advisor-dashboard"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition hover:-translate-y-0.5"
                  >
                    <Users size={15} />
                    <span>Faculty Console</span>
                  </Link>
                )}

                {/* ONLY Admins see this */}
                {userRole === 'ADMIN' && (
                  <Link
                    to="/admin-dashboard"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5"
                  >
                    <Shield size={15} />
                    <span>Admin Console</span>
                  </Link>
                )}

                {/* NOTIFICATIONS DROPDOWN */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)} 
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative cursor-pointer"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Campus Alerts</span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs font-medium">No alerts right now.</div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => markAsRead(n.id)} 
                              className={`p-3.5 border-b border-slate-50 cursor-pointer transition ${n.is_read ? 'bg-white opacity-60' : 'bg-indigo-50/40 hover:bg-indigo-50'}`}
                            >
                              <p className="text-xs text-slate-800 font-medium leading-snug">{n.message}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* USER PROFILE INFO PILL */}
                <div className="flex items-center pl-2 border-l border-slate-200">
                  {user.avatar_url || user.profile_photo_url ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-200 mr-2.5 shrink-0 shadow-xs">
                      <MediaImage
                        src={getMediaUrl(user.avatar_url || user.profile_photo_url)}
                        alt={user.first_name || user.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs mr-2.5 shrink-0">
                      {(user.first_name || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-right mr-3">
                    <span className="block text-slate-900 font-bold text-xs leading-tight">
                      {user.first_name || user.username}
                    </span>
                    <span className="block text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : isAuthLoading ? (
              <div className="flex items-center space-x-2 pl-2">
                <div className="h-8 w-16 bg-slate-200/80 animate-pulse rounded-xl" />
                <div className="h-8 w-20 bg-slate-200/80 animate-pulse rounded-xl" />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-slate-700 hover:text-slate-900 px-4 py-2 text-xs font-bold transition">
                  Sign In
                </Link>
                <Link to="/register" className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE & TABLET MENU TOGGLE */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE & TABLET DROPDOWN DRAWER */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 text-sm font-bold rounded-xl transition ${
                isActive(link.to)
                  ? 'text-indigo-600 bg-indigo-50 font-black'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-2">
            <PWAInstallButton className="w-full justify-center py-2.5" />
          </div>

          {user ? (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {userRole === 'STUDENT' && (
                <Link
                  to="/student-dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-blue-100 text-blue-700 py-2.5 rounded-xl text-xs font-bold"
                >
                  My Profile
                </Link>
              )}
              {userRole === 'PRESIDENT' && (
                <Link
                  to="/president-dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-purple-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-purple-600/20"
                >
                  President Portal
                </Link>
              )}
              {userRole === 'FACULTY' && (
                <Link
                  to="/advisor-dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  Faculty Console
                </Link>
              )}
              {userRole === 'ADMIN' && (
                <Link
                  to="/admin-dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Admin Console
                </Link>
              )}
              <button
                onClick={() => { logout(); setIsOpen(false); }}
                className="block w-full text-center bg-slate-100 text-red-600 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : isAuthLoading ? (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 h-9 bg-slate-200/80 animate-pulse rounded-xl" />
                <div className="flex-1 h-9 bg-slate-200/80 animate-pulse rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1 text-center py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-200 transition">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="flex-1 text-center py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition">
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
