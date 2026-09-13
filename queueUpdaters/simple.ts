import { Grade, LearnlibState, QueueUpdater, CardState } from "../types";

export class SimpleQueueUpdater implements QueueUpdater {
  type = "queueUpdater" as const;
  id = "simple";
  name = {
    EN: "Simple Queue",
    NL: "Eenvoudige Wachtrij",
  };
  description = {
    EN: "Remove learned cards and shift failed cards by random position",
    NL: "Verwijder beheerste kaarten en schuif foute kaarten willekeurig op in de wachtrij",
  };

  updateQueue(state: LearnlibState, card: CardState, grade: Grade): LearnlibState {
    let queue = [...state.queue];
    if (grade === Grade.Incorrect) {
      // Remove any existing instance of this card first, then insert at random position
      queue = queue.filter((k) => k.id !== card.id);
      const pos = Math.floor(Math.random() * (queue.length + 1));
      queue.splice(pos, 0, card);
    } else {
      queue = queue.filter((k) => k.id !== card.id);
    }
    return {
      ...state,
      queue,
    };
  }
}

export { SimpleQueueUpdater as simpleQueueUpdater, SimpleQueueUpdater as simpleWachtrij };
