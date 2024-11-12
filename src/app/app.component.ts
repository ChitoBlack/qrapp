import { Component } from '@angular/core';
import { NavController, MenuController, AlertController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  isLoggedIn = false;

  constructor(
    private navCtrl: NavController,
    private menu: MenuController,
    private afAuth: AngularFireAuth,
    private router: Router,
    private alertController: AlertController
  ) {
    // Verificar el estado de autenticación al cargar la aplicación
    this.afAuth.authState.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
  }

  navigateTo(page: string) {
    this.menu.close();
    this.navCtrl.navigateForward(`/${page}`);
  }

  async loginOrLogout() {
    if (!this.isLoggedIn) {
      this.router.navigateByUrl('/login'); // Redirigir a la página de login
    } else {
      await this.logout();
    }
  }


  async logout() {
    await this.afAuth.signOut();
    this.showAlert('Cerrar Sesión', 'Has cerrado sesión con éxito.');
    this.isLoggedIn = false;
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
