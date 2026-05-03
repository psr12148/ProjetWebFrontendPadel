export interface TauxOccupationSite {
  siteId: number;
  siteNom: string;
  creneauxTotal: number;
  creneauxOccupes: number;
  tauxOccupation: number;
}

export interface DashboardStats {
  // Chiffres globaux
  totalSites: number;
  totalTerrains: number;
  totalMembres: number;
  totalMatchsAujourdhui: number;
  totalMatchsSemaine: number;

  // Matchs
  matchsEnAttente: number;
  matchsConfirmes: number;
  matchsPublicsDisponibles: number;
  matchsPrivesIncomplets: number;

  // Paiements
  chiffreAffairesJour: number;
  chiffreAffairesSemaine: number;
  membresAvecSoldeImpaye: number;
  totalSoldesImpayes: number;

  // Alertes J-1
  alertesMatchsPrivesIncomplets: number;
  alertesPlacesNonPayees: number;

  // Taux d'occupation
  tauxOccupationParSite: TauxOccupationSite[];

  // Membres
  membresAvecPenalite: number;
}
