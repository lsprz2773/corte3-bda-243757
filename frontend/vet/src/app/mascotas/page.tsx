import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SearchClient from './SearchClient';

export const metadata = {
  title: 'Mascotas — Clínica Veterinaria',
};

export default async function MascotasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  return <SearchClient />;
}
