import { Award, Star, Trash2, Plus, CheckCircle } from 'lucide-react';
import type { RefObject } from 'react';
import Button from '../shared/Button';

interface ProviderSkillsSectionProps {
  sectionRef: RefObject<HTMLDivElement | null>;
  skills: string[];
  newSkill: string;
  onNewSkillChange: (value: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
  error?: string;
  touched?: boolean;
}

export default function ProviderSkillsSection({
  sectionRef,
  skills,
  newSkill,
  onNewSkillChange,
  onAddSkill,
  onRemoveSkill,
  error,
  touched
}: ProviderSkillsSectionProps) {
  return (
    <div ref={sectionRef} className="space-y-6 pb-8 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <label className="flex items-center text-lg font-bold text-gray-900">
          <div className="relative p-2 bg-orange-50 rounded-lg mr-3">
            <Award className="h-5 w-5 text-orange-600" />
          </div>
          Your Skills & Expertise
        </label>
        <span className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded-full">
          {skills?.length || 0} skills added
        </span>
      </div>

      {/* Skill input */}
      <div className="relative group">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => onNewSkillChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddSkill())}
              placeholder="Add a skill (e.g., Web Development, Photography, Tutoring)"
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-900 placeholder-gray-400 transition-all duration-200"
            />
            {newSkill && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={onAddSkill}
            disabled={!newSkill.trim()}
            size="lg"
            className="flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Skill</span>
          </Button>
        </div>
      </div>

      {/* Skills display */}
      {skills && skills.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-600 flex items-center space-x-2">
            <Star className="h-4 w-4 text-orange-500" />
            <span>Your Skills Portfolio</span>
          </h4>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="group relative bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">{skill}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSkill(skill)}
                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title={`Remove ${skill}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error and validation messages */}
      {error && touched && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm flex items-center space-x-2">
            <span className="text-red-500">Warning</span>
            <span>{error}</span>
          </p>
        </div>
      )}

      {/* Success indicator */}
      {skills && skills.length >= 2 && !error && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-slide-up">
          <p className="text-emerald-600 text-sm flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Excellent! You've added {skills.length} skills to your profile.</span>
          </p>
        </div>
      )}

      <div className="flex items-start space-x-2 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
        <div className="p-1 bg-orange-100 rounded-full">
          <Award className="h-4 w-4 text-orange-600" />
        </div>
        <div className="flex-1">
          <p className="text-gray-900 text-sm font-medium mb-1">Skill Tips</p>
          <p className="text-gray-600 text-sm">Add 3-5 relevant skills that showcase your expertise. Be specific (e.g., "React Development" instead of just "Programming").</p>
        </div>
      </div>
    </div>
  );
}
