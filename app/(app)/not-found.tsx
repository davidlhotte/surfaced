import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '72px', margin: '0', color: '#5c6ac4' }}>404</h1>
      <h2 style={{ fontSize: '24px', margin: '16px 0', color: '#333' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#666', maxWidth: '400px', marginBottom: '24px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/admin"
        style={{
          backgroundColor: '#5c6ac4',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '500',
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
