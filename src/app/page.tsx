import { redirect } from 'next/navigation';

/** Root → default workspace (Process 1 grid). */
export default function Home() {
  redirect('/manifests');
}
