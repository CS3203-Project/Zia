/**
 * OPTIMIZED APP.TSX IMPLEMENTATION
 * 
 * This is an example of how to implement code splitting in the App
 * Replace your current App.tsx with this version to enable lazy loading
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense as SuspenseComponent } from "react";
import './App.css'
import { AuthProvider } from './contexts/AuthContext';
import { LoaderProvider } from './components/LoaderContext';
import Layout from './components/Layout';

// Loading Spinner Component
const RouteLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:via-gray-950 dark:to-black">
    <div className="text-center">
      <div className="flex gap-1 justify-center mb-4">
        <div className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
      <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">Loading...</p>
    </div>
  </div>
);

// Essential Routes - Load immediately (not lazy)
import HomepageEnhanced from './Pages/HomepageEnhanced';
import Signup from './Pages/Signup.tsx'
import SignIn from './Pages/SignIn.tsx'
import BrowseServicesEnhanced from './Pages/BrowseServicesEnhanced';
import AdminLogin from "./Pages/AdminLogin.tsx";

// Lazy Loaded Routes - Load on demand
const Support = lazy(() => import('./Pages/Support.jsx'))
const Articles = lazy(() => import('./Pages/Articles.jsx'))
const SucessStories = lazy(() => import('./Pages/SucessStories.jsx'))
const HowWorks = lazy(() => import('./Pages/HowWorks.jsx'))

const OnlineServiceProviderProfile = lazy(() => import('./Pages/OnlineServiceProviderProfile'));
const PrintingServiceProviderProfile = lazy(() => import("./Pages/PrintingServiceProviderProfile"));

const ServiceCategoryPage = lazy(() => import('./Pages/ServiceCategoryPage'));
const ServiceDetailPage = lazy(() => import('./Pages/ServiceDetailPage'));
const SearchResultsPageEnhanced = lazy(() => import('./Pages/SearchResultsPageEnhanced'));
const Profile = lazy(() => import("./Pages/Profile.tsx"));
const BecomeProvider = lazy(() => import("./Pages/BecomeProvider.tsx"));
const Provider = lazy(() => import("./Pages/Provider.tsx"));
const CreateService = lazy(() => import("./Pages/CreateService.tsx"));
const MessagingPage = lazy(() => import("./Pages/NewMessagingPage.tsx"));
const ConversationHub = lazy(() => import("./Pages/ConversationHub.tsx"));
const ConversationView = lazy(() => import("./Pages/ConversationView.tsx"));
const AdminDashboard = lazy(() => import("./Pages/AdminDashboard.tsx"));
const RateCustomerPage = lazy(() => import("./Pages/RateCustomerPage.tsx"));
const RateServicePage = lazy(() => import("./Pages/RateServicePage.tsx"));
const Pricing = lazy(() => import("./Pages/Pricing.tsx"));
const EasySetup = lazy(() => import("./Pages/EasySetup.tsx"));
const SecurePayments = lazy(() => import("./Pages/SecurePayments.tsx"));
const CustomerManagement = lazy(() => import("./Pages/CustomerManagement.tsx"));
const AnalyticsDashboard = lazy(() => import("./Pages/AnalyticsDashboard.tsx"));
const PaymentHistory = lazy(() => import("./Pages/PaymentHistory.tsx"));
const ProviderEarnings = lazy(() => import("./Pages/ProviderEarnings.tsx"));
const CheckoutPage = lazy(() => import("./Pages/CheckoutPage.tsx"));
const NotificationsPage = lazy(() => import("./Pages/NotificationsPage"));
const ServiceRequestPage = lazy(() => import("./Pages/ServiceRequestPage"));
const ServiceRequestMatchesPage = lazy(() => import("./Pages/ServiceRequestMatchesPage"));

function App() {
  return (
    <AuthProvider>
      <LoaderProvider>
        <Router>
          <Layout>
            <SuspenseComponent fallback={<RouteLoadingSpinner />}>
              <Routes>
                {/* Essential Routes - Not Lazy */}
                <Route path="/" element={<HomepageEnhanced />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/services" element={<BrowseServicesEnhanced />} />
                <Route path="/admin-login" element={<AdminLogin/>} />

                {/* Lazy Loaded Routes */}
                <Route path="/support" element={<Support />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/stories" element={<SucessStories />} />
                <Route path="/howWorks" element={<HowWorks />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/easy-setup" element={<EasySetup />} />
                <Route path="/secure-payments" element={<SecurePayments />} />
                <Route path="/customer-management" element={<CustomerManagement />} />
                <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
                
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

                {/* Payment Routes */}
                <Route path="/checkout/:serviceId" element={<CheckoutPage />} />
                <Route path="/payment-history" element={<PaymentHistory />} />
                <Route path="/provider-earnings" element={<ProviderEarnings />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Service Request Routes */}
                <Route path="/service-request" element={<ServiceRequestPage />} />
                <Route path="/service-request/:id/matches" element={<ServiceRequestMatchesPage />} />
              </Routes>
            </SuspenseComponent>
            


          </Layout>
        </Router>
      </LoaderProvider>
    </AuthProvider>
  )
}

export default App
