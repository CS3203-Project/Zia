import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle, Minimize2, Lightbulb } from 'lucide-react';
import confirmationApi from '../../api/confirmationApi';
import type { ConversationConfirmation } from '../../types/confirmation';
import { useConfirmationSocket } from '../../hooks/useConfirmationSocket';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  conversationId: string;
  currentUserRole: 'USER' | 'PROVIDER';
  onReviewClick?: () => void;
  onViewUserDetails?: () => void;
}

const ConfirmationPanel: React.FC<Props> = ({ conversationId, currentUserRole, onReviewClick, onViewUserDetails }) => {
  const { user } = useAuth();
  
  // Utility functions - defined at the top to avoid reference errors
  const toLocalInput = (iso: string | null) => {
    if (!iso) return '';
    const date = new Date(iso);
    // Get local timezone offset and adjust the date for datetime-local input
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };
  
  const fromLocalInput = (v: string) => {
    if (!v) return null;
    // Create date from local input and convert to UTC
    const date = new Date(v);
    return date.toISOString();
  };
  
  const [record, setRecord] = useState<ConversationConfirmation | null>(null);
  const [saving, setSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [serviceFeeInput, setServiceFeeInput] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');
  const [hasStartTimeUnsavedChanges, setHasStartTimeUnsavedChanges] = useState(false);
  const [hasEndTimeUnsavedChanges, setHasEndTimeUnsavedChanges] = useState(false);
  const [isStartTimeEditing, setIsStartTimeEditing] = useState(false);
  const [isEndTimeEditing, setIsEndTimeEditing] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const isCustomer = currentUserRole === 'USER';
  const isProvider = currentUserRole === 'PROVIDER';

  // Clear state when conversation changes
  useEffect(() => {
    if (conversationId !== currentConversationId) {
      setRecord(null);
      setServiceFeeInput('');
      setStartDateInput('');
      setEndDateInput('');
      setHasUnsavedChanges(false);
      setHasStartTimeUnsavedChanges(false);
      setHasEndTimeUnsavedChanges(false);
      setIsStartTimeEditing(false);
      setIsEndTimeEditing(false);
      setSaving(false);
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, currentConversationId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log('Loading confirmation record for conversation:', conversationId);
        const rec = await confirmationApi.ensure(conversationId);
        console.log('Loaded confirmation record:', rec);
        if (mounted && conversationId === currentConversationId) {
          setRecord(rec);
          setServiceFeeInput(rec.serviceFee?.toString() || '');
          const startLocal = toLocalInput(rec.startDate);
          const endLocal = toLocalInput(rec.endDate);
          console.log('Setting inputs - startDate:', rec.startDate, 'converted to:', startLocal);
          console.log('Setting inputs - endDate:', rec.endDate, 'converted to:', endLocal);
          setStartDateInput(startLocal);
          setEndDateInput(endLocal);
          setHasStartTimeUnsavedChanges(false);
          setHasEndTimeUnsavedChanges(false);
          setIsStartTimeEditing(false);
          setIsEndTimeEditing(false);
        }
      } catch (e) {
        console.error('Failed to load confirmation record:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [conversationId, currentConversationId]);

  // Function to save service fee (called on Enter or blur)
  const saveServiceFee = async () => {
    if (!record || !isProvider) return;
    
    setSaving(true);
    setHasUnsavedChanges(false);
    
    try {
      const patch: Partial<ConversationConfirmation> = {};
      
      if (serviceFeeInput === '') {
        patch.serviceFee = null;
      } else {
        const numValue = parseFloat(serviceFeeInput);
        if (!isNaN(numValue) && numValue >= 0) {
          patch.serviceFee = numValue;
        } else {
          // Invalid input, revert to current value
          setServiceFeeInput(record.serviceFee?.toString() || '');
          setSaving(false);
          return;
        }
      }
      
      const updated = await confirmationApi.upsert(conversationId, patch);
      setRecord(updated);
      setServiceFeeInput(updated.serviceFee?.toString() || '');
    } catch (e) {
      console.error('Failed to update service fee', e);
      // Revert to previous value on error
      setServiceFeeInput(record.serviceFee?.toString() || '');
    } finally {
      setSaving(false);
    }
  };

  // Function to save start time (called on button click or Enter key)
  const saveStartTime = async () => {
    if (!record) return;

    setSaving(true);
    setHasStartTimeUnsavedChanges(false);
    setIsStartTimeEditing(false);

    try {
      const patch: Partial<ConversationConfirmation> = {
        startDate: fromLocalInput(startDateInput),
      };

      console.log('Saving start time:', patch);
      const updated = await confirmationApi.upsert(conversationId, patch);
      console.log('Start time saved successfully:', updated);
      setRecord(updated);
      setStartDateInput(toLocalInput(updated.startDate));
    } catch (e) {
      console.error('Failed to update start time', e);
      alert('Failed to save start time. Please try again.');
      // Revert unsaved changes on error
      setHasStartTimeUnsavedChanges(true);
      setIsStartTimeEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Function to save end time (called on button click or Enter key)
  const saveEndTime = async () => {
    if (!record) return;

    setSaving(true);
    setHasEndTimeUnsavedChanges(false);
    setIsEndTimeEditing(false);

    try {
      const patch: Partial<ConversationConfirmation> = {
        endDate: fromLocalInput(endDateInput),
      };

      console.log('Saving end time:', patch);
      const updated = await confirmationApi.upsert(conversationId, patch);
      console.log('End time saved successfully:', updated);
      setRecord(updated);
      setEndDateInput(toLocalInput(updated.endDate));
    } catch (e) {
      console.error('Failed to update end time', e);
      alert('Failed to save end time. Please try again.');
      // Revert unsaved changes on error
      setHasEndTimeUnsavedChanges(true);
      setIsEndTimeEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const update = async (patch: Partial<ConversationConfirmation>) => {
    if (!record) return;
    setSaving(true);
    try {
      const updated = await confirmationApi.upsert(conversationId, patch);
      setRecord(updated);
    } catch (e) {
      console.error('Failed to update confirmation', e);
    } finally {
      setSaving(false);
    }
  };

  useConfirmationSocket(conversationId, (confirmation) => {
    // Only update if it's for the current conversation AND not actively editing
    if (confirmation.conversationId === conversationId) {
      setRecord(confirmation);
      
      // Only update local inputs if user is not actively editing them
      if (!hasUnsavedChanges) {
        setServiceFeeInput(confirmation.serviceFee?.toString() || '');
      }
      if (!isStartTimeEditing && !hasStartTimeUnsavedChanges) {
        setStartDateInput(toLocalInput(confirmation.startDate));
      }
      if (!isEndTimeEditing && !hasEndTimeUnsavedChanges) {
        setEndDateInput(toLocalInput(confirmation.endDate));
      }
    }
  }, user?.id || '');

  if (!record) return null;

  // Calculate confirmation status
  const bothConfirmed = record.customerConfirmation && record.providerConfirmation;
  const partialConfirmed = record.customerConfirmation || record.providerConfirmation;
  const hasDateTime = record.startDate && record.endDate;
  const hasServiceFee = record.serviceFee !== null && record.serviceFee !== undefined && record.serviceFee > 0;
  const isComplete = bothConfirmed && hasDateTime && (isProvider ? hasServiceFee : true); // Provider must set fee for completion

  // Status indicator
  const getStatusIcon = () => {
    if (isComplete) return <CheckCircle className="h-5 w-5 text-emerald-600" />;
    if (partialConfirmed) return <Clock className="h-5 w-5 text-orange-500" />;
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isComplete) return 'Booking Confirmed';
    if (isProvider && !hasServiceFee && (partialConfirmed || hasDateTime)) return 'Set Service Fee';
    if (partialConfirmed) return 'Pending Confirmation';
    return 'Awaiting Confirmation';
  };

  const getStatusColor = () => {
    if (isComplete) return 'bg-emerald-50 border-emerald-200';
    if (partialConfirmed) return 'bg-orange-50 border-orange-200';
    return 'bg-gray-50 border-gray-200';
  };

  // Minimized floating view
  if (isMinimized) {
    return (
      <div className="fixed top-20 right-4 z-50 bg-white shadow-2xl rounded-xl border border-gray-200 p-4 max-w-xs relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 block">{getStatusText()}</span>
              {hasServiceFee && (
                <span className="text-xs text-gray-500">
                  {record.currency} {record.serviceFee?.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-gray-500 hover:text-gray-900 ml-2 p-1 rounded-lg hover:bg-gray-100 transition-all duration-300"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        {!isComplete && (
          <div className="text-xs text-gray-500 mt-2 relative z-10">
            {isProvider && !hasServiceFee ? 'Set service fee to continue' : 'Click to expand and confirm booking'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white transition-all duration-300 relative overflow-hidden">
      {/* Header with status and controls */}
      <div className={`px-4 py-4 border-b relative z-10 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{getStatusText()}</h3>
            {saving && (
              <div className="flex items-center space-x-1 text-gray-500">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                <span className="text-xs">Saving...</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-gray-900 p-1 rounded-lg hover:bg-black/5 transition-all duration-300"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-500 hover:text-gray-900 p-1 rounded-lg hover:bg-black/5 transition-all duration-300"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center space-x-4 mt-3 flex-wrap">
          <div className={`flex items-center space-x-1 text-xs ${record.customerConfirmation ? 'text-gray-900' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${record.customerConfirmation ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            <span>Customer</span>
          </div>
          <div className={`flex items-center space-x-1 text-xs ${record.providerConfirmation ? 'text-gray-900' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${record.providerConfirmation ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            <span>Provider</span>
          </div>
          <div className={`flex items-center space-x-1 text-xs ${hasDateTime ? 'text-gray-900' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${hasDateTime ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            <span>Schedule</span>
          </div>
          <div className={`flex items-center space-x-1 text-xs ${hasServiceFee ? 'text-gray-900' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${hasServiceFee ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            <span>Service Fee</span>
          </div>
        </div>
      </div>

      {/* Collapsible content - Takes remaining height */}
      <div className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0' : ''} relative z-10`}>
        <div className="h-full overflow-y-auto px-4 pb-4 pt-4">
          <div className="space-y-6">
            {/* Confirmation Status Group */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">
                Confirmation Status
              </h4>

              <label className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-orange-200 transition-all duration-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!record.customerConfirmation}
                  disabled={!isCustomer || saving}
                  onChange={(e) => update({ customerConfirmation: e.target.checked })}
                  className="rounded accent-orange-500 focus:ring-orange-400 bg-white border-gray-300"
                />
                <span className="font-medium text-gray-900">Customer Confirmation</span>
                {isCustomer && (
                  <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded border border-orange-200">You</span>
                )}
              </label>

              <label className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-orange-200 transition-all duration-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!record.providerConfirmation}
                  disabled={!isProvider || saving}
                  onChange={(e) => update({ providerConfirmation: e.target.checked })}
                  className="rounded accent-orange-500 focus:ring-orange-400 bg-white border-gray-300"
                />
                <span className="font-medium text-gray-900">Provider Confirmation</span>
                {isProvider && (
                  <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded border border-orange-200">You</span>
                )}
              </label>
            </div>

            {/* Service Fee Group */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">
                Service Fee
              </h4>

              <div className={`bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-orange-200 transition-all duration-300 relative overflow-hidden ${!isProvider ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                    {isProvider && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {!isProvider && (
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded border border-gray-300">Provider Only</span>
                  )}
                </div>
                <div className="flex space-x-2 relative z-10">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={`w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white text-gray-900 placeholder-gray-400 ${
                        !isProvider ? 'cursor-not-allowed opacity-50' : ''
                      } ${hasUnsavedChanges ? 'border-orange-400 bg-orange-50' : ''}`}
                      value={serviceFeeInput}
                      disabled={!isProvider || saving}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        setServiceFeeInput(inputValue);
                        setHasUnsavedChanges(inputValue !== (record?.serviceFee?.toString() || ''));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveServiceFee();
                        }
                      }}
                      onBlur={() => {
                        if (hasUnsavedChanges) {
                          saveServiceFee();
                        }
                      }}
                    />
                    {hasUnsavedChanges && !saving && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="flex items-center space-x-1 text-xs text-orange-600">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <span>Press Enter</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <select
                    className={`border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white text-gray-900 ${
                      !isProvider ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    value={record.currency || 'USD'}
                    disabled={!isProvider || saving}
                    onChange={(e) => update({ currency: e.target.value })}
                  >
                    <option value="USD" className="bg-white text-gray-900">USD</option>
                    <option value="EUR" className="bg-white text-gray-900">EUR</option>
                    <option value="GBP" className="bg-white text-gray-900">GBP</option>
                    <option value="LKR" className="bg-white text-gray-900">LKR</option>
                    <option value="INR" className="bg-white text-gray-900">INR</option>
                  </select>
                </div>
                {hasUnsavedChanges && isProvider && (
                  <button
                    onClick={saveServiceFee}
                    disabled={saving}
                    className="mt-3 w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-300 border border-orange-200 hover:border-orange-300"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Save Amount</span>
                      </>
                    )}
                  </button>
                )}
                {isProvider && (
                  <div className="mt-2 text-xs text-gray-500 relative z-10 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                    Tip: Press <kbd className="px-1 py-0.5 bg-gray-200 border border-gray-300 rounded text-gray-600">Enter</kbd> or click outside to save your changes
                  </div>
                )}
                {isProvider && !hasServiceFee && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center space-x-1 relative z-10">
                    <AlertCircle className="h-3 w-3" />
                    <span>Please set the service fee to complete the booking</span>
                  </p>
                )}
                {!isProvider && hasServiceFee && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 relative z-10">
                    <p className="text-sm text-emerald-600 font-medium text-center">
                      {record.currency} {record.serviceFee?.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Group */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">
                Schedule
              </h4>

              <div className={`bg-gray-50 p-4 rounded-xl border hover:border-orange-200 transition-all duration-300 relative overflow-hidden ${hasStartTimeUnsavedChanges ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                <label className="block text-sm font-medium text-gray-700 mb-2 relative z-10">Start Date & Time</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    className={`w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white text-gray-900 relative z-10 ${
                      hasStartTimeUnsavedChanges ? 'border-orange-400 bg-orange-50' : ''
                    }`}
                    value={startDateInput}
                    disabled={saving}
                    onFocus={() => setIsStartTimeEditing(true)}
                    onBlur={() => setIsStartTimeEditing(false)}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setStartDateInput(newValue);
                      setHasStartTimeUnsavedChanges(newValue !== toLocalInput(record.startDate));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveStartTime();
                      }
                    }}
                  />
                  {hasStartTimeUnsavedChanges && !saving && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="flex items-center space-x-1 text-xs text-orange-600">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span>Unsaved</span>
                      </div>
                    </div>
                  )}
                </div>
                {hasStartTimeUnsavedChanges && (
                  <button
                    onClick={saveStartTime}
                    disabled={saving}
                    className="mt-3 w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-300 border border-orange-200 hover:border-orange-300"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                        <span>Saving Start Time...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Save Start Time</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className={`bg-gray-50 p-4 rounded-xl border hover:border-orange-200 transition-all duration-300 relative overflow-hidden ${hasEndTimeUnsavedChanges ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                <label className="block text-sm font-medium text-gray-700 mb-2 relative z-10">End Date & Time</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    className={`w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white text-gray-900 relative z-10 ${
                      hasEndTimeUnsavedChanges ? 'border-orange-400 bg-orange-50' : ''
                    }`}
                    value={endDateInput}
                    disabled={saving}
                    onFocus={() => setIsEndTimeEditing(true)}
                    onBlur={() => setIsEndTimeEditing(false)}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEndDateInput(newValue);
                      setHasEndTimeUnsavedChanges(newValue !== toLocalInput(record.endDate));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveEndTime();
                      }
                    }}
                  />
                  {hasEndTimeUnsavedChanges && !saving && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="flex items-center space-x-1 text-xs text-orange-600">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span>Unsaved</span>
                      </div>
                    </div>
                  )}
                </div>
                {hasEndTimeUnsavedChanges && (
                  <button
                    onClick={saveEndTime}
                    disabled={saving}
                    className="mt-3 w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-300 border border-orange-200 hover:border-orange-300"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                        <span>Saving End Time...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Save End Time</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500 mt-2 relative z-10 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                Tip: Press <kbd className="px-1 py-0.5 bg-gray-200 border border-gray-300 rounded text-gray-600">Enter</kbd> or click the save buttons to confirm your changes
              </div>
            </div>
          </div>

          {/* Summary when complete */}
          {isComplete && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl relative overflow-hidden">
              <div className="flex items-center space-x-2 mb-3 relative z-10">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
                <span className="font-semibold text-emerald-700 text-lg">Booking Confirmed!</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm relative z-10">
                <div>
                  <span className="font-medium text-emerald-700">Service Fee:</span>
                  <span className="text-gray-900 ml-2">
                    {record.currency} {record.serviceFee?.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-emerald-700">Duration:</span>
                  <span className="text-gray-900 ml-2">
                    {record.startDate && record.endDate &&
                      `${Math.ceil((new Date(record.endDate).getTime() - new Date(record.startDate).getTime()) / (1000 * 60 * 60))} hours`
                    }
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-emerald-700">Scheduled:</span>
                  <span className="text-gray-900 ml-2">
                    {record.startDate && new Date(record.startDate).toLocaleString()} -{' '}
                    {record.endDate && new Date(record.endDate).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Incomplete warning for provider */}
          {isProvider && !isComplete && (partialConfirmed || hasDateTime) && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl relative overflow-hidden">
              <div className="flex items-center space-x-2 relative z-10">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-orange-700">Action Required</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 relative z-10">
                {!hasServiceFee ? 'Please set the service fee to complete the booking confirmation.' :
                 'Please confirm all details to finalize the booking.'}
              </p>
            </div>
          )}

          {/* User Details and Rating Buttons - Moved inside scrollable area */}
          {(onViewUserDetails || onReviewClick) && (
            <div className="mt-6 p-4 border-t border-gray-100 bg-gray-50 relative z-10 space-y-3 rounded-xl">
              {onViewUserDetails && (
                <button
                  className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 font-medium border border-gray-200 shadow-sm"
                  onClick={onViewUserDetails}
                >
                  <span className="relative z-10">
                    {currentUserRole === 'USER'
                      ? 'View Service Provider'
                      : 'View Customer'}
                  </span>
                </button>
              )}

              {onReviewClick && (
                <button
                  className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 font-medium border border-gray-200 shadow-sm"
                  onClick={onReviewClick}
                >
                  <span className="relative z-10">
                    {currentUserRole === 'USER'
                      ? 'Rate Service & Provider'
                      : 'Rate Customer'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rating buttons removed from here - now inside scrollable area above */}
    </div>
  );
};

export default ConfirmationPanel;
