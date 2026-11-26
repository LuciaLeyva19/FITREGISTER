import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../core/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="acceso">
      <section class="acceso-formulario">
        <div class="contenido-acceso">

          <p class="marca-acceso">FIT<span>REGISTER</span></p>

          <h1>Iniciar sesión</h1>

          <p class="texto-secundario">
            Accede a tu panel de entrenador.
          </p>

          <form (ngSubmit)="login()" #form="ngForm">

            <div class="campo">
              <label for="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                name="correo"
                [(ngModel)]="email"
                autocomplete="username"
                required
              >
            </div>

            <div class="campo">
              <label for="contrasena">Contraseña</label>

              <div class="campo-contrasena">
                <input
                  id="contrasena"
                  [type]="show ? 'text' : 'password'"
                  name="contrasena"
                  [(ngModel)]="password"
                  autocomplete="current-password"
                  required
                >

                <button
                  type="button"
                  (click)="show = !show"
                >
                  {{ show ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>
            </div>

            <button
              class="boton-entrar"
              type="submit"
              [disabled]="form.invalid"
            >
              Iniciar sesión
            </button>

            <p role="status" class="error">
              {{ message }}
            </p>

          </form>

          <p class="enlace-acceso">
            ¿Aún no tienes cuenta?
            <a routerLink="/registro">Crear cuenta</a>
          </p>

          <div class="cuenta-prueba">
            <strong>Cuenta de prueba</strong>
            <p>Correo: <code>demo@fitregister.test</code></p>
            <p>Contraseña: <code>FitDemo2026</code></p>
          </div>

        </div>
      </section>

      <div class="foto-acceso" aria-hidden="true"></div>
    </main>
  `
})
export class LoginComponent {

  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  show = false;
  message = '';

  login(): void {
    if (this.session.login(this.email, this.password)) {
      void this.router.navigateByUrl('/inicio');
    } else {
      this.message = 'Revisa el correo y la contraseña de la cuenta de prueba.';
    }
  }
}