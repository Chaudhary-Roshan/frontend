import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-semibold text-sm">Verifying Campus Credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const isPresidentSection = allowedRoles.includes('president');
    const myDashboardRoute = 
      user.role === 'student' ? '/student-dashboard' :
      user.role === 'faculty' ? '/advisor-dashboard' :
      user.role === 'president' ? '/president-dashboard' :
      user.role === 'admin' ? '/admin-dashboard' : '/';

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl mb-4 border border-amber-200 shadow-sm">
          <ShieldAlert size={44} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-600 max-w-md mb-2 text-sm leading-relaxed">
          This portal section requires <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">{allowedRoles.join(' or ')}</span> privileges.
        </p>
        <p className="text-xs text-slate-500 mb-6 font-medium">
          You are currently signed in as <strong className="text-slate-800">{user.username}</strong> with role <strong className="text-indigo-600 uppercase tracking-wider">{user.role}</strong>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            Switch to President Account
          </button>
          
          <button
            onClick={() => window.location.href = myDashboardRoute}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition cursor-pointer"
          >
            Return to My Portal
          </button>

          <button
            onClick={() => window.history.back()}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-2xl font-bold text-xs transition cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
