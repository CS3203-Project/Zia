import { Toaster } from 'react-hot-toast';

/**
 * The single, site-themed toaster.
 *
 * Toasts used to be configured per page: dark glassmorphism on Become a Provider,
 * a dark slate panel on sign-in, unstyled defaults elsewhere, and saturated
 * green/blue banners from toastUtils. The same action looked different depending
 * on where you triggered it, and none of it matched the light orange UI.
 *
 * Mounted once at the app root so every page gets identical toasts — and so two
 * mounted toasters can never render the same toast twice.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 4000,
        // Matches the app's surfaces: white card, hairline border, soft shadow.
        style: {
          background: '#ffffff',
          color: '#111827',
          border: '1px solid #f3f4f6',
          borderRadius: '14px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 10px 30px -12px rgba(0,0,0,0.18)',
          maxWidth: '380px',
        },
        // Only the icon carries status colour, so the toast itself stays on-theme.
        success: { iconTheme: { primary: '#059669', secondary: '#ffffff' } },
        error: { iconTheme: { primary: '#dc2626', secondary: '#ffffff' }, duration: 5000 },
        loading: { iconTheme: { primary: '#ea580c', secondary: '#ffffff' } },
      }}
    />
  );
}
