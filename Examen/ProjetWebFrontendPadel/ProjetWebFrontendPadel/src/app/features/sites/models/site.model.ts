/** Un jour de fermeture renvoyé par le backend (avec son id). */
export interface JourFermeture {
  id: number;
  date: string;        // "2026-12-25"
  motif: string | null;
}

/** Un jour de fermeture envoyé au backend (sans id). */
export interface JourFermetureRequest {
  date: string;        // "2026-12-25"
  motif: string | null;
}

export interface Site {
  id: number;
  nom: string;
  adresse: string;
  nbTerrains: number;
  heureOuverture: string;
  heureFermeture: string;
  anneeApplicable: number;
  nombreCreneauxParJour?: number;
  joursFermeture?: JourFermeture[];
}

export interface SiteRequest {
  nom: string;
  adresse: string;
  nbTerrains: number;
  heureOuverture: string;
  heureFermeture: string;
  anneeApplicable: number;
  joursFermeture: JourFermetureRequest[];
}


