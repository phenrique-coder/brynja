export type SlideChapterId =
  | 'vision'
  | 'onboarding'
  | 'analysis'
  | 'results'
  | 'adoption';

export type SlideVisualKind =
  | 'cover'
  | 'problem'
  | 'chainmail'
  | 'local-first'
  | 'journey-map'
  | 'stage-auth'
  | 'stage-authz'
  | 'stage-new-scan'
  | 'layer-sca'
  | 'layer-static'
  | 'layer-probes'
  | 'guardrails'
  | 'layer-ai'
  | 'stage-reports'
  | 'stage-governance'
  | 'stage-history-audit'
  | 'daily-routine'
  | 'pilot-roadmap';

export interface SlideHighlightPoint {
  readonly title: string;
  readonly description: string;
}

export interface SlideTechnicalBlock {
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface SlideDemoLink {
  readonly label: string;
  readonly href: string;
}

export interface PresentationSlide {
  readonly id: string;
  readonly number: number;
  readonly chapter: SlideChapterId;
  readonly kicker: string;
  readonly title: string;
  readonly subtitle: string;
  readonly analogy?: string;
  readonly visual: SlideVisualKind;
  readonly highlights: readonly SlideHighlightPoint[];
  readonly itDetails: SlideTechnicalBlock;
  readonly presenterNotes: string;
  readonly estimatedTime: string;
  readonly demoLink?: SlideDemoLink;
}

export interface SlideChapterMeta {
  readonly id: SlideChapterId;
  readonly label: string;
}
