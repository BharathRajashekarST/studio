import { SheetFlowLogo } from '@/components/icons/logo';

export function SheetFlowHeader() {
  return (
    <header className="flex items-center space-x-3 py-4">
      <SheetFlowLogo />
      <h1 className="text-3xl font-bold text-primary">SheetFlow</h1>
    </header>
  );
}
