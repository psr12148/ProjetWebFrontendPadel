export type TypeMatch   = 'PRIVE' | 'PUBLIC';
export type StatutMatch = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE';
export type StatutParticipation = 'EN_ATTENTE' | 'CONFIRME' | 'LIBERE';

export interface Participation {
  id: number;
  membreId: number;
  membreNom: string;
  membreMatricule: string;
  statut: StatutParticipation;
  montantDu: number;
  montantPaye: number;
  payee: boolean;
}

export interface Match {
  id: number;
  terrainId: number;
  terrainNom: string;
  siteId: number;
  siteNom: string;
  organisateurId: number;
  organisateurNom: string;
  dateHeure: string;
  typeMatch: TypeMatch;
  statut: StatutMatch;
  montantTotal: number;
  soldeRestant: number;
  nombreJoueursConfirmes: number;
  placesDisponibles: number;
  complet: boolean;
  participations: Participation[];
}

export interface MatchRequest {
  terrainId: number;
  dateHeure: string;
  typeMatch: TypeMatch;
}

export interface ParticipationRequest {
  membreId: number;
}
