import { Clock, Edit2, Award } from 'lucide-react';
import Button from '../../shared/Button';
import type { ProviderProfile } from '../../../api/userApi';

interface UnverifiedProviderNoticeProps {
  providerProfile: ProviderProfile;
  onEditProvider: () => void;
  onCancelApplication: () => void;
}

export default function UnverifiedProviderNotice({
  providerProfile,
  onEditProvider,
  onCancelApplication
}: UnverifiedProviderNoticeProps) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl p-8 text-center border border-gray-100">
      <div className="max-w-md mx-auto">
        <div className="p-3 bg-yellow-500/20 backdrop-blur-sm rounded-full inline-flex mb-4 border border-yellow-400/30">
          <Clock className="h-12 w-12 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verification in Progress</h2>
        <p className="text-gray-500 mb-6">
          Your provider profile has been submitted and is currently under review.
          Our team is verifying your information and credentials.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">What's Next?</h3>
          <ul className="text-sm text-yellow-700 space-y-1 text-left">
            <li>• We'll review your profile and credentials</li>
            <li>• You'll receive an email once verification is complete</li>
            <li>• Verification typically takes 1-3 business days</li>
            <li>• Once verified, you can start adding services</li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onEditProvider}
            className="flex items-center space-x-2"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit Profile</span>
          </Button>
          <Button
            onClick={onCancelApplication}
            variant="outline"
            className="!text-red-600 !border-red-200 hover:!bg-red-50 hover:!border-red-300 hover:!text-red-700"
          >
            Cancel Application
          </Button>
        </div>

        {/* Show basic provider info */}
        <div className="mt-8 text-left">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Submitted Information</h3>
          <div className="space-y-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            {providerProfile.bio && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Bio</h4>
                <p className="text-gray-500 text-base leading-relaxed">{providerProfile.bio}</p>
              </div>
            )}

            {providerProfile.skills && providerProfile.skills.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {providerProfile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {providerProfile.qualifications && providerProfile.qualifications.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Qualifications</h4>
                <div className="space-y-1">
                  {providerProfile.qualifications.map((qualification, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-orange-600" />
                      <span className="text-gray-500 text-base">{qualification}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
