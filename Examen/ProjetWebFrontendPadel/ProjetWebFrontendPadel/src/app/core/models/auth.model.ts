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
}
