import { useState, useEffect } from 'react';
import { Employee, EmployeeFormData } from '../types/Employees';
import { useAuthSession } from './AuthSession';
import { firestoreService } from '../services/firestoreService';
import { createStaffUser } from '../services/staffService';

export const useEmployees = () => {
  const { user, isAdmin, hasPermission } = useAuthSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load employees on mount or when user changes
  useEffect(() => {
    if (user?.uid) {
      loadEmployees();
    } else {
      setEmployees([]);
    }
  }, [user]);

  const loadEmployees = async () => {
    if (!user?.uid) {
      setEmployees([]);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const staffData = await firestoreService.getStaff(user.uid);
      // Map Firestore data to Employee type if needed
      const staffEmployees: Employee[] = staffData.map((staff) => ({
        id: staff.id,
        employeeId: staff.employeeId || '',
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        dateOfBirth: staff.dateOfBirth || '',
        age: staff.age || 0,
        address: staff.address || {},
        salary: staff.salary || {},
        aadharNumber: staff.aadharNumber || '',
        panNumber: staff.panNumber || '',
        bankDetails: staff.bankDetails || {},
        role: staff.role || 'employee',
        department: staff.department || '',
        position: staff.position || '',
        joiningDate: staff.joiningDate || '',
        emergencyContact: staff.emergencyContact || {},
        documents: staff.documents || {},
        status: staff.status || 'active',
        permissions: staff.permissions || [],
        createdAt: staff.createdAt || '',
        updatedAt: staff.updatedAt || '',
        createdBy: staff.createdBy || ''
      }));

      setEmployees(staffEmployees);
    } catch (err) {
      setError('Failed to load employees');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: EmployeeFormData & { password: string }): Promise<void> => {
    if (!isAdmin() && !hasPermission('manage:employees')) {
      throw new Error('Insufficient permissions to add employees');
    }
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await createStaffUser(employeeData);

      // After creation, reload employees list
      await loadEmployees();
    } catch (err) {
      setError('Failed to add employee');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (employeeId: string, employeeData: Partial<EmployeeFormData>): Promise<void> => {
    if (!isAdmin() && !hasPermission('manage:employees')) {
      throw new Error('Insufficient permissions to update employees');
    }
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedData = {
        ...employeeData,
        age: employeeData.dateOfBirth
          ? new Date().getFullYear() - new Date(employeeData.dateOfBirth).getFullYear()
          : undefined,
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.updateService(user.uid, employeeId, updatedData);
      await loadEmployees();
    } catch (err) {
      setError('Failed to update employee');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (employeeId: string): Promise<void> => {
    if (!isAdmin()) {
      throw new Error('Only admins can delete employees');
    }
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await firestoreService.deleteService(user.uid, employeeId);
      await loadEmployees();
    } catch (err) {
      setError('Failed to delete employee');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeStatus = async (employeeId: string): Promise<void> => {
    if (!isAdmin() && !hasPermission('manage:employees')) {
      throw new Error('Insufficient permissions to change employee status');
    }
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      const newStatus = employee.status === 'active' ? 'inactive' : 'active';

      await firestoreService.updateService(user.uid, employeeId, {
        updatedAt: new Date().toISOString(),
      });
      await loadEmployees();
    } catch (err) {
      setError('Failed to update employee status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchEmployees = (searchTerm: string): Employee[] => {
    if (!searchTerm.trim()) return employees;

    const term = searchTerm.toLowerCase();
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.employeeId.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term) ||
      emp.position.toLowerCase().includes(term)
    );
  };

  const filterEmployees = (filters: {
    status?: 'active' | 'inactive' | 'terminated';
    role?: 'employee' | 'manager' | 'admin';
    department?: string;
  }): Employee[] => {
    return employees.filter(emp => {
      if (filters.status && emp.status !== filters.status) return false;
      if (filters.role && emp.role !== filters.role) return false;
      if (filters.department && emp.department !== filters.department) return false;
      return true;
    });
  };

  const getEmployeeById = (employeeId: string): Employee | undefined => {
    return employees.find(emp => emp.id === employeeId);
  };

  const getEmployeeStats = () => {
    const total = employees.length;
    const active = employees.filter(emp => emp.status === 'active').length;
    const inactive = employees.filter(emp => emp.status === 'inactive').length;
    const managers = employees.filter(emp => emp.role === 'manager').length;
    const admins = employees.filter(emp => emp.role === 'admin').length;

    const departments = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      inactive,
      managers,
      admins,
      departments
    };
  };

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    searchEmployees,
    filterEmployees,
    getEmployeeById,
    getEmployeeStats,
    refreshEmployees: loadEmployees
  };
};
