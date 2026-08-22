import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beacon | Skills-first work for every ability',
  description: 'An accessible, skills-first job pairing platform for Legazpi City and Albay.',
  applicationName: 'Beacon Job Pairing Platform'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
