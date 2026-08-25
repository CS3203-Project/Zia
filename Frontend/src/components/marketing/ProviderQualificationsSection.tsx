import { Trash2, Plus, CheckCircle } from 'lucide-react';
import type { RefObject } from 'react';
import Button from '../shared/Button';

interface ProviderQualificationsSectionProps {
  sectionRef: RefObject<HTMLDivElement | null>;
  qualifications: string[];
  newQualification: string;
  onNewQualificationChange: (value: string) => void;
  onAddQualification: () => void;
  onRemoveQualification: (qualification: string) => void;
  error?: string;
  touched?: boolean;
}

export default function ProviderQualificationsSection({
  sectionRef,
  qualifications,
  newQualification,
  onNewQualificationChange,
  onAddQualification,
  onRemoveQualification,
  error,
  touched
}: ProviderQualificationsSectionProps) {
  return (
    <div ref={sectionRef} className="space-y-4 pb-8 border-b border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 flex items-center">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
        Qualifications & Certifications
      </h2>

      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={newQualification}
          onChange={(e) => onNewQualificationChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddQualification())}
          placeholder="Add a qualification (e.g., Bachelor's in Computer Science, AWS Certified)"
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-900 placeholder-gray-400 transition-all duration-200"
        />
        <Button
          type="button"
          onClick={onAddQualification}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </Button>
      </div>

      {qualifications && qualifications.length > 0 && (
        <div className="space-y-3">
          {qualifications.map((qualification, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white border border-gray-200 shadow-sm px-6 py-4 rounded-xl"
            >
              <span className="text-gray-900 font-medium">{qualification}</span>
              <button
                type="button"
                onClick={() => onRemoveQualification(qualification)}
                className="text-red-500 hover:text-red-600 transition-colors p-1"
                title={`Remove ${qualification}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Qualifications error and success indicators */}
      {error && touched && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm flex items-center space-x-2">
            <span className="text-red-500">Warning</span>
            <span>{error}</span>
          </p>
        </div>
      )}
      {qualifications && qualifications.length >= 1 && !error && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-600 text-sm flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Great! You've added {qualifications.length} qualification{qualifications.length > 1 ? 's' : ''}.</span>
          </p>
        </div>
      )}

      <p className="text-gray-500 text-sm">
        Include your education, certifications, and professional achievements
      </p>
    </div>
  );
}
