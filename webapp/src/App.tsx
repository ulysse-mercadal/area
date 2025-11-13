import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './App.css';

import { Landing } from './Views/Landing/Landing';
import { WorkflowDashboard } from './Views/WorkflowDashboard/Dashboard';
import { CredentialsDashboard } from './Views/CredentialsDashboard/Dashboard';
import { Profile } from './Views/Profile/Profile';
import CreateWorkflow from './Views/CreateWorkflow/CreateWorkflow';
import { Login } from './Views/Login/Login';
import { Register } from './Register';
import { AuthProvider } from './Context/AuthContext';
import { ProtectedRoute } from './Context/ProtectedRoute';
import { Authorize } from './Views/Login/Authorize';
import AdminUsers from './Views/Admin/Users';

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Landing />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
          path: "/login/authorize",
          element: <Authorize />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/workflows",
      element: (
        <ProtectedRoute>
          <WorkflowDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/workflow/:id",
      element: (
        <ProtectedRoute>
          <CreateWorkflow />
        </ProtectedRoute>
      ),
    },
    {
      path: "/credentials",
      element: (
        <ProtectedRoute>
          <CredentialsDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/credentials/create",
      element: (
        <ProtectedRoute>
          <CreateWorkflow />
        </ProtectedRoute>
      ),
    },
    {
      path: "/account",
      element: (
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/users",
      element: (
        <ProtectedRoute role={'ADMIN'}>
          <AdminUsers />
        </ProtectedRoute>
      ),
    },
    {
      path:"/settings/services",
      element: (
        <ProtectedRoute>
          <CredentialsDashboard/>
        </ProtectedRoute>
      ),
    }
  ]);
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
