import { useState } from 'react';
import {
  Book,
  FileText,
  Presentation,
  Video,
  BarChart2,
  Crown,
} from 'lucide-react';

import PremiumSectionView from './PremiumSectionView';

const sections = [
  {
    type: 'Notes',
    label: 'Notes',
    icon: Book,
  },
  {
    type: 'Question Banks',
    label: 'Question Banks',
    icon: FileText,
  },
  {
    type: 'Video Links',
    label: 'Video Links',
    icon: Video,
  },
  {
    type: 'PPTs',
    label: 'PPTs',
    icon: Presentation,
  },
  {
    type: 'Reports',
    label: 'Reports',
    icon: BarChart2,
  },
];

function PremiumDashboard() {
  const [activeSection, setActiveSection] = useState(
    'Notes'
  );

  return (
    <div className="min-h-full">
      {/* HEADER */}

      <div className="mb-6">
        <div className="flex items-center gap-2 text-purple-500">
          <Crown className="h-5 w-5" />

          <span className="text-xs font-bold uppercase tracking-[0.18em]">
            Premium Library
          </span>
        </div>

        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Premium Dashboard
        </h1>

        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Explore premium notes, question banks, videos,
          presentations and reports.
        </p>
      </div>

      {/* SECTION TABS */}

      <div className="mb-8 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        <div className="flex min-w-max gap-1">
          {sections.map(
            ({
              type,
              label,
              icon: Icon,
            }) => {
              const active =
                activeSection === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setActiveSection(type)
                  }
                  className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />

                  {label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* ACTIVE PREMIUM SECTION */}

      <PremiumSectionView
        key={activeSection}
        sectionName={activeSection}
        onBack={() =>
          setActiveSection('Notes')
        }
      />
    </div>
  );
}

export default PremiumDashboard;