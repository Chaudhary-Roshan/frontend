import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PWAProvider } from './context/PWAContext';
import AppShell from './components/layout/AppShell';
import { PageSkeleton, DashboardSkeleton } from './components/layout/AppShellSkeleton';
import ProtectedRoute from './components/auth/ProtectedRoute';
import StudentOnlyRoute from './components/auth/StudentOnlyRoute';

// ----------------------------------------------------------------------
// Code-Split Dynamic Route Modules (App Shell Architecture)
// ----------------------------------------------------------------------
// Public & Campus Discovery Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Societies = lazy(() => import('./pages/Societies'));
const SocietyDetail = lazy(() => import('./pages/SocietyDetail'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const EventCalendar = lazy(() => import('./pages/EventCalendar'));
const Showcases = lazy(() => import('./pages/Showcases'));
const Galleries = lazy(() => import('./pages/Galleries'));
const Leaderboards = lazy(() => import('./pages/Leaderboards'));
const News = lazy(() => import('./pages/News'));
const CertificateVerify = lazy(() => import('./pages/CertificateVerify'));
const VerifyMemberPage = lazy(() => import('./pages/VerifyCredential').then(m => ({ default: m.VerifyMemberPage })));
const VerifyTicketPage = lazy(() => import('./pages/VerifyCredential').then(m => ({ default: m.VerifyTicketPage })));
const Help = lazy(() => import('./pages/Help'));

// Role-Specific Portals
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard'));
const AdvisorDashboard = lazy(() => import('./pages/dashboards/AdvisorDashboard'));
const PresidentDashboard = lazy(() => import('./pages/dashboards/PresidentDashboard'));
const StudentDashboard = lazy(() => import('./pages/dashboards/StudentDashboard'));
const CoCurricularTranscript = lazy(() => import('./pages/dashboards/CoCurricularTranscript'));

// President Sub-Pages
const CabinetManagement = lazy(() => import('./pages/dashboards/CabinetManagement'));
const RecruitmentManagement = lazy(() => import('./pages/dashboards/RecruitmentManagement'));
const CommunicationTrail = lazy(() => import('./pages/dashboards/CommunicationTrail'));
const BudgetManagement = lazy(() => import('./pages/dashboards/BudgetManagement'));
const AttendanceManagement = lazy(() => import('./pages/dashboards/AttendanceManagement'));
const MembershipRoster = lazy(() => import('./pages/dashboards/MembershipRoster'));
const EventRegistrationRecords = lazy(() => import('./pages/dashboards/EventRegistrationRecords'));

function App() {
  return (
    <PWAProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* The Persistent App Shell Frame */}
            <Route element={<AppShell />}>
              {/* Unauthenticated Gateway */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Public Campus Discovery Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/societies" element={<Societies />} />
              <Route path="/societies/:id" element={<SocietyDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/calendar" element={<EventCalendar />} />
              <Route path="/showcases" element={<Showcases />} />
              <Route path="/gallery" element={<Galleries />} />
              <Route path="/leaderboards" element={<Leaderboards />} />
              <Route path="/news" element={<News />} />
              <Route path="/verify" element={<CertificateVerify />} />
              <Route path="/verify/member/:code" element={<VerifyMemberPage />} />
              <Route path="/verify/ticket/:code" element={<VerifyTicketPage />} />
              <Route path="/help" element={<Help />} />

              {/* Role-Specific Protected Portals with Dedicated Dashboard Skeleton */}
              <Route 
                path="/student-dashboard" 
                element={
                  <StudentOnlyRoute>
                    <Suspense fallback={<DashboardSkeleton />}>
                      <StudentDashboard />
                    </Suspense>
                  </StudentOnlyRoute>
                } 
              />

              <Route 
                path="/student/transcript" 
                element={
                  <StudentOnlyRoute>
                    <CoCurricularTranscript />
                  </StudentOnlyRoute>
                } 
              />

              <Route path="/president-dashboard" element={
                <ProtectedRoute allowedRoles={['president', 'admin']}>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <PresidentDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/advisor-dashboard" element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <AdvisorDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/faculty-dashboard" element={<Navigate to="/advisor-dashboard" replace />} />

              <Route path="/admin-dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<DashboardSkeleton />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Operations & Attendance Management */}
              <Route path="/attendance" element={
                <ProtectedRoute allowedRoles={['president', 'faculty', 'admin', 'student']}>
                  <AttendanceManagement />
                </ProtectedRoute>
              } />
              <Route path="/event-records" element={
                <ProtectedRoute allowedRoles={['president', 'faculty', 'admin', 'student']}>
                  <EventRegistrationRecords />
                </ProtectedRoute>
              } />
              <Route path="/president/event-records" element={
                <ProtectedRoute allowedRoles={['president', 'faculty', 'admin']}>
                  <EventRegistrationRecords />
                </ProtectedRoute>
              } />
              <Route path="/membership-roster" element={
                <ProtectedRoute allowedRoles={['president', 'faculty', 'admin']}>
                  <MembershipRoster />
                </ProtectedRoute>
              } />
              <Route path="/president/attendance" element={
                <ProtectedRoute allowedRoles={['president', 'faculty', 'admin', 'student']}>
                  <AttendanceManagement />
                </ProtectedRoute>
              } />
              <Route path="/president/cabinet" element={
                <ProtectedRoute allowedRoles={['president', 'faculty', 'admin']}>
                  <CabinetManagement />
                </ProtectedRoute>
              } />
              <Route path="/president/recruitments" element={
                <ProtectedRoute allowedRoles={['president', 'faculty', 'admin']}>
                  <RecruitmentManagement />
                </ProtectedRoute>
              } />
              <Route path="/president/communications" element={
                <ProtectedRoute allowedRoles={['president', 'admin']}>
                  <CommunicationTrail />
                </ProtectedRoute>
              } />
              <Route path="/president/budget" element={
                <ProtectedRoute allowedRoles={['president', 'admin']}>
                  <BudgetManagement />
                </ProtectedRoute>
              } />

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </PWAProvider>
  );
}

export default App;
