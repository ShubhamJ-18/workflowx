import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'WorkFlowX — Smart Team Task & Project Management Platform',
  description:
    'Secure full-stack team project management platform featuring transparent task dependency analysis and rule-based risk engines.',
  keywords: [
    'project management',
    'task risk engine',
    'dependency graph',
    'team collaboration',
    'kanban board',
    'rbac',
  ],
  authors: [{ name: 'WorkFlowX Team' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
