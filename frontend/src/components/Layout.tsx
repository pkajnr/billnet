import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { NotificationToast } from './NotificationToast';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setShowFooter(!token);
  }, []);

  return (
    <div className="app-shell flex flex-col min-h-screen text-(--apple-ink)">
      <Navbar />
      <main className="grow">
        {children}
      </main>
      {showFooter && <Footer />}
      <NotificationToast />
    </div>
  );
}
