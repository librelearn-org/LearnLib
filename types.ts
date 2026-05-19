

export type Lijst = LijstItem[]
export type LijstItem = {
  vraag: string,
  antwoord: string,
  listSessionItemAnswerHistories?: {
    round: number,
    goed: boolean,
    antwoord: string,
    // deze gebruiken we niet maar houden typescript blij zonder 
    // dat we de lijst moeten omzetten naar een andere vorm
    // zelfde geldt voor de naam van deze ding
    listSessionItem?: any,
    listSessionItemId?: any,
    id?: string
  }[],
  roundCount?: number, // niet geinit
  id?: string // een voorstel voor de interne id van de lijst

  // ts blij houden
  listSession?: any,
  listSessionId?: any,
  listId?: any,
}
export type LearnConfig = {
  staAlternatieveAntwoordenToe?: boolean // `antwoord een / antwoord twee` syntax
  multikeuzeWisselAlternatieveAntwoordenAf?: boolean // wisle bij meerkeuze vragen met de vorige syntax de antwoorden af
  gebruikAlternatieveVragenAfwisselendWanneerBeschikbaar?: boolean, // `vraag1/vraag2` syntax, wissel deze af als deze optie aanstaat. JE MOET HIERVOOR DE CURRENTITEM SYNTAX GEBRUIKEN OM HET OP TE HALEN!! (werkt vanaf 1.1.0)
  gebruikSeed?: string, // anders random
  fuckFransen?: boolean, // handig voor grieks of als je geen zin hebt om het te leren
  // dislectieVrindeleik?: boolean, // maakt `é -> ee` en `è -> e` etc // TODO: dit werkt nog niet!!
  optioneleAntwoordDelen?: boolean, // maakt het dat delen van antwoorden optioneel zijn, dus alles wat in `(...)` staat.
  enkelWoordAlternatieveAntwoorden?: boolean, // `woord/anderwoord` syntax
  griekseLettersLatijnsKans?: number, // 0 -> 100 kans dat griekse letters worden omgezet naar latijnse equivalenten, dus `α -> a` etc. Handig als je grieks leert maar geen zin hebt om te leren typen.
}
export let defaultLearnConfig: LearnConfig = {
  staAlternatieveAntwoordenToe: true,
  multikeuzeWisselAlternatieveAntwoordenAf: true,
  gebruikAlternatieveVragenAfwisselendWanneerBeschikbaar: true,
  fuckFransen: false,
  // dislectieVrindeleik: false,
  optioneleAntwoordDelen: true,
  enkelWoordAlternatieveAntwoorden: true,
  griekseLettersLatijnsKans: 0,
}