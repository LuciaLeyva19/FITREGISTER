import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../core/session.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="acceso">
      <section class="acceso-formulario">
        <div class="contenido-acceso">

          <p class="marca-acceso">FIT<span>REGISTER</span></p>

          <h1>Crear cuenta</h1>

          <p class="texto-secundario">
            Crea tu perfil de entrenador en FITREGISTER.
          </p>

          <form (ngSubmit)="register()" #form="ngForm">

            <div class="campo">
              <label for="nombre">Nombre completo</label>
              <input
                id="nombre"
                name="nombre"
                [(ngModel)]="name"
                required
                minlength="2"
                maxlength="80"
              >
            </div>

            <div class="campo">
              <label for="correo-registro">Correo electrónico</label>
              <input
                id="correo-registro"
                name="correo"
                [(ngModel)]="email"
                type="email"
                required
              >
            </div>

            <div class="campo">
              <label for="pass1">Contraseña</label>
              <input
                id="pass1"
                name="pass1"
                [(ngModel)]="password"
                type="password"
                minlength="8"
                required
              >
              <small>Usa al menos 8 caracteres.</small>
            </div>

            <div class="campo">
              <label for="pass2">Confirmar contraseña</label>
              <input
                id="pass2"
                name="pass2"
                [(ngModel)]="confirm"
                type="password"
                required
              >
            </div>

            <button
              class="boton-entrar"
              type="submit"
              [disabled]="form.invalid"
            >
              Crear cuenta
            </button>

            <p role="status" class="error">
              {{ message }}
            </p>

          </form>

          <p class="enlace-acceso">
            ¿Ya tienes cuenta?
            <a routerLink="/login">Iniciar sesión</a>
          </p>

          <p class="texto-secundario">
            Registro de prueba. Usa datos ficticios.
          </p>

        </div>
      </section>

      <div class="foto-acceso" aria-hidden="true"></div>
    </main>
  `
})
export class RegisterComponent {

  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirm = '';
  message = '';

  register(): void {
    const name = this.name.trim().replace(/\s+/g, ' ');

    if (name.length < 2) {
      this.message = 'Escribe un nombre de al menos dos caracteres.';
      return;
    }

    if (this.password !== this.confirm) {
      this.message = 'Las contraseñas deben coincidir.';
      return;
    }

    this.session.register(name);
    void this.router.navigateByUrl('/inicio');
  }
}