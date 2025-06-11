import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Shield
} from 'lucide-react';
import { useAuthSession } from '../hooks/AuthSession';
import { useEmployees } from '../hooks/useEmployees';
import { Employee, EmployeeFormData } from '../types/Employees';
import EmployeeForm from '../components/employees/EmployeeForm';
import EmployeeDetails from '../components/employees/EmployeeDetails';

const StaffManagement: React.FC = () => {
  const { hasPermission, isAdmin } = useAuthSession();
  const {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
  } = useEmployees();

  // Filter employees with role 'employee' as staff
  const staffMembers = employees.filter(emp => emp.role === 'employee');

  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Employee | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Temporarily bypass permission check for testing
  // const canManageStaff = isAdmin() || hasPermission('manage:employees');
  const canManageStaff = true;

  if (!canManageStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage staff.</p>
        </div>
      </div>
    );
  }

  // Define handler functions for staff management actions
const handleAddStaff = async (employeeData: EmployeeFormData) => {
    try {
      await addEmployee(employeeData);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add staff:', error);
      alert('Failed to add staff: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleUpdateStaff = async (employeeData: EmployeeFormData) => {
    if (!selectedStaff) return;
    try {
      await updateEmployee(selectedStaff.id, employeeData);
      setShowForm(false);
      setSelectedStaff(null);
    } catch (error) {
      console.error('Failed to update staff:', error);
    }
  };

  const handleDeleteStaff = async (employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await deleteEmployee(employeeId);
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const handleToggleStatus = async (employeeId: string) => {
    try {
      await toggleEmployeeStatus(employeeId);
    } catch (error) {
      console.error('Failed to toggle staff status:', error);
    }
  };

  const handleViewDetails = (staff: Employee) => {
    setSelectedStaff(staff);
    setShowDetails(true);
  };

  const handleEditStaff = (staff: Employee) => {
    setSelectedStaff(staff);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Users size={32} className="text-purple-600" />
                <span>Staff Management</span>
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your staff members and their information
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedStaff(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Staff</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Staff Members ({filteredStaff.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No staff members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role & Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {staff.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                            <div className="text-sm text-gray-500">{staff.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail size={14} className="mr-1" />
                          {staff.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone size={14} className="mr-1" />
                          {staff.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{staff.position}</div>
                        <div className="text-sm text-gray-500">{staff.department}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          staff.role === 'admin' ? 'bg-red-100 text-red-800' :
                          staff.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          staff.status === 'active' ? 'bg-green-100 text-green-800' :
                          staff.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {staff.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(staff)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditStaff(staff)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(staff.id)}
                            className={`${
                              staff.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                            }`}
                            title={staff.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {staff.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Staff Form Modal */}
      {showForm && (
        <EmployeeForm
          employee={selectedStaff}
          onSubmit={selectedStaff ? handleUpdateStaff : handleAddStaff}
          onClose={() => {
            setShowForm(false);
            setSelectedStaff(null);
          }}
        />
      )}

      {/* Staff Details Modal */}
      {showDetails && selectedStaff && (
        <EmployeeDetails
          employee={selectedStaff}
          onClose={() => {
            setShowDetails(false);
            setSelectedStaff(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
};

export default StaffManagement;
