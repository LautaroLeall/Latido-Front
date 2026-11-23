import React from 'react';
import HardButton from './HardButton';
import { FullScreenMessage } from './FullScreen';

/**
 * Atrapa errores inesperados de renderizado o fallos al cargar chunks lazy
 * tras un nuevo despliegue, evitando pantallas en blanco.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    const msg = String(error?.message || '');
    const isChunkError =
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg);
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error, info) {
    console.error('[LATIDO] Error de interfaz capturado:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <FullScreenMessage
        stamp={this.state.isChunkError ? 'ACTUALIZACIÓN' : 'ERROR'}
        stampVariant={this.state.isChunkError ? 'amber' : 'red'}
        shadow={this.state.isChunkError ? 'ink' : 'red'}
        title={this.state.isChunkError ? 'Hay una versión nueva disponible' : 'Algo salió mal en esta pantalla'}
        actions={
          <>
            <HardButton size="sm" variant="teal" onClick={this.handleReload}>
              Recargar página
            </HardButton>
            <HardButton as="a" href="/" size="sm" variant="secondary">
              Volver al inicio
            </HardButton>
          </>
        }
      >
        {this.state.isChunkError
          ? 'Actualizamos Latido mientras navegabas. Recargá la página para continuar con la última versión.'
          : 'Ocurrió un error inesperado al mostrar esta vista. Recargá la página para reintentar.'}
      </FullScreenMessage>
    );
  }
}
