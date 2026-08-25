import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  ShoppingBag,
  TrendingUp,
  CheckCircle,
  Settings,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ExternalLink,
  LogOut,
  FolderTree,
  SlidersHorizontal,
  Banknote,
  Undo2
} from 'lucide-react';
import Button from '../../components/shared/Button';
import AnalyticsDashboard from '../../components/shared/AnalyticsDashboard';
import ReportGenerator from '../../components/shared/ReportGenerator';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import StatCard from '../../components/admin/StatCard';
import ProviderCard from '../../components/admin/ProviderCard';
import ProviderDetailsModal from '../../components/admin/ProviderDetailsModal';
import AdminProfileSection from '../../components/admin/AdminProfileSection';
import CategoryManagementSection from '../../components/admin/CategoryManagementSection';
import PlatformSettingsSection from '../../components/admin/PlatformSettingsSection';
import PayoutRequestsSection from '../../components/admin/PayoutRequestsSection';
import RefundRequestsSection from '../../components/admin/RefundRequestsSection';
import { adminApi, type ServiceProvider, type AdminProfile } from '../../api/adminApi';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';

// Main Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportGeneratorOpen, setIsReportGeneratorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'payouts' | 'refunds' | 'categories' | 'settings' | 'profile'>('overview');
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [providerToApprove, setProviderToApprove] = useState<ServiceProvider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [customerCount, setCustomerCount] = useState<number>(0);

  useEffect(() => {
    // Initialize admin profile from localStorage
    const currentAdmin = adminApi.getCurrentAdmin();
    if (currentAdmin) {
      setAdminProfile({
        ...currentAdmin,
        role: 'ADMIN',
        permissions: ['manage_users', 'manage_providers'],
        lastLogin: new Date().toISOString(),
      });
    }

    fetchDashboardData();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFilterDropdown && !target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch service providers data (main priority)
      try {
        const serviceProvidersResponse = await adminApi.getAllServiceProviders();
        if (serviceProvidersResponse.success) {
          setServiceProviders(serviceProvidersResponse.data);
          console.log('Service providers loaded:', serviceProvidersResponse.data.length);
        } else {
          console.error('Failed to fetch service providers:', serviceProvidersResponse.message);
          showErrorToast('Failed to load service providers');
        }
      } catch (error) {
        console.error('Error fetching service providers:', error);
        showErrorToast('Failed to load service providers');
      }

      // Fetch customer count
      try {
        const customerCountResponse = await adminApi.getCustomerCount();
        if (customerCountResponse.success) {
          setCustomerCount(customerCountResponse.data.count);
          console.log('Customer count loaded:', customerCountResponse.data.count);
        } else {
          console.error('Failed to fetch customer count:', customerCountResponse.message);
        }
      } catch (error) {
        console.error('Error fetching customer count:', error);
        // Don't show error toast for customer count since it's not critical
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      showErrorToast('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProvider = (providerId: string) => {
    // Find the provider to approve
    const provider = serviceProviders.find(p => p.id === providerId);
    if (provider) {
      setProviderToApprove(provider);
      setIsConfirmationModalOpen(true);
    }
  };

  const confirmApproveProvider = async () => {
    if (!providerToApprove) return;

    try {
      const response = await adminApi.approveProvider(providerToApprove.id);
      if (response.success) {
        showSuccessToast('Provider approved successfully');
        // Update the provider in the list with the new verification status
        setServiceProviders(prev =>
          prev.map(p => p.id === providerToApprove.id ? response.data : p)
        );
        // Update selected provider if it's the one being approved
        setSelectedProvider(prev =>
          prev && prev.id === providerToApprove.id ? response.data : prev
        );
      }
    } catch (error) {
      console.error('Failed to approve provider:', error);
      showErrorToast(error instanceof Error ? error.message : 'Failed to approve provider');
    } finally {
      // Close the modal and reset state
      setIsConfirmationModalOpen(false);
      setProviderToApprove(null);
    }
  };

  const cancelApproveProvider = () => {
    setIsConfirmationModalOpen(false);
    setProviderToApprove(null);
  };

  // Filter and search providers
  const filteredProviders = useMemo(() => {
    let filtered = serviceProviders || [];

    // Apply status filter
    if (filterStatus === 'verified') {
      filtered = filtered.filter(provider => provider.isVerified);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(provider => !provider.isVerified);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(provider =>
        provider.user.firstName.toLowerCase().includes(search) ||
        provider.user.lastName.toLowerCase().includes(search) ||
        provider.user.email.toLowerCase().includes(search) ||
        provider.bio?.toLowerCase().includes(search) ||
        provider.skills.some(skill => skill.toLowerCase().includes(search)) ||
        provider.qualifications.some(qual => qual.toLowerCase().includes(search))
      );
    }

    return filtered;
  }, [serviceProviders, filterStatus, searchTerm]);

  const handleUpdateAdminProfile = async (profileData: Partial<AdminProfile>) => {
    try {
      // Filter out empty password field if it exists
      const updateData = { ...profileData };
      if (updateData.password === '') {
        delete updateData.password;
      }

      const response = await adminApi.updateAdminProfile(updateData);

      if (response.success) {
        const updatedProfile = response.data;
        setAdminProfile(updatedProfile);

        // Update localStorage with new admin data
        localStorage.setItem('adminUser', JSON.stringify({
          id: updatedProfile.id,
          username: updatedProfile.username,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
        }));

        showSuccessToast('Profile updated successfully');
      } else {
        showErrorToast(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      showErrorToast(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi.logout();
      showSuccessToast('Logged out successfully');

      // Redirect to admin login page
      window.location.href = '/admin-login';
    } catch (error) {
      console.error('Logout error:', error);
      showErrorToast('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Welcome back, {adminProfile?.firstName || 'Admin'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center ring-4 ring-orange-50 flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {adminProfile?.firstName?.[0] || 'A'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-3 -mx-1 px-1" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'providers', label: `Service Providers (${serviceProviders?.length || 0})`, icon: UserCheck },
              { id: 'payouts', label: 'Payouts', icon: Banknote },
              { id: 'refunds', label: 'Refunds', icon: Undo2 },
              { id: 'categories', label: 'Categories', icon: FolderTree },
              { id: 'settings', label: 'Platform Settings', icon: SlidersHorizontal },
              { id: 'profile', label: 'Admin Profile', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                } whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm flex items-center transition-colors`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Service Provider Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Customers"
                value={customerCount}
                icon={<Users className="w-6 h-6 text-blue-600" />}
                color="bg-blue-100"
              />
              <StatCard
                title="Total Providers"
                value={serviceProviders?.length || 0}
                icon={<UserCheck className="w-6 h-6 text-indigo-600" />}
                color="bg-indigo-100"
              />
              <StatCard
                title="Verified Providers"
                value={serviceProviders?.filter(p => p.isVerified).length || 0}
                icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
                color="bg-emerald-100"
              />
              <StatCard
                title="Pending Approvals"
                value={serviceProviders?.filter(p => !p.isVerified).length || 0}
                icon={<Clock className="w-6 h-6 text-amber-600" />}
                color="bg-amber-100"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setActiveTab('providers')}
                  className="justify-start"
                  variant="outline"
                >
                  <UserCheck className="w-5 h-5 mr-3" />
                  Review Provider Applications
                  {(serviceProviders?.filter(p => !p.isVerified).length || 0) > 0 && (
                    <span className="ml-auto bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs">
                      {serviceProviders?.filter(p => !p.isVerified).length || 0}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-amber-600" />
                Analytics Dashboard
              </h2>
              <AnalyticsDashboard />
            </div>

            {/* Report Generator */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
                Report Generator
              </h2>
              <div className="space-y-4">
                <p className="text-gray-500">
                  Generate comprehensive reports for customers, providers, and services. Download as PDF.
                </p>
                <button
                  onClick={() => setIsReportGeneratorOpen(true)}
                  className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-all group"
                >
                  <ShoppingBag className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-lg font-medium text-blue-700">Generate Reports</span>
                  <ExternalLink className="w-4 h-4 text-blue-500 ml-2" />
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {(serviceProviders || []).slice(0, 3).map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <img
                        src={provider.user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.user.firstName + ' ' + provider.user.lastName)}&size=40&background=e5e7eb&color=374151`}
                        alt={`${provider.user.firstName} ${provider.user.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {provider.user.firstName} {provider.user.lastName} applied to become a provider
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(provider.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      provider.isVerified
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {provider.isVerified ? 'Verified' : 'Pending Review'}
                    </span>
                  </div>
                ))}
                {(serviceProviders?.length || 0) === 0 && (
                  <p className="text-gray-400 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Service Providers Tab */}
        {activeTab === 'providers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Service Providers</h2>
                <p className="text-gray-500">Manage and review all service providers</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search providers..."
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="relative filter-dropdown-container">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {filterStatus !== 'all' && (
                      <span className="ml-2 bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full text-xs">
                        {filterStatus === 'verified' ? 'Verified' : 'Pending'}
                      </span>
                    )}
                  </Button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setFilterStatus('all');
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            filterStatus === 'all' ? 'bg-orange-50 text-orange-700' : 'text-gray-600'
                          }`}
                        >
                          All Providers
                        </button>
                        <button
                          onClick={() => {
                            setFilterStatus('verified');
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            filterStatus === 'verified' ? 'bg-orange-50 text-orange-700' : 'text-gray-600'
                          }`}
                        >
                          Verified Only
                        </button>
                        <button
                          onClick={() => {
                            setFilterStatus('pending');
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            filterStatus === 'pending' ? 'bg-orange-50 text-orange-700' : 'text-gray-600'
                          }`}
                        >
                          Pending Only
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(filteredProviders?.length || 0) === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'No Matching Providers' : 'No Service Providers'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterStatus !== 'all'
                    ? 'No providers match your current search or filter criteria.'
                    : 'No service providers found in the system.'
                  }
                </p>
                {(searchTerm || filterStatus !== 'all') && (
                  <div className="mt-4 space-x-2">
                    {searchTerm && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                      >
                        Clear Search
                      </Button>
                    )}
                    {filterStatus !== 'all' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  Showing {filteredProviders.length} of {serviceProviders?.length || 0} providers
                  {(searchTerm || filterStatus !== 'all') && (
                    <span className="ml-2">
                      {searchTerm && `• Search: "${searchTerm}"`}
                      {filterStatus !== 'all' && `• Filter: ${filterStatus === 'verified' ? 'Verified' : 'Pending'}`}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredProviders.map((provider: ServiceProvider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onApprove={handleApproveProvider}
                      onViewDetails={(provider) => {
                        setSelectedProvider(provider);
                        setIsModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
              <p className="text-gray-500">Manage service categories and subcategories</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <CategoryManagementSection />
            </div>
          </div>
        )}

        {/* Admin Profile Tab */}
        {activeTab === 'payouts' && <PayoutRequestsSection />}

        {activeTab === 'refunds' && <RefundRequestsSection />}

        {activeTab === 'settings' && <PlatformSettingsSection />}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Profile</h2>
              <p className="text-gray-500">Manage your admin account settings</p>
            </div>
            <AdminProfileSection
              profile={adminProfile}
              onUpdateProfile={handleUpdateAdminProfile}
              onLogout={handleLogout}
            />
          </div>
        )}
      </div>

      {/* Modals Section */}
      <div>

      {/* Provider Details Modal */}
      <ProviderDetailsModal
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProvider(null);
        }}
        onApprove={handleApproveProvider}
      />

      {/* Report Generator Modal */}
      <ReportGenerator
        isOpen={isReportGeneratorOpen}
        onClose={() => setIsReportGeneratorOpen(false)}
      />

      {/* Confirmation Modal for Approve Action */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={cancelApproveProvider}
        onConfirm={confirmApproveProvider}
        title="Approve Provider Application"
        message={`Are you sure you want to approve ${providerToApprove?.user.firstName} ${providerToApprove?.user.lastName}'s application? This will grant them access as a verified service provider.`}
        confirmButtonText="Yes, Approve"
        confirmButtonColor="bg-green-600 hover:bg-green-700"
      />

      </div>
    </div>
  );
};

export default AdminDashboard;
