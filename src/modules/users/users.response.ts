export class UserResponse {
    id: string;
    email: string;
    createdAt?: Date;
    role?: string;

    constructor(partial: Partial<UserResponse>) {
        Object.assign(this, partial);
    }

    static fromDocument(doc: any): UserResponse {
        return new UserResponse({
            id: doc.id,
            email: doc.email,
            createdAt: doc.createdAt,
            role: doc.role || 'user' // Default role if not specified
        });
    }
}
