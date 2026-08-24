import React from 'react';
import { FiClock } from 'react-icons/fi';
import { daysOfWeek, type WorkingHours } from './types';

interface WorkingHoursSectionProps {
  workingTime: WorkingHours;
  previewLines: string[];
  onWorkingHoursChange: (day: keyof WorkingHours, field: 'enabled' | 'startTime' | 'endTime', value: boolean | string) => void;
}

const WorkingHoursSection: React.FC<WorkingHoursSectionProps> = ({
  workingTime,
  previewLines,
  onWorkingHoursChange,
}) => {
  return (
    <div className="relative bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
      <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent mb-6 flex items-center relative z-10">
        <span className="bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">Working Hours</span>
      </h2>
      <div className="space-y-4 relative z-10">
        {daysOfWeek.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100 transition-all duration-300">
            <div className="flex items-center min-w-[140px]">
              <div className="relative">
                <input
                  type="checkbox"
                  id={`working-${key}`}
                  checked={workingTime[key].enabled}
                  onChange={(e) => onWorkingHoursChange(key, 'enabled', e.target.checked)}
                  className="h-5 w-5 rounded-md bg-white border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-orange-500 transition-all duration-200"
                />
              </div>
              <label htmlFor={`working-${key}`} className="ml-3 text-sm font-semibold text-gray-900">
                {label}
              </label>
            </div>

            <div className="flex items-center space-x-3 flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    value={workingTime[key].startTime}
                    onChange={(e) => onWorkingHoursChange(key, 'startTime', e.target.value)}
                    disabled={!workingTime[key].enabled}
                    className={`px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-300 text-gray-900 ${
                      workingTime[key].enabled
                        ? 'border-gray-200'
                        : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label={`Start time for ${label}`}
                  />
                </div>
                <span className="text-gray-400 font-medium">to</span>
                <input
                  type="time"
                  value={workingTime[key].endTime}
                  onChange={(e) => onWorkingHoursChange(key, 'endTime', e.target.value)}
                  disabled={!workingTime[key].enabled}
                  className={`px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-300 text-gray-900 ${
                    workingTime[key].enabled
                      ? 'border-gray-200'
                      : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label={`End time for ${label}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {previewLines.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            Preview (as saved):
          </div>
          <div className="text-sm text-gray-400 space-y-1">
            {previewLines.map((time, index) => (
              <div key={index} className="flex items-center">
                {time}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkingHoursSection;
