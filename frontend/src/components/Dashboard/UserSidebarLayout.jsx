import Sidebar from './Sidebar';

export default function UserSidebarLayout({
  children,
  maxWidthClass = 'max-w-7xl',
  contentClassName = '',
  mainClassName = '',
}) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />

      <main className={`min-w-0 flex-1 px-4 pb-10 pt-24 sm:px-6 lg:px-8 ${mainClassName}`}>
        <div className={`mx-auto w-full ${maxWidthClass} ${contentClassName}`.trim()}>
          {children}
        </div>
      </main>
    </div>
  );
}
