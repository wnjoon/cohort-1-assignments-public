'use client';

import { useState, useEffect } from 'react';

interface ErrorState {
  message: string | null;
  type: 'error' | 'success' | 'info';
}

let errorSetter: ((error: ErrorState | null) => void) | null = null;

export function showError(message: string, type: 'error' | 'success' | 'info' = 'error') {
  if (errorSetter) {
    errorSetter({ message, type });
  }
}

export function showSuccess(message: string) {
  if (errorSetter) {
    errorSetter({ message, type: 'success' });
  }
}

export function clearError() {
  if (errorSetter) {
    errorSetter(null);
  }
}

export function ErrorMessage() {
  const [error, setError] = useState<ErrorState | null>(null);

  useEffect(() => {
    errorSetter = setError;
    return () => {
      errorSetter = null;
    };
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!error) {
    return null;
  }

  const bgColor = {
    error: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200',
  }[error.type];

  const textColor = {
    error: 'text-red-800',
    success: 'text-green-800',
    info: 'text-blue-800',
  }[error.type];

  return (
    <div className={`border rounded-md p-4 ${bgColor}`}>
      <div className="flex justify-between items-start">
        <p className={`${textColor} flex-1`}>{error.message}</p>
        <button
          onClick={() => setError(null)}
          className={`${textColor} hover:opacity-70 ml-4 text-xl leading-none`}
        >
          ×
        </button>
      </div>
    </div>
  );
}
