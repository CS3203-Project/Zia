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
    <div className="relative bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
      <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent mb-6 flex items-center relative z-10">
        <span className="bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">Tags</span>
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
            size="sm"
            className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg transition-all duration-300 rounded-xl font-semibold border border-transparent"
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
                className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-orange-50 backdrop-blur-sm text-orange-700 border border-orange-100 transition-all duration-300 group"
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
