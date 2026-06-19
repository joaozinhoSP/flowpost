import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/toast';
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import PricingPage from './pages/Pricing';
import PaymentSuccessPage from './pages/PaymentSuccess';
import PaymentCancelPage from './pages/PaymentCancel';
import DashboardHome from './pages/DashboardHome';
import DashboardNewPost from './pages/DashboardNewPost';
import DashboardCalendar from './pages/DashboardCalendar';
import DashboardPosts from './pages/DashboardPosts';
import DashboardAnalytics from './pages/DashboardAnalytics';
import DashboardSocial from './pages/DashboardSocial';
import DashboardSettings from './pages/DashboardSettings';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/dashboard/layout';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel" element={<PaymentCancelPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardHome />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardNewPost />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/calendar"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardCalendar />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/posts"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardPosts />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analytics"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardAnalytics />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/social"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardSocial />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardSettings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
