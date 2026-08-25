import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbProps {
  items: {
    label: string;
    href?: string;
  }[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex min-w-0" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 md:space-x-3 min-w-0">
        <li className="inline-flex items-center flex-shrink-0">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-black transition-colors duration-200">
            <Home className="w-4 h-4 mr-2.5" />
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className={index === items.length - 1 ? 'min-w-0' : 'flex-shrink-0'}>
            <div className="flex items-center min-w-0">
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {item.href ? (
                <Link to={item.href} className="ml-1 text-sm font-medium text-gray-600 hover:text-black md:ml-2 transition-colors duration-200 whitespace-nowrap">
                  {item.label}
                </Link>
              ) : (
                <span className="ml-1 text-sm font-medium text-black md:ml-2 truncate">{item.label}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
