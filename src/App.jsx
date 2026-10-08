import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import StudentOnlyRoute from './components/auth/StudentOnlyRoute';

// Public & Campus Discovery Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Societies from './pages/Societies';
import SocietyDetail from './pages/SocietyDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EventCalendar from './pages/EventCalendar';
import Showcases from './pages/Showcases';
import Galleries from './pages/Galleries';
import Leaderboards from './pages/Leaderboards';
import News from './pages/News';
import CertificateVerify from './pages/CertificateVerify';
import { VerifyMemberPage, VerifyTicketPage } from './pages/VerifyCredential';
import Help from './pages/Help';

// Role-Specific Portals
import AdminDashboard from './pages/dashboards/AdminDashboard';
import AdvisorDashboard from './pages/dashboards/AdvisorDashboard';
import PresidentDashboard from './pages/dashboards/PresidentDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import CoCurricularTranscript from './pages/dashboards/CoCurricularTranscript';

// President Sub-Pages
import CabinetManagement from './pages/dashboards/CabinetManagement';
import RecruitmentManagement from './pages/dashboards/RecruitmentManagement';
import CommunicationTrail from './pages/dashboards/CommunicationTrail';
import BudgetManagement from './pages/dashboards/BudgetManagement';
import AttendanceManagement from './pages/dashboards/AttendanceManagement';
import MembershipRoster from './pages/dashboards/MembershipRoster';

import Footer from './components/layout/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Unauthenticated Gateway */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Private Campus Discovery Routes (Protected - Authenticated Only) */}
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/societies" element={<ProtectedRoute><Societies /></ProtectedRoute>} />
              <Route path="/societies/:id" element={<ProtectedRoute><SocietyDetail /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
              <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><EventCalendar /></ProtectedRoute>} />
              <Route path="/showcases" element={<ProtectedRoute><Showcases /></ProtectedRoute>} />
              <Route path="/gallery" element={<ProtectedRoute><Galleries /></ProtectedRoute>} />
              <Route path="/leaderboards" element={<ProtectedRoute><Leaderboards /></ProtectedRoute>} />
              <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
              <Route path="/verify" element={<CertificateVerify />} />
              <Route path="/verify/member/:code" element={<VerifyMemberPage />} />
              <Route path="/verify/ticket/:code" element={<VerifyTicketPage />} />
              <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />

              {/* Role-Specific Protected Portals */}
              <Route 
                path="/student-dashboard" 
                element={
                  <StudentOnlyRoute>
                    <StudentDashboard />
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
                <ProtectedRoute allowedRoles={['president', 'faculty', 'admin']}>
                  <PresidentDashboard />
                </ProtectedRoute>
              } />

              <Route path="/advisor-dashboard" element={
                <ProtectedRoute allowedRoles={['faculty', 'president', 'admin']}>
                  <AdvisorDashboard />
                </ProtectedRoute>
              } />

              <Route path="/faculty-dashboard" element={<Navigate to="/advisor-dashboard" replace />} />

              <Route path="/admin-dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Attendance Desk for President, Faculty, Admin, and Assigned Student Volunteers */}
              <Route path="/attendance" element={
                <ProtectedRoute allowedRoles={['president', 'faculty', 'admin', 'student']}>
                  <AttendanceManagement />
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
                <ProtectedRoute allowedRoles={['president', 'admin']}>
                  <CabinetManagement />
                </ProtectedRoute>
              } />
              <Route path="/president/recruitments" element={
                <ProtectedRoute allowedRoles={['president', 'admin']}>
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

              {/* Fallback to Home / Protected Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
