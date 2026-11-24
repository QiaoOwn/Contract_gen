import {defaultRoute} from '@/constant';
import {redirect} from 'next/navigation';

export default async function Page() {
  redirect(defaultRoute);
}
