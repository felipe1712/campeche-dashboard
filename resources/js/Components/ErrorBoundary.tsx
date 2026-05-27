import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.toString() };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger">
          <strong>Error renderizando componente:</strong> {this.state.errorMsg}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
