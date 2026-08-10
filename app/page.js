import { redirect } from 'next/navigation';
import { getAuthUser } from '../lib/auth.js';

export default async function HomePage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'TECHNICIAN') {
    redirect('/technician');
  } else if (user.role === 'ACCOUNTANT') {
    redirect('/finance');
  } else {
    redirect('/dashboard');
  }
}
