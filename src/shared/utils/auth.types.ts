export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
}