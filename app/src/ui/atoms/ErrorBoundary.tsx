import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

const fallbackStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: '#f55',
  maxWidth: 400,
  margin: '80px auto',
}

const messageStyle: React.CSSProperties = {
  color: '#aaa',
  fontSize: 13,
  marginTop: 8,
  lineHeight: 1.5,
}

const buttonStyle: React.CSSProperties = {
  marginTop: 20,
  padding: '10px 24px',
  borderRadius: 8,
  border: '1px solid #444',
  background: '#1a1a1a',
  color: '#eee',
  fontSize: 14,
  cursor: 'pointer',
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={fallbackStyle}>
            <h2 style={{ margin: 0 }}>Algo salió mal</h2>
            <p style={messageStyle}>
              {this.state.error?.message || 'Ocurrió un error inesperado.'}
            </p>
            <p style={{ ...messageStyle, color: '#666' }}>
              Si el problema persiste, recargá la página.
            </p>
            <button style={buttonStyle} onClick={this.handleReset}>
              Reintentar
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
