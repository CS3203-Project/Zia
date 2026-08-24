import { Award } from 'lucide-react';

interface ProviderAboutSectionProps {
  bio?: string;
  skills: string[];
  qualifications: string[];
}

export default function ProviderAboutSection({ bio, skills, qualifications }: ProviderAboutSectionProps) {
  return (
    <>
      {/* Bio - Glass Morphism */}
      {bio && (
        <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">About Me</h2>
              <p className="text-sm text-gray-500 font-medium">Professional background and expertise</p>
            </div>
          </div>
          <div className="prose prose-gray max-w-none">
            <blockquote className="border-l-4 border-black/20 pl-6 py-3 bg-white/50 rounded-r-xl backdrop-blur-sm">
              <p className="text-gray-500 leading-relaxed text-base italic font-medium">
                "{bio}"
              </p>
            </blockquote>
          </div>
        </div>
      )}

      {/* Skills - Glass Morphism */}
      {skills && skills.length > 0 && (
        <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">Skills & Expertise</h2>
              <p className="text-sm text-gray-500 font-medium">
                ✨ {skills.length} skill{skills.length !== 1 ? 's' : ''} listed
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="group px-5 py-2.5 bg-white/50 backdrop-blur-md text-gray-900 rounded-full text-sm font-semibold border border-white/30 hover:border-white/50 hover:shadow-[0_4px_16px_0_rgba(0,0,0,0.12)] transition-all duration-300 cursor-default hover:scale-105"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Qualifications - Glass Morphism */}
      {qualifications && qualifications.length > 0 && (
        <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">Qualifications & Certifications</h2>
              <p className="text-sm text-gray-500 font-medium">
                Professional credentials and achievements
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {qualifications.map((qualification, index) => (
              <div key={index} className="group flex items-start space-x-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-102">
                <div className="w-12 h-12 bg-white/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <Award className="h-6 w-6 text-gray-900" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold leading-relaxed">
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
