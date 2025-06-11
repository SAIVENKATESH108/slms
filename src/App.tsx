import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { auth } from './firebase/config';

// Components
import Layout from './components/layout/Layout';
import Loader from './components/ui/Loader';
import AuthGuard from './pages/auth/AuthGuard';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import FlatView from './pages/FlatView';
import ClientDetail from './pages/ClientDetail';
import ClientManagement from './pages/ClientManagement';
import ClientAppointment from './pages/ClientAppointment';
import Finances from './pages/Finances';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// import StaffManagement from './pages/StaffManagement';
import Flats from './pages/Flats';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import AdminDashboard from './components/dashboard/AdminDashboard';
import ManagerDashboard from './components/dashboard/ManagerDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';

// Auth Context
import { useAuthStore } from './stores/authStore';
import { useAuthSession } from './hooks/AuthSession';
import { useUserStore } from './stores/userStore';
import { initializeTheme } from './stores/themeStore';
import { ThemeProvider } from './components/theme/ThemeProvider';

function App() {
  const { isAuthenticated, loading, user } = useAuthSession();
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Initialize theme on app start
    initializeTheme();
    
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Fetch user settings including role after user is set
        await useUserStore.getState().fetchUserSettings();
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          element: <AuthGuard requireAuth={true}><Dashboard /></AuthGuard>,
        },
        {
          path: 'dashboard',
          element: <AuthGuard requireAuth={true}><Dashboard /></AuthGuard>,
        },
          {
            path: 'admin',
            element: (
              <AuthGuard requireAuth={true}>
                <ProtectedRoute allowedRoles={['admin']} />
              </AuthGuard>
            ),
            children: [
              {
                index: true,
                element: <AdminDashboard />
              }
            ]
          },
          {
            path: 'manager',
            element: (
              <AuthGuard requireAuth={true}>
                <ProtectedRoute allowedRoles={['admin', 'manager']} />
              </AuthGuard>
            ),
            children: [
              {
                index: true,
                element: <ManagerDashboard />
              }
            ]
          },
          {
            path: 'employee',
            element: (
              <AuthGuard requireAuth={true}>
                <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']} />
              </AuthGuard>
            ),
            children: [
              {
                index: true,
                element: <EmployeeDashboard />
              }
            ]
          },
        {
          path: 'clients',
          element: <AuthGuard requireAuth={true}><Clients /></AuthGuard>,
        },
        {
          path: 'client-management',
          element: <AuthGuard requireAuth={true}><ClientManagement /></AuthGuard>,
        },
        {
          path: 'appointment',
          element: <AuthGuard requireAuth={true}><ClientAppointment /></AuthGuard>,
        },
        {
          path: 'flats',
          element: <AuthGuard requireAuth={true}><Flats /></AuthGuard>,
        },
        {
          path: 'flats/:flatId',
          element: <AuthGuard requireAuth={true}><FlatView /></AuthGuard>,
        },
        {
          path: 'clients/:clientId',
          element: <AuthGuard requireAuth={true}><ClientDetail /></AuthGuard>,
        },
        {
          path: 'finances',
          element: <AuthGuard requireAuth={true}><Finances /></AuthGuard>,
        },
        {
          path: 'reports',
          element: <AuthGuard requireAuth={true}><Reports /></AuthGuard>,
        },
        {
          path: 'settings',
          element: <AuthGuard requireAuth={true}><Settings /></AuthGuard>,
        },

        //{
        //  path: 'staff',
        //  element: <AuthGuard requireAuth={true}><StaffManagement /></AuthGuard>,
        //},
        {
          path: '403',
          element: <div className="p-6 text-center text-red-600 text-xl font-semibold">403 - Access Denied</div>,
        },
      ],
    },
    {
      path: '/login',
      element: !user ? <Login /> : <Navigate to="/" />,
    },
    {
      path: '/register',
      element: !user ? <Register /> : <Navigate to="/" />,
    },
  ]);

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;