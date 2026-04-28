import { UsuarioPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioPayload;
    }
  }
}
