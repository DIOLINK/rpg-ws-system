import PropTypes from 'prop-types';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import { Login } from './components/Login';
import NavBar from './components/NavBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import CreateCharacterPage from './pages/CreateCharacterPage';
import ErrorPage from './pages/ErrorPage';
import { GameLobby } from './pages/GameLobby';
import { GamePage } from './pages/GamePage';
import { Profile } from './pages/Profile';

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
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <NavBar />
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
