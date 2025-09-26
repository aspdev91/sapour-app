import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import SignIn from './components/SignIn';
import Home from './routes/Home';
import UsersRoutes from './routes/users';
import TemplatesRoutes from './routes/templates';
import ExperimentsRoutes from './routes/experiments';
import ReportsRoutes from './routes/reports';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user?.hasAccess) {
    return <SignIn />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users/*" element={<UsersRoutes />} />
        <Route path="/templates/*" element={<TemplatesRoutes />} />
        <Route path="/experiments/*" element={<ExperimentsRoutes />} />
        <Route path="/reports/*" element={<ReportsRoutes />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <AppContent />
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  );
}

export default App;
