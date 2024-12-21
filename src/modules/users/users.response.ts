export class UserResponse {
  id: string;
  email: string;
  createdAt?: Date;

  constructor(partial: Partial<UserResponse>) {
    Object.assign(this, partial);
  }

  static fromDocument(doc: any): UserResponse {
    return new UserResponse({
      id: doc._id.toString(),
      email: doc.email,
      createdAt: doc.createdAt,
    });
  }
}
