
import React, { useState, useEffect } from 'react';
import { Home, Building, Search, Grid, List, Filter, MapPin, Users, ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apartments, Apartment } from '../data/apartments';

const Flats: React.FC = () => {
  const flatsPerPage = 12;

  const navigate = useNavigate();

  // State for selected apartment
  const [selectedApartment, setSelectedApartment] = useState<Apartment>(apartments[0]);
  // State for current page
  const [currentPage, setCurrentPage] = useState(1);
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  // State for view mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // State for loading animation
  const [loading, setLoading] = useState(false);

  // Calculate total flats count based on selected apartment
  const totalFlats = selectedApartment.flatNumberEnd - selectedApartment.flatNumberStart + 1;

  // Calculate total pages
  const totalPages = Math.ceil(totalFlats / flatsPerPage);

  // Generate flats for current page based on selected apartment
  const flats = Array.from({ length: flatsPerPage }, (_, index) => {
    const flatNumber = selectedApartment.flatNumberStart + (currentPage - 1) * flatsPerPage + index;
    if (flatNumber > selectedApartment.flatNumberEnd) return null;
    return {
      id: flatNumber.toString(),
      label: `Flat ${flatNumber}`,
      number: flatNumber,
    };
  }).filter(Boolean) as { id: string; label: string; number: number }[];

  // Filter flats by search term
  const filteredFlats = flats.filter(flat =>
    flat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flat.number.toString().includes(searchTerm)
  );

  // Handle page change with loading animation
  const handlePageChange = (page: number) => {
    setLoading(true);
    setCurrentPage(page);
    setTimeout(() => setLoading(false), 300);
  };

  // Handle apartment change
  const handleApartmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const apartment = apartments.find(a => a.name === event.target.value);
    if (apartment) {
      setLoading(true);
      setSelectedApartment(apartment);
      setCurrentPage(1);
      setSearchTerm('');
      setTimeout(() => setLoading(false), 300);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Handle flat selection - navigate to FlatView page
  const handleFlatSelect = (flatId: string) => {
    navigate(`/flats/${flatId}`);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      <div className="p-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Building size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Flats Overview
              </h1>
              <p className="text-gray-600 mt-1">
                Browse and manage apartment flats across {apartments.length} buildings
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Building</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedApartment.name.charAt(0).toUpperCase() + selectedApartment.name.slice(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Home className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Flats</p>
                  <p className="text-xl font-bold text-gray-900">{totalFlats}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Range</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedApartment.flatNumberStart} - {selectedApartment.flatNumberEnd}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Apartment Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-blue-600" />
                  Building
                </label>
                <select
                  value={selectedApartment.name}
                  onChange={handleApartmentChange}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white min-w-[200px]"
                >
                  {apartments.map((apartment) => (
                    <option key={apartment.name} value={apartment.name}>
                      {apartment.name.charAt(0).toUpperCase() + apartment.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <Search className="h-4 w-4 mr-2 text-purple-600" />
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search flats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 min-w-[200px]"
                  />
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Flats Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {filteredFlats.map((flat) => (
                  <div
                    key={flat.id}
                    className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-200"
                    onClick={() => handleFlatSelect(flat.id)}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                        <Home className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          Flat {flat.number}
                        </p>
                        <p className="text-sm text-gray-500">#{flat.number}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="divide-y divide-gray-100">
                  {filteredFlats.map((flat) => (
                    <div
                      key={flat.id}
                      className="group p-6 cursor-pointer hover:bg-blue-50 transition-all duration-200"
                      onClick={() => handleFlatSelect(flat.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                            <Home className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-blue-700">
                              {flat.label}
                            </p>
                            <p className="text-sm text-gray-500">
                              {selectedApartment.name.charAt(0).toUpperCase() + selectedApartment.name.slice(1)} Building
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Flats;
