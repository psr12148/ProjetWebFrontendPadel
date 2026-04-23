export interface Site {
  id: number;
  nom: string;
  adresse: string;
  nbTerrains: number;
  heureOuverture: string;
  heureFermeture: string;
  anneeApplicable: number;
  nombreCreneauxParJour?: number;
}

export interface SiteRequest {
  nom: string;
  adresse: string;
  nbTerrains: number;
  heureOuverture: string;
  heureFermeture: string;
  anneeApplicable: number;
}
