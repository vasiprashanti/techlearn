import UserSidebarLayout from '../../../components/Dashboard/UserSidebarLayout';
import Certification from '../../Learn/Certification';

export default function FreeCertifications() {
  return (
    <UserSidebarLayout
      maxWidthClass="max-w-none"
      contentClassName="max-w-none"
      mainClassName="pt-0 px-0 pb-0 sm:px-0 lg:px-0"
    >
      <Certification />
    </UserSidebarLayout>
  );
}
