'use client';

export function ApiDebug() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded text-xs z-50">
      <div>API URL: {process.env.NEXT_PUBLIC_API_URL || 'UNDEFINED'}</div>
      <div>Socket URL: {process.env.NEXT_PUBLIC_SOCKET_URL || 'UNDEFINED'}</div>
      <div>Environment: {process.env.NODE_ENV}</div>
    </div>
  );
}