import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class HydrationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a hydration error
    const isHydrationError = error.message.includes('hydration') || 
                            error.message.includes('Text content does not match') ||
                            error.message.includes('Expected server HTML to contain');
    
    if (isHydrationError) {
      console.warn('Hydration error caught and handled:', error.message);
      return { hasError: true, error };
    }
    
    // Re-throw non-hydration errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HydrationErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Force a re-render by updating a key or state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="space-y-4">
                <div>
                  <h3 className="font-semibold text-yellow-800">Display Issue Detected</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    There was a minor display issue. This usually happens on mobile devices during page refresh.
                  </p>
                </div>
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
