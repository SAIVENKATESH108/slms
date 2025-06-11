import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', loading = false, children, disabled, ...props }) => {
  return (
    <button
      className={
        'px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md transition-all duration-200 flex items-center justify-center ' +
        variantClasses[variant] +
        (disabled || loading ? ' opacity-50 cursor-not-allowed' : '')
      }
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 mr-2 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
