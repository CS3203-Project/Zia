import { Award } from 'lucide-react';

interface ProviderAboutSectionProps {
  bio?: string;
  skills: string[];
  qualifications: string[];
}

export default function ProviderAboutSection({ bio, skills, qualifications }: ProviderAboutSectionProps) {
  return (
    <>
      {bio && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">About Me</h2>
            <p className="text-sm text-gray-500 font-medium">Professional background and expertise</p>
          </div>
          <blockquote className="border-l-2 border-orange-200 pl-6 py-1">
            <p className="text-gray-600 leading-relaxed text-base italic">
              "{bio}"
            </p>
          </blockquote>
        </div>
      )}

      {skills && skills.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Skills & Expertise</h2>
            <p className="text-sm text-gray-500 font-medium">
              {skills.length} skill{skills.length !== 1 ? 's' : ''} listed
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {qualifications && qualifications.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Qualifications & Certifications</h2>
            <p className="text-sm text-gray-500 font-medium">
              Professional credentials and achievements
            </p>
          </div>
          <div className="space-y-3">
            {qualifications.map((qualification, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 pt-2">
                  <p className="text-gray-900 font-medium leading-relaxed">
                    {qualification}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
