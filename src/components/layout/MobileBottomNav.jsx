import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, User, GraduationCap, Award, Shield } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const MobileBottomNav = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const location = useLocation();

  // Determine user destination
  const getAccountDestination = () => {
    if (!user) return '/login';
    const role = (user.role || '').toUpperCase();
    if (role === 'PRESIDENT') return '/president-dashboard';
    if (role === 'FACULTY' || role === 'ADVISOR') return '/advisor-dashboard';
    if (role === 'ADMIN' || user.is_staff) return '/admin-dashboard';
    return '/student-dashboard';
  };

  const accountPath = getAccountDestination();

  const isAccountActive = user
    ? ['/student-dashboard', '/president-dashboard', '/advisor-dashboard', '/admin-dashboard', '/attendance', '/membership-roster', '/student/transcript'].some(p => location.pathname.startsWith(p))
    : location.pathname === '/login' || location.pathname === '/register';

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-1.5 pb-safe">
      <div className="grid grid-cols-4 items-center gap-1">
        {/* 1. HOME */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 rounded-xl transition ${
              isActive && location.pathname === '/'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Home size={20} />
          <span className="text-[10px] mt-0.5 font-medium">Home</span>
        </NavLink>

        {/* 2. SOCIETIES */}
        <NavLink
          to="/societies"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 rounded-xl transition ${
              isActive
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Users size={20} />
          <span className="text-[10px] mt-0.5 font-medium">Societies</span>
        </NavLink>

        {/* 3. EVENTS */}
        <NavLink
          to="/events"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 rounded-xl transition ${
              isActive
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Calendar size={20} />
          <span className="text-[10px] mt-0.5 font-medium">Events</span>
        </NavLink>

        {/* 4. ACCOUNT / SIGN IN */}
        <NavLink
          to={accountPath}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
            isAccountActive
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {isAuthLoading ? (
            <div className="w-5 h-5 rounded-full bg-slate-200 animate-pulse my-0.5" />
          ) : user ? (
            user.role === 'president' ? (
              <Award size={20} />
            ) : user.role === 'faculty' ? (
              <Users size={20} />
            ) : user.role === 'admin' ? (
              <Shield size={20} />
            ) : (
              <GraduationCap size={20} />
            )
          ) : (
            <User size={20} />
          )}
          <span className="text-[10px] mt-0.5 font-medium">
            {isAuthLoading ? (
              <span className="inline-block w-8 h-2 bg-slate-200 animate-pulse rounded" />
            ) : user ? (
              'My Portal'
            ) : (
              'Sign In'
            )}
          </span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
