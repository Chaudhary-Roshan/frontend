import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const StudentOnlyRoute = ({ children, currentUser }) => {
  const { user: authUser, loading } = useContext(AuthContext);
  const user = currentUser || authUser;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Fallback for unauthenticated users
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').toUpperCase();

  // If a non-student tries to access the student profile, bounce them to their correct dashboard
  if (role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
  if (role === 'FACULTY') return <Navigate to="/advisor-dashboard" replace />;
  if (role === 'PRESIDENT') return <Navigate to="/president-dashboard" replace />;

  // If they are a student, render the profile page normally
  if (role === 'STUDENT') return children;

  // Fallback for any other unauthorized role
  return <Navigate to="/login" replace />;
};

export default StudentOnlyRoute;
