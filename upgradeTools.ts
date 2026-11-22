import { CardState, Phase } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const upgradeTools = {
  upgradeCard(card: Partial<CardState> | Record<string, any>): CardState {
    const raw = card as any;
    const upgraded: CardState = {
      id: raw.id ?? "",
      question: raw.question ?? raw.vraag ?? "",
      answer: raw.answer ?? raw.antwoord ?? "",
      methodId: raw.methodId ?? raw.methodeId ?? "",
      phase: raw.phase ?? raw.fase ?? Phase.Learning,
      lastReviewed: raw.lastReviewed ? new Date(raw.lastReviewed) : new Date(),
      nextReview: raw.nextReview ? new Date(raw.nextReview) : new Date(),
      metadata: raw.metadata ?? raw.metaData ?? {},
      history: (raw.history ?? []).map((h: any) => ({
        cardId: h.cardId ?? h.kaartId ?? raw.id ?? "",
        date: h.date ? new Date(h.date) : new Date(),
        answer: h.answer ?? h.antwoord ?? "",
        grade: h.grade ?? h.goed ?? 0,
      })),
    };
    return upgraded;
  },

  upgradeList(card: Partial<CardState> | Record<string, any>): CardState {
    return this.upgradeCard(card);
  },
  scheduleIntroductions(cards: CardState[], options: {
    days: number,
    cooldown: number,
    startDate?: Date
  }) {
    const learningDays = Math.max(1, Math.ceil(options.days - options.cooldown));
    const toIntroduce = cards.length
    const cardsPerDay = Math.max(1, toIntroduce / learningDays)
    return upgradeTools.scheduleIntroductionsSimple(cards, {
      countPerDay: cardsPerDay,
      startDate: options.startDate
    })
  },
  scheduleIntroductionsSimple(cards: CardState[], options: {
    countPerDay: number,
    startDate?: Date
  }) {
    const startDate = options.startDate ?? new Date();
    return cards.map((card, i) => ({
      ...card,
      phase: Phase.NotIntroduced,
      nextReview: new Date(startDate.getTime() + Math.floor(i / options.countPerDay) * DAY_MS)
    }))
  }
};
