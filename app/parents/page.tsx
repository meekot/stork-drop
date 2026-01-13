import { cookies } from 'next/headers';
import WishlistApp from '../../components/WishlistApp';
import ParentLogin from './ParentLogin';

export default function ParentsPage() {
  const isAuthed = cookies().get('storkdrop_parent')?.value === '1';

  if (!isAuthed) {
    return <ParentLogin />;
  }

  return <WishlistApp isParentView={true} />;
}
