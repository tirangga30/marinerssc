import { redirect } from 'next/navigation';

export default function AdminSeasonsRedirect() {
  redirect('/admin/competitions');
}
