import { Card, Language } from '@/types';

export function cardTitle(card: Card, language: Language): string {
  return language === 'bs' ? card.titleBs?.trim() || card.titleEn : card.titleEn;
}

export function cardDescription(card: Card, language: Language): string | undefined {
  return language === 'bs'
    ? card.descriptionBs?.trim() || card.descriptionEn
    : card.descriptionEn;
}
