import React from 'react';
import { BadgeMeta } from '../registries/finding-registries';

export interface StatusPillProps {
  meta: BadgeMeta;
  suffix?: string;
}

export function StatusPill({ meta, suffix }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${meta.classes}`}
    >
      {meta.label}
      {suffix ? <span className="opacity-80">{suffix}</span> : null}
    </span>
  );
}
