import React from 'react';

interface BulkUploadModalProps {
  data: string;
  onChange: (data: string) => void;
  onUpload: () => void;
  onClose: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ data, onChange, onUpload, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Upload Services</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Enter service data in CSV format. Each line should contain:
            </p>
            <code className="text-xs bg-gray-100 p-2 rounded block">
              Name, Description, Price, Duration (minutes), Category
            </code>
            <p className="text-xs text-gray-500 mt-1">
              Example: Hair Cut, Professional hair cutting service, 500, 30, Hair Care
            </p>
          </div>
          
          <textarea
            value={data}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Hair Cut, Professional hair cutting service, 500, 30, Hair Care&#10;Hair Color, Hair coloring and styling, 1500, 90, Hair Care&#10;Facial, Deep cleansing facial treatment, 800, 45, Skin Care"
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
          />
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onUpload}
              disabled={!data.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;