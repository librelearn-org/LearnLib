export type Lijst = LijstItem[]
export type LijstItem = {
  vraag: string,
  antwoord: string,
  goedFoutLijst: {
    round: number,
    goed: boolean,
    antwoord: string,
  }[]
  id?: string // een voorstel voor de interne id van de lijst
}
export type LearnConfig = {
  staAlternatieveAntwoordenToe?: boolean
  multikeuzeWisselAlternatieveAntwoordenAf?: boolean
  gebruikAlternatieveVragenAfwisselendWanneerBeschikbaar?: boolean,
  gebruikSeed?: string, // anders random
}
