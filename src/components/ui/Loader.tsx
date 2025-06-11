import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;