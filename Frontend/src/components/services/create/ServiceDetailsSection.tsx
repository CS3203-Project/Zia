import React from 'react';
import RichTextArea from '../../shared/RichTextArea';
import { FiX } from 'react-icons/fi';
import Select from '../../shared/Select';

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
    <div className="pb-8 border-b border-gray-100">

      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
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
            {/* Markdown, not HTML: the stored value stays readable and there is no
                markup to sanitise wherever it gets rendered. */}
            <RichTextArea
              value={description}
              onChange={(next) =>
                onInputChange({
                  target: { name: 'description', value: next },
                } as React.ChangeEvent<HTMLTextAreaElement>)
              }
              rows={6}
              placeholder="Describe your service. Use the toolbar for bold text, bullet points and numbered steps."
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
            <Select
              id="currency"
              name="currency"
              value={currency}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'LKR', label: 'LKR (₨)' },
              ]}
              onChange={onInputChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsSection;
