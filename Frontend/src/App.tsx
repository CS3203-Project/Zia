import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import { AuthProvider } from './contexts/AuthContext';
import { LoaderProvider } from './components/shared/LoaderContext';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/shared/ScrollToTop';
import AppToaster from './components/shared/AppToaster';
import Homepage from './Pages/marketing/Homepage';
import Signup from './Pages/auth/Signup.tsx'
import SignIn from './Pages/auth/SignIn.tsx'
import BrowseServices from './Pages/services/BrowseServices';
import AdminLogin from "./Pages/auth/AdminLogin.tsx";

const Articles = lazy(() => import('./Pages/marketing/Articles.tsx'));
const OnlineServiceProviderProfile = lazy(() => import('./Pages/provider/OnlineServiceProviderProfile'));
const PrintingServiceProviderProfile = lazy(() => import('./Pages/provider/PrintingServiceProviderProfile'));
const ServiceCategoryPage = lazy(() => import('./Pages/services/ServiceCategoryPage'));
const ServiceDetailPage = lazy(() => import('./Pages/services/ServiceDetailPage'));
const SearchResultsPage = lazy(() => import('./Pages/services/SearchResultsPage'));
const Profile = lazy(() => import('./Pages/account/Profile.tsx'));
const BecomeProvider = lazy(() => import('./Pages/marketing/BecomeProvider.tsx'));
const Provider = lazy(() => import('./Pages/provider/Provider.tsx'));
const CreateService = lazy(() => import('./Pages/services/CreateService.tsx'));
const MessagingPage = lazy(() => import('./Pages/messaging/MessagingPage.tsx'));
const ConversationHub = lazy(() => import('./Pages/messaging/ConversationHub.tsx'));
const ConversationView = lazy(() => import('./Pages/messaging/ConversationView.tsx'));
const AdminDashboard = lazy(() => import('./Pages/admin/AdminDashboard.tsx'));
const RateCustomerPage = lazy(() => import('./Pages/booking/RateCustomerPage.tsx'));
const RateServicePage = lazy(() => import('./Pages/booking/RateServicePage.tsx'));
const PaymentHistory = lazy(() => import('./Pages/payments/PaymentHistory.tsx'));
const ProviderEarnings = lazy(() => import('./Pages/provider/ProviderEarnings.tsx'));
const CheckoutPage = lazy(() => import('./Pages/payments/CheckoutPage.tsx'));
const NotificationsPage = lazy(() => import('./Pages/account/NotificationsPage'));
const BookingActivityPage = lazy(() => import('./Pages/account/BookingActivityPage'));
const SavedServicesPage = lazy(() => import('./Pages/account/SavedServicesPage'));
const ForgotPassword = lazy(() => import('./Pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./Pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./Pages/auth/VerifyEmail'));
const NotFound = lazy(() => import('./Pages/marketing/NotFound.tsx'));

function App() {
  return (
    <AuthProvider>
      <LoaderProvider>
        <Router>
          <ScrollToTop />
          {/* One themed toaster for the whole app — see AppToaster. */}
          <AppToaster />
          <Layout>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="h-8 w-8 rounded-full border-2 border-orange-200 border-t-orange-600 animate-spin" />
              </div>
            }>
            <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/services" element={<BrowseServices />} />
            <Route path="/services/search" element={<SearchResultsPage />} />
            <Route path="/services/:categorySlug" element={<ServiceCategoryPage />} />
            <Route path="/service/:serviceId" element={<ServiceDetailPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/become-provider" element={<BecomeProvider />} />
            <Route path="/provider/:id" element={<Provider />} />
            <Route path="/provider/online/:id" element={<OnlineServiceProviderProfile />} />
            <Route path="/provider/printing/:id" element={<PrintingServiceProviderProfile />} />
            <Route path="/create-service" element={<CreateService />} />
            <Route path="/messaging" element={<MessagingPage />} />
            <Route path="/conversation-hub" element={<ConversationHub />} />
            <Route path="/conversation/:conversationId" element={<ConversationView />} />
            <Route path="/rate-customer/:conversationId" element={<RateCustomerPage />} />
            <Route path="/rate-service/:serviceId" element={<RateServicePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-login" element={<AdminLogin/>} />

            {/* Payment Routes */}
            <Route path="/checkout/:serviceId" element={<CheckoutPage />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/provider-earnings" element={<ProviderEarnings />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/bookings" element={<BookingActivityPage />} />
            <Route path="/saved" element={<SavedServicesPage />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="*" element={<NotFound />} />

          </Routes>
          </Suspense>
          


        </Layout>
      </Router>
      </LoaderProvider>
    </AuthProvider>
  )
}

export default App
