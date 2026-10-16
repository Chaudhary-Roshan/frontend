import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

/**
 * Returns the canonical dashboard URI based on user role.
 */
export const getCanonicalDashboard = (role) => {
  switch ((role || '').toLowerCase()) {
    case 'admin':
      return '/admin-dashboard';
    case 'faculty':
      return '/advisor-dashboard';
    case 'president':
      return '/president-dashboard';
    case 'student':
      return '/student-dashboard';
    default:
      return '/';
  }
};

/**
 * Centralized Reusable Guard Component (RequireAuth).
 * Automatically checks global auth state and role permissions:
 * - If not logged in -> seamlessly navigates to /login
 * - If role not authorized -> seamlessly auto-routes to canonical dashboard without getting stuck on dead-end error pages
 * - Supports props: `role="faculty"`, `roles={['faculty', 'admin']}`, or `allowedRoles={['faculty', 'admin']}`
 */
const RequireAuth = ({ children, role, roles, allowedRoles }) => {
  const { user, loading, isAuthLoading } = useContext(AuthContext);
  const location = useLocation();

  if (loading || isAuthLoading) {
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

  // Normalize allowed roles list from either `role`, `roles`, or `allowedRoles`
  const targetRoles = [];
  if (role) {
    if (Array.isArray(role)) targetRoles.push(...role);
    else targetRoles.push(role);
  }
  if (roles && Array.isArray(roles)) {
    targetRoles.push(...roles);
  }
  if (allowedRoles && Array.isArray(allowedRoles)) {
    targetRoles.push(...allowedRoles);
  }

  const normalizedAllowed = targetRoles.map(r => String(r).toLowerCase());
  const userRole = (user.role || '').toLowerCase();

  // If specific roles are required and current user is not authorized
  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(userRole)) {
    const destination = getCanonicalDashboard(userRole);
    // Avoid redirect loops if destination is the current pathname
    if (location.pathname === destination) {
      return children;
    }
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default RequireAuth;
