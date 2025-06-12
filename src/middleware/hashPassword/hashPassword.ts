import bcryptjs from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcryptjs.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcryptjs.compare(password, hash);
}