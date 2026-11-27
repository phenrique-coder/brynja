import type { PresentationDecksByLocale } from '../models/presentation.models';
import { EN_PRESENTATION_DECK } from './brynja-slides.en';
import { ES_PRESENTATION_DECK } from './brynja-slides.es';
import { PT_BR_PRESENTATION_DECK } from './brynja-slides.pt-BR';

export const PRESENTATION_DECKS: PresentationDecksByLocale = {
  'pt-BR': PT_BR_PRESENTATION_DECK,
  en: EN_PRESENTATION_DECK,
  es: ES_PRESENTATION_DECK,
};
