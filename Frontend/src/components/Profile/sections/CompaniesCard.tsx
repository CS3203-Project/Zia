import { Building, Plus, Edit2, Trash2, MapPin, Phone, ExternalLink } from 'lucide-react';
import Button from '../../shared/Button';
import type { Company } from '../../../api/userApi';

interface CompaniesCardProps {
  companies: Company[];
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompanyClick: (companyId: string) => void;
}

export default function CompaniesCard({
  companies,
  onAddCompany,
  onEditCompany,
  onDeleteCompanyClick
}: CompaniesCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Companies</h2>
        <Button
          onClick={onAddCompany}
          variant="white"
          size="sm"
          className="flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold rounded-full hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          <span>Add Company</span>
        </Button>
      </div>

      {companies && companies.length > 0 ? (
        <div className="space-y-4">
          {companies.map((company) => (
            <div key={company.id} className="border border-gray-100 rounded-lg p-4 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-gray-100">
                      <Building className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{company.name}</h3>
                    {company.description && (
                      <p className="text-gray-400 text-sm mt-1">{company.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onEditCompany(company)}
                    variant="white"
                    size="sm"
                    className="p-2.5 rounded-full hover:scale-110 transition-all duration-300"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onDeleteCompanyClick(company.id)}
                    variant="white"
                    size="sm"
                    className="p-2.5 !text-red-400 hover:!text-red-700 rounded-full hover:scale-110 transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                {company.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{company.address}</span>
                  </div>
                )}
                {company.contact && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{company.contact}</span>
                  </div>
                )}
              </div>

              {company.socialmedia && company.socialmedia.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {company.socialmedia.map((link, index) => (
                      <a
                        key={index}
                        href={link.startsWith('http') ? link : `https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {new URL(link.startsWith('http') ? link : `https://${link}`).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No companies added yet</p>
          <Button
            onClick={onAddCompany}
            variant="white"
            size="sm"
            className="rounded-full"
          >
            Add Your First Company
          </Button>
        </div>
      )}
    </div>
  );
}
