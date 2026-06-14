import type { ObjectId } from 'mongodb';

export type UserDocument = {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export type UpdateUserInput = Partial<Pick<CreateUserInput, 'name' | 'email'>>;

export type ListUsersQuery = {
  page?: number;
  limit?: number;
};

export type UserIdParams = {
  id: string;
};

export type ListUsersResult = {
  data: PublicUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type UserRepository = {
  create(data: CreateUserInput): Promise<PublicUser>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findById(id: string): Promise<PublicUser | null>;
  list(query?: ListUsersQuery): Promise<ListUsersResult>;
  update(id: string, data: UpdateUserInput): Promise<PublicUser | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
};
