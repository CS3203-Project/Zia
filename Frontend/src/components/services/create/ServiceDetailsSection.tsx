import React from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';

interface ServiceDetailsSectionProps {
  title: string;
  description: string;
  price: string;
  currency: string;
  titleError?: string;
  descriptionError?: string;
  priceError?: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const ServiceDetailsSection: React.FC<ServiceDetailsSectionProps> = ({
  title,
  description,
  price,
  currency,
  titleError,
  descriptionError,
  priceError,
  onInputChange,
}) => {
  return (
    <div className="relative bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">

      <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent mb-6 flex items-center">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
        Service Details
      </h2>
      <div className="space-y-8">
        {/* Title */}
        <div className="relative">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-3">
            Service Title <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={onInputChange}
              placeholder="Enter a descriptive title for your service"
              className={`w-full px-4 py-4 bg-gray-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400 ${
                titleError ? 'border-red-300 ring-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            /></div>
          {titleError && <p className="mt-2 text-sm text-red-500 flex items-center">
            <FiX className="w-4 h-4 mr-1" />
            {titleError}
          </p>}
        </div>

        {/* Description */}
        <div className="relative">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-3">
            Description <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={onInputChange}
              rows={6}
              placeholder="Describe your service in detail. Include what's included, your experience, and what makes your service unique."
              className={`w-full px-4 py-4 bg-gray-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 resize-none text-gray-900 placeholder-gray-400 ${
                descriptionError ? 'border-red-300 ring-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            />
          </div>
          {descriptionError && <p className="mt-2 text-sm text-red-500 flex items-center">
            <FiX className="w-4 h-4 mr-1" />
            {descriptionError}
          </p>}
        </div>

        {/* Price and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative">
            <label htmlFor="price" className="block text-sm font-semibold text-gray-900 mb-3">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="price"
                name="price"
                value={price}
                onChange={onInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`w-full px-4 py-4 bg-gray-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400 ${
                  priceError ? 'border-red-300 ring-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              /></div>
            {priceError && <p className="mt-2 text-sm text-red-500 flex items-center">
              <FiX className="w-4 h-4 mr-1" />
              {priceError}
            </p>}
          </div>

          <div className="relative">
            <label htmlFor="currency" className="block text-sm font-semibold text-gray-900 mb-3">
              Currency
            </label>
            <div className="relative">
              <select
                id="currency"
                name="currency"
                value={currency}
                onChange={onInputChange}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 appearance-none text-gray-900"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="LKR">LKR (₨)</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
                  <FiChevronDown className="text-gray-500 w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsSection;
