export type User = {
    _id?: string,
    name: string,
    lastName: string,
    email: string,
    password: string,
    role: 'admin' | 'client'
    createdAt?: Date,
    updatedAt?: Date,
    lastLogin?: Date,
}
