import { ScanReportView } from '@/features/scans/components/ScanReportView';

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScanReportView scanId={id} />;
}
