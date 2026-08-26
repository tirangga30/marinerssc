import Navbar from '@/components/Navbar';
import AdminFooter from '@/components/AdminFooter';

export default function AdminMembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <AdminFooter />
    </>
  );
}
