import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import React from 'react';
import pkg from '../../../package.json';
import { PRESENTATION_DECKS } from '@/features/presentation/data';
import {
  PresentationAccessDeniedCard,
  PresentationAuthRequiredView,
} from '@/features/presentation/components/PresentationAccessDeniedCard';
import { PresentationDeckView } from '@/features/presentation/components/PresentationDeckView';
import { getServerContainer } from '@/server/application/container';
import { resolvePresentationAccess } from '@/server/http/presentation-access';
import { GITHUB_SESSION_COOKIE } from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apresentação Executiva — Brynja',
  description:
    'Apresentação interativa da plataforma Brynja para a equipe de TI e Diretoria.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PresentationPage() {
  const cookieStore = await cookies();
  const rawSessionCookie = cookieStore.get(GITHUB_SESSION_COOKIE)?.value;
  const session = getServerContainer().sessionCodec.unseal(rawSessionCookie);

  if (!session) {
    return <PresentationAuthRequiredView />;
  }

  const allowed = await resolvePresentationAccess(session);
  if (!allowed) {
    return <PresentationAccessDeniedCard login={session.login} />;
  }

  return (
    <PresentationDeckView
      decks={PRESENTATION_DECKS}
      appVersion={pkg.version}
    />
  );
}
