import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '48px', margin: '0', color: '#5c6ac4' }}>404</h1>
      <h2 style={{ fontSize: '20px', margin: '12px 0', color: '#202223' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#6d7175', maxWidth: '360px', marginBottom: '20px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/admin"
        style={{
          backgroundColor: '#5c6ac4',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '500',
          fontSize: '14px',
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
