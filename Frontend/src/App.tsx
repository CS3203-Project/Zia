import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import { AuthProvider } from './contexts/AuthContext';
import { LoaderProvider } from './components/shared/LoaderContext';
import Layout from './components/layout/Layout';
import HomepageEnhanced from './Pages/marketing/HomepageEnhanced';
import Signup from './Pages/auth/Signup.tsx'
import SignIn from './Pages/auth/SignIn.tsx'
import BrowseServicesEnhanced from './Pages/services/BrowseServicesEnhanced';
import AdminLogin from "./Pages/auth/AdminLogin.tsx";

const Articles = lazy(() => import('./Pages/marketing/Articles.tsx'));
const OnlineServiceProviderProfile = lazy(() => import('./Pages/provider/OnlineServiceProviderProfile'));
const PrintingServiceProviderProfile = lazy(() => import('./Pages/provider/PrintingServiceProviderProfile'));
const ServiceCategoryPage = lazy(() => import('./Pages/services/ServiceCategoryPage'));
const ServiceDetailPage = lazy(() => import('./Pages/services/ServiceDetailPage'));
const SearchResultsPageEnhanced = lazy(() => import('./Pages/services/SearchResultsPageEnhanced'));
const Profile = lazy(() => import('./Pages/account/Profile.tsx'));
const BecomeProvider = lazy(() => import('./Pages/marketing/BecomeProvider.tsx'));
const Provider = lazy(() => import('./Pages/provider/Provider.tsx'));
const CreateService = lazy(() => import('./Pages/services/CreateService.tsx'));
const MessagingPage = lazy(() => import('./Pages/messaging/NewMessagingPage.tsx'));
const ConversationHub = lazy(() => import('./Pages/messaging/ConversationHub.tsx'));
const ConversationView = lazy(() => import('./Pages/messaging/ConversationView.tsx'));
const AdminDashboard = lazy(() => import('./Pages/admin/AdminDashboard.tsx'));
const RateCustomerPage = lazy(() => import('./Pages/booking/RateCustomerPage.tsx'));
const RateServicePage = lazy(() => import('./Pages/booking/RateServicePage.tsx'));
const PaymentHistory = lazy(() => import('./Pages/payments/PaymentHistory.tsx'));
const ProviderEarnings = lazy(() => import('./Pages/provider/ProviderEarnings.tsx'));
const CheckoutPage = lazy(() => import('./Pages/payments/CheckoutPage.tsx'));
const NotificationsPage = lazy(() => import('./Pages/account/NotificationsPage'));
const ServiceRequestPage = lazy(() => import('./Pages/booking/ServiceRequestPage'));
const ServiceRequestMatchesPage = lazy(() => import('./Pages/booking/ServiceRequestMatchesPage'));

function App() {
  return (
    <AuthProvider>
      <LoaderProvider>
        <Router>
          <Layout>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/80">Loading...</div>}>
            <Routes>
            <Route path="/" element={<HomepageEnhanced />} />
            {/* <Route path="/homepage-original" element={<Homepage />} /> */}
            <Route path="/articles" element={<Articles />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/services" element={<BrowseServicesEnhanced />} />
            {/* <Route path="/services-original" element={<BrowseServices />} /> */}
            {/* <Route path="/services/search" element={<SearchResultsPage />} /> */}
            <Route path="/search-results-enhanced" element={<SearchResultsPageEnhanced />} />
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

            <Route path="/service-request" element={<ServiceRequestPage />} />
            <Route path="/service-request/:id/matches" element={<ServiceRequestMatchesPage />} />
                    
          </Routes>
          </Suspense>
          


        </Layout>
      </Router>
      </LoaderProvider>
    </AuthProvider>
  )
}

export default App
