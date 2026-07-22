import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import CollegeLayout from './layouts/CollegeLayout'
import { LoadingSpinner } from './components/UI'

import Login from './pages/Login'
import Register from './pages/Register'
import Unauthorized from './pages/Unauthorized'
import CollegeLogin from './pages/CollegeLogin'

import Careers from './pages/public/Careers'
import CareerDetail from './pages/public/CareerDetail'
import Home from './pages/public/Home'

import AdminDashboard from './pages/admin/AdminDashboard'
import Colleges from './pages/admin/Colleges'
import PlacementOfficers from './pages/admin/PlacementOfficers'
import Interviewers from './pages/hr/Interviewers'
import Jobs from './pages/admin/Jobs'
import JobDetail from './pages/admin/JobDetail'
import Audit from './pages/admin/Audit'
import DataQuality from './pages/admin/DataQuality'
import Drives from './pages/admin/Drives'

import Pipeline from './pages/recruit/Pipeline'
import Applications from './pages/recruit/Applications'
import Candidates from './pages/recruit/Candidates'
import CandidateDetail from './pages/recruit/CandidateDetail'
import ApplicationDetail from './pages/recruit/ApplicationDetail'
import Joined from './pages/recruit/Joined'
import Interviews from './pages/recruit/Interviews'
import MyInterviews from './pages/recruit/MyInterviews'
import Analytics from './pages/recruit/Analytics'
import PolicyAssistant from './pages/hr/PolicyAssistant'
import WorkforcePlanning from './pages/hr/WorkforcePlanning'
import DocumentViewer from './pages/DocumentViewer'
import Notifications from './pages/Notifications'
import NotFound from './pages/NotFound'

import CollegePortal from './pages/college/CollegePortal'
import CollegeStudents from './pages/college/CollegeStudents'
import CollegeJobDetail from './pages/college/CollegeJobDetail'
import CollegeScorecard from './pages/college/CollegeScorecard'

import CandidateProfile from './pages/candidate/CandidateProfile'
import MyApplications from './pages/candidate/MyApplications'

function RoleHome() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner full />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'PLACEMENT_OFFICER' && user.college_slug) return <Navigate to={`/${user.college_slug}`} replace />
  if (user.role === 'CANDIDATE') return <Navigate to="/app/my-applications" replace />
  if (user.role === 'INTERVIEWER') return <Navigate to="/app/my-interviews" replace />
  if (user.role === 'HR') return <Navigate to="/app/pipeline" replace />
  return <Navigate to="/app/dashboard" replace />
}

const STAFF = ['ADMIN', 'HR']

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/careers/:jid" element={<CareerDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/interviewer/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Authenticated app (Admin / HR / Candidate) */}
      <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<RoleHome />} />
        <Route path="dashboard" element={<ProtectedRoute roles={STAFF}><AdminDashboard /></ProtectedRoute>} />
        <Route path="colleges" element={<ProtectedRoute roles={STAFF}><Colleges /></ProtectedRoute>} />
        <Route path="placement-officers" element={<ProtectedRoute roles={['ADMIN']}><PlacementOfficers /></ProtectedRoute>} />
        <Route path="interviewers" element={<ProtectedRoute roles={STAFF}><Interviewers /></ProtectedRoute>} />
        <Route path="jobs" element={<ProtectedRoute roles={STAFF}><Jobs /></ProtectedRoute>} />
        <Route path="jobs/:jid" element={<ProtectedRoute roles={STAFF}><JobDetail /></ProtectedRoute>} />
        <Route path="pipeline" element={<ProtectedRoute roles={STAFF}><Pipeline /></ProtectedRoute>} />
        <Route path="applications" element={<ProtectedRoute roles={STAFF}><Applications /></ProtectedRoute>} />
        <Route path="candidates" element={<ProtectedRoute roles={STAFF}><Candidates /></ProtectedRoute>} />
        <Route path="candidates/:id" element={<ProtectedRoute roles={STAFF}><CandidateDetail /></ProtectedRoute>} />
        <Route path="applications/:aid" element={<ProtectedRoute roles={STAFF}><ApplicationDetail /></ProtectedRoute>} />
        <Route path="interviews" element={<ProtectedRoute roles={STAFF}><Interviews /></ProtectedRoute>} />
        <Route path="my-interviews" element={<MyInterviews />} />
        <Route path="analytics" element={<ProtectedRoute roles={STAFF}><Analytics /></ProtectedRoute>} />
        <Route path="joined" element={<ProtectedRoute roles={STAFF}><Joined /></ProtectedRoute>} />
        <Route path="policy-assistant" element={<ProtectedRoute roles={['ADMIN', 'HR', 'CANDIDATE']}><PolicyAssistant /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute roles={['ADMIN']}><Audit /></ProtectedRoute>} />
        <Route path="data-quality" element={<ProtectedRoute roles={STAFF}><DataQuality /></ProtectedRoute>} />
        <Route path="drives" element={<ProtectedRoute roles={STAFF}><Drives /></ProtectedRoute>} />
        <Route path="workforce" element={<ProtectedRoute roles={STAFF}><WorkforcePlanning /></ProtectedRoute>} />
        {/* Candidate Only */}
        <Route path="my-profile" element={<ProtectedRoute roles={['CANDIDATE']}><CandidateProfile /></ProtectedRoute>} />
        <Route path="my-applications" element={<ProtectedRoute roles={['CANDIDATE']}><MyApplications /></ProtectedRoute>} />
      </Route>

      {/* College portal (slug) — dynamic routes are matched after static ones */}
      <Route path="/:slug/login" element={<CollegeLogin />} />
      <Route path="/:slug" element={<ProtectedRoute roles={['PLACEMENT_OFFICER', 'ADMIN', 'HR']}><CollegeLayout /></ProtectedRoute>}>
        <Route index element={<CollegePortal />} />
        <Route path="students" element={<CollegeStudents />} />
        <Route path="scorecard" element={<CollegeScorecard />} />
        <Route path="jobs/:jid" element={<CollegeJobDetail />} />
        <Route path="policy-assistant" element={<PolicyAssistant />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Standalone Document Viewer */}
      <Route path="/viewer" element={<ProtectedRoute><DocumentViewer /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
