import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-red-900/20 border border-red-500 rounded-2xl max-w-2xl mx-auto mt-12 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Algo salió mal</h2>
          <p className="text-gray-300 mb-6">La aplicación encontró un error inesperado al renderizar esta vista.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Volver al Inicio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
