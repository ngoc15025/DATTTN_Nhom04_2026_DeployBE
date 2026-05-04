import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import LecturerLayout from './layouts/LecturerLayout';
import StudentLayout from './layouts/StudentLayout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import LecturerManagement from './pages/admin/LecturerManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import ClassStudents from './pages/admin/ClassStudents';

import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import LecturerClasses from './pages/lecturer/LecturerClasses';
import AttendanceToday from './pages/lecturer/AttendanceToday';
import SessionsManagement from './pages/lecturer/SessionsManagement';
import QRAttendance from './pages/lecturer/QRAttendance';
import ManualAttendance from './pages/lecturer/ManualAttendance';
import LecturerProfile from './pages/lecturer/LecturerProfile';
import LecturerAppeals from './pages/lecturer/LecturerAppeals';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentCheckin from './pages/student/StudentCheckin';
import StudentComplaints from './pages/student/StudentComplaints';
import StudentProfile from './pages/student/StudentProfile';
import StudentClasses from './pages/student/StudentClasses';
import StudentScanner from './pages/student/StudentScanner';
import StudentHistory from './pages/student/StudentHistory';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="lecturers" element={<LecturerManagement />} />
          </Route>

          {/* Lecturer Routes */}
          <Route path="/lecturer" element={
            <ProtectedRoute allowedRoles={['lecturer']}>
              <LecturerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/lecturer/dashboard" replace />} />
            <Route path="dashboard" element={<LecturerDashboard />} />
            <Route path="classes" element={<LecturerClasses />} />
            <Route path="attendance-today" element={<AttendanceToday />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="subjects" element={<SubjectManagement />} />
            <Route path="subjects/:monId/classes" element={<ClassManagement />} />
            <Route path="class-students/:maLop" element={<ClassStudents />} />
            <Route path="sessions/:classId" element={<SessionsManagement />} />
            <Route path="qr-attendance/:classId" element={<QRAttendance />} />
            <Route path="manual/:classId" element={<ManualAttendance />} />
            <Route path="profile" element={<LecturerProfile />} />
            <Route path="appeals" element={<LecturerAppeals />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="history" element={<StudentHistory />} />
            <Route path="checkin/:classId" element={<StudentCheckin />} />
            <Route path="classes" element={<StudentClasses />} />
            <Route path="qr-scan" element={<StudentScanner />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
