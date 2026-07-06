import PropTypes from 'prop-types';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import { Login } from './components/Login';
import NavBar from './components/NavBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Lazy loading para páginas
const AssignCharacterPage = lazy(() => import('./pages/AssignCharacterPage'));
const BecomeDMPage = lazy(() =>
  import('./pages/BecomeDMPage').then((m) => ({ default: m.BecomeDMPage })),
);
const CreateCharacterPage = lazy(() => import('./pages/CreateCharacterPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const GameLobby = lazy(() =>
  import('./pages/GameLobby').then((m) => ({ default: m.GameLobby })),
);
const GamePage = lazy(() =>
  import('./pages/GamePage').then((m) => ({ default: m.GamePage })),
);
const Profile = lazy(() =>
  import('./pages/Profile').then((m) => ({ default: m.Profile })),
);

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse text-xl">Cargando...</div>
    </div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/lobby" /> : <Login />}
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/lobby"
            element={
              <PrivateRoute>
                <GameLobby />
              </PrivateRoute>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <PrivateRoute>
                <GamePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-character"
            element={
              <PrivateRoute>
                <CreateCharacterPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/assign-character/:gameId"
            element={
              <PrivateRoute>
                <AssignCharacterPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/become-dm"
            element={
              <PrivateRoute>
                <BecomeDMPage />
              </PrivateRoute>
            }
          />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="App">
            <NavBar />
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
