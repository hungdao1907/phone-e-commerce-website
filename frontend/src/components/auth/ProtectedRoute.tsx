import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  unauthorizedTo?: string;
}

export const ProtectedRoute = ({ allowedRoles, unauthorizedTo }: ProtectedRouteProps) => {
  const { token, user } = useAuthStore();

  // If there is no token, redirect to the login page
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user's role is not in the list, redirect them
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (unauthorizedTo) return <Navigate to={unauthorizedTo} replace />;
    if (user.role === 'customer') {
      return <Navigate to="/profile" replace />;
    }
    if (user.role === 'staff' || ['admin', 'superadmin', 'manager', 'user'].includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
    // Otherwise send to home
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the child routes (e.g. DashboardLayout)
  return <Outlet />;
};
