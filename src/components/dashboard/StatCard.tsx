import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    isPositive: boolean;
  };
  colorScheme?: 'purple' | 'blue' | 'green' | 'red' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  colorScheme = 'purple'
}) => {
  const colorMap = {
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      icon: 'text-purple-600'
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: 'text-red-600'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: 'text-yellow-600'
    }
  };
  
  const colors = colorMap[colorScheme];
  
  return (
    <div className="
      bg-white rounded-lg shadow-sm border border-gray-100 transition duration-200 hover:shadow-md
      p-6
      /* Mobile-specific adjustments */
      iphone-se:p-3 galaxy-s8:p-3 galaxy-fold:p-2
      iphone-xr:p-4 iphone-12-pro:p-4 iphone-14-pro-max:p-5
      pixel-7:p-4 galaxy-s20:p-4 galaxy-a51:p-4
      surface-duo:p-4
    ">
      <div className="flex justify-between">
        <div className="flex-1 min-w-0">
          <p className="
            text-sm font-medium text-gray-500 mb-1
            iphone-se:text-xs galaxy-s8:text-xs galaxy-fold:text-xs
          ">{title}</p>
          <p className="
            text-2xl font-semibold text-gray-900
            iphone-se:text-lg galaxy-s8:text-lg galaxy-fold:text-lg
            iphone-xr:text-xl iphone-12-pro:text-xl iphone-14-pro-max:text-2xl
            pixel-7:text-xl galaxy-s20:text-xl galaxy-a51:text-xl
            surface-duo:text-xl
          ">{value}</p>
          
          {change && (
            <div className="flex items-center mt-2">
              <span className={`
                text-xs font-medium
                iphone-se:text-xs galaxy-s8:text-xs galaxy-fold:text-xs
                ${change.isPositive ? 'text-green-600' : 'text-red-600'}
              `}>
                {change.isPositive ? '+' : ''}{change.value}%
              </span>
              <span className="
                text-xs text-gray-500 ml-1
                iphone-se:text-xs galaxy-s8:text-xs galaxy-fold:text-xs
              ">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={`
          ${colors.bg} rounded-full p-3 h-12 w-12 flex items-center justify-center flex-shrink-0
          iphone-se:p-2 iphone-se:h-8 iphone-se:w-8
          galaxy-s8:p-2 galaxy-s8:h-8 galaxy-s8:w-8
          galaxy-fold:p-1 galaxy-fold:h-6 galaxy-fold:w-6
          iphone-xr:p-2 iphone-xr:h-10 iphone-xr:w-10
          iphone-12-pro:p-2 iphone-12-pro:h-10 iphone-12-pro:w-10
          iphone-14-pro-max:p-3 iphone-14-pro-max:h-12 iphone-14-pro-max:w-12
          pixel-7:p-2 pixel-7:h-10 pixel-7:w-10
          galaxy-s20:p-2 galaxy-s20:h-10 galaxy-s20:w-10
          galaxy-a51:p-2 galaxy-a51:h-10 galaxy-a51:w-10
          surface-duo:p-2 surface-duo:h-10 surface-duo:w-10
        `}>
          <Icon className={`
            h-6 w-6 ${colors.icon}
            iphone-se:h-4 iphone-se:w-4
            galaxy-s8:h-4 galaxy-s8:w-4
            galaxy-fold:h-3 galaxy-fold:w-3
            iphone-xr:h-5 iphone-xr:w-5
            iphone-12-pro:h-5 iphone-12-pro:w-5
            iphone-14-pro-max:h-6 iphone-14-pro-max:w-6
            pixel-7:h-5 pixel-7:w-5
            galaxy-s20:h-5 galaxy-s20:w-5
            galaxy-a51:h-5 galaxy-a51:w-5
            surface-duo:h-5 surface-duo:w-5
          `} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;