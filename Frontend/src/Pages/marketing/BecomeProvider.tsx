import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../api/userApi';
import type { CreateProviderData } from '../../api/userApi';
import { uploadImage } from '../../utils/imageUpload';
import toast from 'react-hot-toast';
import BecomeProviderHero from '../../components/marketing/BecomeProviderHero';
import ProviderBioSection from '../../components/marketing/ProviderBioSection';
import ProviderSkillsSection from '../../components/marketing/ProviderSkillsSection';
import ProviderQualificationsSection from '../../components/marketing/ProviderQualificationsSection';
import ProviderUploadCard from '../../components/marketing/ProviderUploadCard';
import ProviderNextStepsNote from '../../components/marketing/ProviderNextStepsNote';
import ProviderFormSubmitBar from '../../components/marketing/ProviderFormSubmitBar';

export default function BecomeProvider() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading, updateUser } = useAuth();

  // Redirect straight to login if the user isn't authenticated
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      localStorage.setItem('RedirectAfterLogin', window.location.pathname);
      navigate('/signin', { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate]);

  // Section refs for scrolling to first invalid field on submit
  const bioSectionRef = useRef<HTMLDivElement | null>(null);
  const skillsSectionRef = useRef<HTMLDivElement | null>(null);
  const qualificationsSectionRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState<CreateProviderData>({
    bio: '',
    skills: [],
    qualifications: [],
    logoUrl: '',
    IDCardUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  // Real-time validation
  const validateField = (
    field: 'bio' | 'skills' | 'qualifications',
    value: string | string[]
  ): boolean => {
    const errors: {[key: string]: string} = {};
    
    switch (field) {
      case 'bio':
        if (typeof value !== 'string' || !value?.trim()) {
          errors.bio = 'Bio is required';
        } else if (value.trim().length < 50) {
          errors.bio = 'Bio should be at least 50 characters long';
        } else if (value.trim().length > 1000) {
          errors.bio = 'Bio should not exceed 1000 characters';
        }
        break;
      case 'skills':
        if (!Array.isArray(value) || value.length === 0) {
          errors.skills = 'At least one skill is required';
        } else if (value.length < 2) {
          errors.skills = 'Please add at least 2 skills';
        }
        break;
      case 'qualifications':
        if (!Array.isArray(value) || value.length === 0) {
          errors.qualifications = 'At least one qualification is required';
        }
        break;
    }
    
    setFormErrors(prev => ({ ...prev, [field]: errors[field] || '' }));
    return !errors[field];
  };

  const handleFieldBlur = (field: 'bio' | 'skills' | 'qualifications') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof CreateProviderData] as string | string[]);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData(prev => ({ ...prev, logoUrl: imageUrl }));
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload logo. Please try again.');
      console.error('Logo upload error:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData(prev => ({ ...prev, IDCardUrl: imageUrl }));
      toast.success('ID document uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload ID document. Please try again.');
      console.error('ID upload error:', error);
    } finally {
      setUploadingId(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if uploads are in progress
    if (uploadingLogo || uploadingId) {
      toast.error('Please wait for image uploads to complete');
      return;
    }
    
    // Comprehensive validation
    const isValidBio = validateField('bio', formData.bio);
    const isValidSkills = validateField('skills', formData.skills);
    const isValidQualifications = validateField('qualifications', formData.qualifications);
    
    if (!isValidBio || !isValidSkills || !isValidQualifications) {
      // Mark all as touched so inline errors are visible
      setTouched({ bio: true, skills: true, qualifications: true });

      // Scroll to the first invalid section to guide the user
      if (!isValidBio) {
        bioSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (!isValidSkills) {
        skillsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (!isValidQualifications) {
        qualificationsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      await userApi.createProvider(formData);

      // createProvider promotes the user to PROVIDER server-side, but AuthContext
      // only loads the profile on mount - without re-reading it the navbar kept
      // offering "Become a Provider" until the user manually refreshed.
      try {
        const refreshed = await userApi.getProfile();
        updateUser(refreshed);
      } catch {
        // Non-fatal: the profile page reloads it anyway.
      }

      toast.success('Application submitted. Your profile is pending verification.');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create provider profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      const updatedSkills = [...(formData.skills || []), newSkill.trim()];
      setFormData(prev => ({
        ...prev,
        skills: updatedSkills
      }));
      setNewSkill('');
      if (touched.skills) validateField('skills', updatedSkills);
      toast.success('Skill added successfully! ');
    } else if (formData.skills?.includes(newSkill.trim())) {
      toast.error('This skill has already been added');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = formData.skills?.filter(skill => skill !== skillToRemove) || [];
    setFormData(prev => ({
      ...prev,
      skills: updatedSkills
    }));
    if (touched.skills) validateField('skills', updatedSkills);
    toast.success('Skill removed');
  };

  const addQualification = () => {
    if (newQualification.trim() && !formData.qualifications?.includes(newQualification.trim())) {
      const updatedQualifications = [...(formData.qualifications || []), newQualification.trim()];
      setFormData(prev => ({
        ...prev,
        qualifications: updatedQualifications
      }));
      setNewQualification('');
      if (touched.qualifications) validateField('qualifications', updatedQualifications);
      toast.success('Qualification added successfully!');
    } else if (formData.qualifications?.includes(newQualification.trim())) {
      toast.error('This qualification has already been added');
    }
  };

  const removeQualification = (qualificationToRemove: string) => {
    const updatedQualifications = formData.qualifications?.filter(qual => qual !== qualificationToRemove) || [];
    setFormData(prev => ({
      ...prev,
      qualifications: updatedQualifications
    }));
    if (touched.qualifications) validateField('qualifications', updatedQualifications);
    toast.success('Qualification removed');
  };

  if (authLoading || !isLoggedIn) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Hero Section */}
      <BecomeProviderHero onBack={() => navigate('/profile')} />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
        {/* Form Container */}
        <div className="relative">
          <div className="relative bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">

            <form onSubmit={handleSubmit} className="relative z-10">
              <div className="p-8 space-y-8">
              {/* Bio Section */}
              <ProviderBioSection
                sectionRef={bioSectionRef}
                bio={formData.bio || ''}
                error={formErrors.bio}
                touched={touched.bio}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, bio: value }));
                  if (touched.bio) validateField('bio', value);
                }}
                onBlur={() => handleFieldBlur('bio')}
              />

              {/* Skills Section */}
              <ProviderSkillsSection
                sectionRef={skillsSectionRef}
                skills={formData.skills || []}
                newSkill={newSkill}
                onNewSkillChange={setNewSkill}
                onAddSkill={addSkill}
                onRemoveSkill={removeSkill}
                error={formErrors.skills}
                touched={touched.skills}
              />

              {/* Qualifications Section */}
              <ProviderQualificationsSection
                sectionRef={qualificationsSectionRef}
                qualifications={formData.qualifications || []}
                newQualification={newQualification}
                onNewQualificationChange={setNewQualification}
                onAddQualification={addQualification}
                onRemoveQualification={removeQualification}
                error={formErrors.qualifications}
                touched={touched.qualifications}
              />

              {/* Logo Upload Section */}
              <ProviderUploadCard
                label="Business Logo / Profile Picture"
                inputId="logo-upload"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                inputTitle="Upload logo"
                dropzoneTitle="Click to upload your logo"
                dropzoneSubtitle="SVG, PNG, JPG up to 5MB"
                uploading={uploadingLogo}
                uploadingLabel="Uploading logo..."
                uploadedUrl={formData.logoUrl}
                footerHint="A professional image increases profile views by 60%"
              />

              {/* ID Card Upload Section */}
              <ProviderUploadCard
                label="ID Verification"
                inputId="id-upload"
                onChange={handleIdUpload}
                disabled={uploadingId}
                inputTitle="Upload ID document"
                dropzoneTitle="Upload ID Document"
                dropzoneSubtitle="Driver's License, ID Card, or Professional License"
                uploading={uploadingId}
                uploadingLabel="Uploading document..."
                uploadedUrl={formData.IDCardUrl}
                footerHint="ID verification can speed up approval by 2-3 days"
              />

              {/* Information Note */}
              <ProviderNextStepsNote />
            </div>

            {/* Submit Section */}
            <ProviderFormSubmitBar
              onCancel={() => navigate('/profile')}
              loading={loading}
              uploadingLogo={uploadingLogo}
              uploadingId={uploadingId}
            />
          </form>
        </div>
      </div>
      </main>
    </div>
  );
}


