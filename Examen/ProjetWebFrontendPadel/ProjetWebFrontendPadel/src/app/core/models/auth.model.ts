export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  membreId: number;
  matricule: string;
  email: string;
  nom: string;
  prenom: string;
  typeLabel: string;
  admin: boolean;
  soldeImpaye?: number;        // montant dû, 0 ou absent si à jour
  penaliteJusquA?: string;     // date "2026-05-30", absent si aucune pénalité
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
}
