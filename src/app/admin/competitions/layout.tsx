import Navbar from '@/components/Navbar';
import AdminFooter from '@/components/AdminFooter';

export default function AdminCompetitionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <AdminFooter />
    </div>
  );
}
