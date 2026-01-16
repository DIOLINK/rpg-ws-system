import React from 'react';
import { Navigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Puedes loguear el error si lo deseas
    // console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Navigate to="/error" replace />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
