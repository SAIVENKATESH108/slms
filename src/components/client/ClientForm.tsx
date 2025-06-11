import React from 'react';
import { useForm } from 'react-hook-form';
import { Client } from '../../stores/clientStore';
import { apartments } from '../../data/apartments';
import { X, User, Phone, Building, Home, Tag, FileText, Plus, Save } from 'lucide-react';

type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'trustScore'>;

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  initialValues?: Partial<ClientFormData>;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  onSubmit, 
  onCancel,
  initialValues = { 
    name: '', 
    phone: '', 
    apartment: '', 
    flatNumber: '', 
    notes: '', 
    tags: [] 
  } 
}) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ClientFormData>({
    defaultValues: initialValues
  });
  
  const [tagInput, setTagInput] = React.useState('');
  const watchedTags = watch('tags', []);
  const selectedApartment = watch('apartment');
  
  const handleAddTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (index: number) => {
    setValue('tags', watchedTags.filter((_, i) => i !== index));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Generate flat numbers based on selected apartment
  const flatNumbers = React.useMemo(() => {
    if (!selectedApartment) return [];
    const apartment = apartments.find(a => a.name === selectedApartment);
    if (!apartment) return [];
    const flats = [];
    for (let i = apartment.flatNumberStart; i <= apartment.flatNumberEnd; i++) {
      flats.push(i.toString());
    }
    return flats;
  }, [selectedApartment]);
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <User className="h-6 w-6 mr-2" />
          Add New Client
        </h2>
        <p className="text-purple-100 text-sm mt-1">Fill in the client details below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="flex items-center text-sm font-semibold text-gray-700">
            <User className="h-4 w-4 mr-2 text-purple-600" />
            Full Name
          </label>
          <div className="relative">
            <input
              id="name"
              type="text"
              className={`w-full px-4 py-3 pl-11 border-2 ${
                errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
              } rounded-xl shadow-sm focus:ring-4 focus:ring-purple-100 transition-all duration-200`}
              placeholder="Enter client's full name"
              {...register('name', { required: 'Name is required' })}
            />
            <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center">
              <X className="h-4 w-4 mr-1" />
              {errors.name.message}
            </p>
          )}
        </div>
      
        {/* Phone Field */}
        <div className="space-y-2">
          <label htmlFor="phone" className="flex items-center text-sm font-semibold text-gray-700">
            <Phone className="h-4 w-4 mr-2 text-purple-600" />
            Phone Number
          </label>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              className={`w-full px-4 py-3 pl-11 border-2 ${
                errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
              } rounded-xl shadow-sm focus:ring-4 focus:ring-purple-100 transition-all duration-200`}
              placeholder="Enter phone number"
              {...register('phone', { required: 'Phone number is required' })}
            />
            <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-600 flex items-center">
              <X className="h-4 w-4 mr-1" />
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Apartment Field */}
        <div className="space-y-2">
          <label htmlFor="apartment" className="flex items-center text-sm font-semibold text-gray-700">
            <Building className="h-4 w-4 mr-2 text-purple-600" />
            Apartment
          </label>
          <div className="relative">
            <select
              id="apartment"
              className={`w-full px-4 py-3 pl-11 border-2 ${
                errors.apartment ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
              } rounded-xl shadow-sm focus:ring-4 focus:ring-purple-100 transition-all duration-200 appearance-none bg-white`}
              {...register('apartment', { required: 'Apartment is required' })}
            >
              <option value="">Select an apartment</option>
              {apartments.map((apt) => (
                <option key={apt.name} value={apt.name}>
                  {apt.name.charAt(0).toUpperCase() + apt.name.slice(1)}
                </option>
              ))}
            </select>
            <Building className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {errors.apartment && (
            <p className="text-sm text-red-600 flex items-center">
              <X className="h-4 w-4 mr-1" />
              {errors.apartment.message}
            </p>
          )}
        </div>
      
        {/* Flat Number Field */}
        <div className="space-y-2">
          <label htmlFor="flatNumber" className="flex items-center text-sm font-semibold text-gray-700">
            <Home className="h-4 w-4 mr-2 text-purple-600" />
            Flat Number
          </label>
          <div className="relative">
            <select
              id="flatNumber"
              className={`w-full px-4 py-3 pl-11 border-2 ${
                errors.flatNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
              } rounded-xl shadow-sm focus:ring-4 focus:ring-purple-100 transition-all duration-200 appearance-none bg-white ${
                !selectedApartment ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              {...register('flatNumber', { required: 'Flat number is required' })}
              disabled={!selectedApartment}
            >
              <option value="">
                {selectedApartment ? 'Select a flat number' : 'Select apartment first'}
              </option>
              {flatNumbers.map((flat) => (
                <option key={flat} value={flat}>
                  Flat {flat}
                </option>
              ))}
            </select>
            <Home className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {errors.flatNumber && (
            <p className="text-sm text-red-600 flex items-center">
              <X className="h-4 w-4 mr-1" />
              {errors.flatNumber.message}
            </p>
          )}
        </div>
      
        {/* Tags Field */}
        <div className="space-y-2">
          <label htmlFor="tags" className="flex items-center text-sm font-semibold text-gray-700">
            <Tag className="h-4 w-4 mr-2 text-purple-600" />
            Tags
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                id="tagInput"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 pl-11 border-2 border-gray-200 focus:border-purple-500 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                placeholder="Add tag (e.g., VIP, Regular)"
              />
              <Tag className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {watchedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 p-4 bg-gray-50 rounded-xl">
              {watchedTags.map((tag, index) => (
                <div 
                  key={index} 
                  className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-4 py-2 rounded-full flex items-center shadow-sm border border-purple-200"
                >
                  <span className="font-medium">{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-2 text-purple-600 hover:text-purple-800 focus:outline-none hover:bg-purple-300 rounded-full p-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      
        {/* Notes Field */}
        <div className="space-y-2">
          <label htmlFor="notes" className="flex items-center text-sm font-semibold text-gray-700">
            <FileText className="h-4 w-4 mr-2 text-purple-600" />
            Notes
          </label>
          <div className="relative">
            <textarea
              id="notes"
              rows={4}
              className="w-full px-4 py-3 pl-11 border-2 border-gray-200 focus:border-purple-500 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none"
              placeholder="Additional notes about the client..."
              {...register('notes')}
            />
            <FileText className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl shadow-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-200 font-semibold flex items-center hover:shadow-xl transform hover:scale-105"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Client
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
