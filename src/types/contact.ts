export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  token: string;
}

export interface TurnstileResult {
  success: boolean;
}
