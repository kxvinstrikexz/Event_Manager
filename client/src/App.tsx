import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';

// Global & Public Pages
import { Gateway } from './pages/Gateway.js';
import { VerifyCertificate } from './pages/VerifyCertificate.js';
import { Legal } from './pages/Legal.js';

// Auth Pages
import { StudentAuth } from './pages/auth/StudentAuth.js';
import { StaffAuth } from './pages/auth/StaffAuth.js';
import { AdminAuth } from './pages/auth/AdminAuth.js';

// Layout
import { PortalLayout } from './components/layout/PortalLayout.js';

// Student Portal Pages
import { StudentDashboard } from './pages/student/StudentDashboard.js';
import { StudentEvents } from './pages/student/StudentEvents.js';
import { StudentEventDetail } from './pages/student/StudentEventDetail.js';
import { StudentRegistrations } from './pages/student/StudentRegistrations.js';
import { StudentCertificates } from './pages/student/StudentCertificates.js';
import { StudentProfile } from './pages/student/StudentProfile.js';

// Staff Portal Pages
import { StaffDashboard } from './pages/staff/StaffDashboard.js';
import { StaffEvents } from './pages/staff/StaffEvents.js';
import { StaffCreateEditEvent } from './pages/staff/StaffCreateEditEvent.js';
import { StaffEventDetail } from './pages/staff/StaffEventDetail.js';
import { StaffAttendance } from './pages/staff/StaffAttendance.js';
import { StaffFeedback } from './pages/staff/StaffFeedback.js';
import { StaffCertificates } from './pages/staff/StaffCertificates.js';
import { StaffProfile } from './pages/staff/StaffProfile.js';

// Admin Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminStaffManagement } from './pages/admin/AdminStaffManagement.js';
import { AdminStaffManagementPage } from './pages/admin/AdminStaffManagementPage.js';
import { AdminEvents } from './pages/admin/AdminEvents.js';
import { AdminRegistrations } from './pages/admin/AdminRegistrations.js';
import { AdminAttendance } from './pages/admin/AdminAttendance.js';
import { AdminFeedback } from './pages/admin/AdminFeedback.js';
import { AdminCertificates } from './pages/admin/AdminCertificates.js';
import { AdminReports } from './pages/admin/AdminReports.js';
import { AdminProfile } from './pages/admin/AdminProfile.js';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Gateway & Public */}
            <Route path="/" element={<Gateway />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/terms" element={<Legal type="terms" />} />
            <Route path="/privacy" element={<Legal type="privacy" />} />

            {/* Student Auth Routes */}
            <Route path="/student/login" element={<StudentAuth initialMode="login" />} />
            <Route path="/student/register" element={<StudentAuth initialMode="register" />} />
            <Route path="/student/forgot-password" element={<StudentAuth initialMode="forgot" />} />
            <Route path="/student/reset-password" element={<StudentAuth initialMode="reset" />} />

            {/* Student Portal Protected Routes */}
            <Route path="/student" element={<PortalLayout portal="student" title="Student Portal" />}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="events" element={<StudentEvents />} />
              <Route path="events/:id" element={<StudentEventDetail />} />
              <Route path="registrations" element={<StudentRegistrations />} />
              <Route path="certificates" element={<StudentCertificates />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            {/* Staff Auth Routes */}
            <Route path="/staff/login" element={<StaffAuth initialMode="login" />} />
            <Route path="/staff/register" element={<StaffAuth initialMode="register" />} />
            <Route path="/staff/forgot-password" element={<StaffAuth initialMode="forgot" />} />
            <Route path="/staff/reset-password" element={<StaffAuth initialMode="reset" />} />

            {/* Staff Portal Protected Routes */}
            <Route path="/staff" element={<PortalLayout portal="staff" title="Faculty & Staff Portal" />}>
              <Route index element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="events" element={<StaffEvents />} />
              <Route path="events/create" element={<StaffCreateEditEvent />} />
              <Route path="events/:id" element={<StaffEventDetail />} />
              <Route path="events/:id/edit" element={<StaffCreateEditEvent />} />
              <Route path="attendance" element={<StaffAttendance />} />
              <Route path="feedback" element={<StaffFeedback />} />
              <Route path="certificates" element={<StaffCertificates />} />
              <Route path="profile" element={<StaffProfile />} />
            </Route>

            {/* Admin Auth Route */}
            <Route path="/admin/login" element={<AdminAuth />} />

            {/* Admin Portal Protected Routes */}
            <Route path="/admin" element={<PortalLayout portal="admin" title="Administration Control Center" />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="staff-management" element={<AdminStaffManagementPage />} />
              <Route path="staff" element={<AdminStaffManagement />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="registrations" element={<AdminRegistrations />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="certificates" element={<AdminCertificates />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
