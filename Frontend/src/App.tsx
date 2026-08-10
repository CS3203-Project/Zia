import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import { AuthProvider } from './contexts/AuthContext';
import { LoaderProvider } from './components/LoaderContext';
import Layout from './components/Layout';
import HomepageEnhanced from './Pages/HomepageEnhanced';
import Signup from './Pages/Signup.tsx'
import SignIn from './Pages/SignIn.tsx'
import BrowseServicesEnhanced from './Pages/BrowseServicesEnhanced';
import AdminLogin from "./Pages/AdminLogin.tsx";

const Support = lazy(() => import('./Pages/Support.jsx'));
const Articles = lazy(() => import('./Pages/Articles.jsx'));
const SucessStories = lazy(() => import('./Pages/SucessStories.jsx'));
const HowWorks = lazy(() => import('./Pages/HowWorks.jsx'));
const OnlineServiceProviderProfile = lazy(() => import('./Pages/OnlineServiceProviderProfile'));
const PrintingServiceProviderProfile = lazy(() => import('./Pages/PrintingServiceProviderProfile'));
const ServiceCategoryPage = lazy(() => import('./Pages/ServiceCategoryPage'));
const ServiceDetailPage = lazy(() => import('./Pages/ServiceDetailPage'));
const SearchResultsPageEnhanced = lazy(() => import('./Pages/SearchResultsPageEnhanced'));
const Profile = lazy(() => import('./Pages/Profile.tsx'));
const BecomeProvider = lazy(() => import('./Pages/BecomeProvider.tsx'));
const Provider = lazy(() => import('./Pages/Provider.tsx'));
const CreateService = lazy(() => import('./Pages/CreateService.tsx'));
const MessagingPage = lazy(() => import('./Pages/NewMessagingPage.tsx'));
const ConversationHub = lazy(() => import('./Pages/ConversationHub.tsx'));
const ConversationView = lazy(() => import('./Pages/ConversationView.tsx'));
const AdminDashboard = lazy(() => import('./Pages/AdminDashboard.tsx'));
const RateCustomerPage = lazy(() => import('./Pages/RateCustomerPage.tsx'));
const RateServicePage = lazy(() => import('./Pages/RateServicePage.tsx'));
const Pricing = lazy(() => import('./Pages/Pricing.tsx'));
const EasySetup = lazy(() => import('./Pages/EasySetup.tsx'));
const SecurePayments = lazy(() => import('./Pages/SecurePayments.tsx'));
const CustomerManagement = lazy(() => import('./Pages/CustomerManagement.tsx'));
const AnalyticsDashboard = lazy(() => import('./Pages/AnalyticsDashboard.tsx'));
const PaymentHistory = lazy(() => import('./Pages/PaymentHistory.tsx'));
const ProviderEarnings = lazy(() => import('./Pages/ProviderEarnings.tsx'));
const CheckoutPage = lazy(() => import('./Pages/CheckoutPage.tsx'));
const NotificationsPage = lazy(() => import('./Pages/NotificationsPage'));
const ServiceRequestPage = lazy(() => import('./Pages/ServiceRequestPage'));
const ServiceRequestMatchesPage = lazy(() => import('./Pages/ServiceRequestMatchesPage'));

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
            <Route path="/support" element={<Support />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/stories" element={<SucessStories />} />
            <Route path="/howWorks" element={<HowWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/easy-setup" element={<EasySetup />} />
            <Route path="/secure-payments" element={<SecurePayments />} />
            <Route path="/customer-management" element={<CustomerManagement />} />
            <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
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
