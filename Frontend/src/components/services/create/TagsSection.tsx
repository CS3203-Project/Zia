import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import Button from '../../shared/Button';

interface TagsSectionProps {
  tags: string[];
  currentTag: string;
  onCurrentTagChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

const TagsSection: React.FC<TagsSectionProps> = ({
  tags,
  currentTag,
  onCurrentTagChange,
  onAddTag,
  onRemoveTag,
}) => {
  return (
    <div className="pb-8 border-b border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
        <span>Tags</span>
      </h2>
      <div className="space-y-6 relative z-10">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => onCurrentTagChange(e.target.value)}
              placeholder="e.g., photography, wedding, portrait"
              maxLength={30}
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
            /></div>
          <Button
            type="button"
            onClick={onAddTag}
            size="lg"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-orange-50 text-orange-700 border border-orange-100"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="ml-2 text-orange-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-all duration-200"
                  aria-label={`Remove tag ${tag}`}
                  title={`Remove tag ${tag}`}
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsSection;
