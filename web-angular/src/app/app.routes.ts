import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

import { LoginComponent } from './features/login.component';
import { RegisterComponent } from './features/register.component';
import { HomeComponent } from './features/home.component';

import { ClientesComponent } from './clientes/clientes.component';
import { RutinasComponent } from './rutinas/rutinas.component';
import { SeguimientoComponent } from './seguimiento/seguimiento.component';
import { PlanProComponent } from './plan-pro/plan-pro.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'registro',
    component: RegisterComponent
  },
  {
    path: 'inicio',
    component: HomeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'clientes',
    component: ClientesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'rutinas',
    component: RutinasComponent,
    canActivate: [authGuard]
  },
  {
    path: 'seguimiento',
    component: SeguimientoComponent,
    canActivate: [authGuard]
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'inicio'
  },
  {
    path: 'plan-pro',
    component: PlanProComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'inicio'
  },

];
