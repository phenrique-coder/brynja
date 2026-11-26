import { GovernanceView } from '@/features/scans/components/GovernanceView';

export default async function GovernancePage({
  searchParams,
}: {
  searchParams: Promise<{ scanId?: string }>;
}) {
  const params = await searchParams;
  return <GovernanceView initialScanId={params.scanId} />;
}
