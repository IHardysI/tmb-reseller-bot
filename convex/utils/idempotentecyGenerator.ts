import { v4 as uuidv4 } from 'uuid';

export const generateIdempotencyKey = (): string => {
  return uuidv4();
};
