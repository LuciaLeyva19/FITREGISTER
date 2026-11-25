import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private readonly sessionKey = 'fitregister-sesion-demo';
  private readonly nameKey = 'fitregister-perfil-demo';

  readonly active = signal(
    sessionStorage.getItem(this.sessionKey) === 'activa'
  );

  readonly name = signal(
    sessionStorage.getItem(this.nameKey)?.trim() || 'Lucía'
  );

  login(email: string, password: string): boolean {
    const valid =
      email.trim().toLowerCase() === 'demo@fitregister.test' &&
      password === 'FitDemo2026';

    if (!valid) {
      return false;
    }

    sessionStorage.setItem(this.sessionKey, 'activa');
    sessionStorage.removeItem(this.nameKey);

    this.name.set('Lucía');
    this.active.set(true);

    return true;
  }

  register(name: string): void {
    sessionStorage.setItem(this.sessionKey, 'activa');
    sessionStorage.setItem(this.nameKey, name);

    this.name.set(name);
    this.active.set(true);
  }

  logout(): void {
    sessionStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.nameKey);

    this.active.set(false);
    this.name.set('Lucía');
  }
}
