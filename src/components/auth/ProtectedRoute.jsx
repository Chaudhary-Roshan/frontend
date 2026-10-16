import React from 'react';
import RequireAuth from './RequireAuth';

/**
 * ProtectedRoute component - Reusable adapter backed by centralized RequireAuth.
 */
const ProtectedRoute = (props) => {
  return <RequireAuth {...props} />;
};

export default ProtectedRoute;
