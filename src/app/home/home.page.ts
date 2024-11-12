import { Component, OnInit } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { AlertController, NavController, MenuController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { RoomService, Room } from 'src/services/room.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  // Propiedades necesarias para usuario y escaneo
  username: string = '';
  userEmail: string = '';
  userProfileImageUrl: string = 'assets/profile-placeholder.png';
  scanActive = false;
  isLoggedIn = false;
  map!: GoogleMap;
  showMap = false;
  apiKey = 'TU_API_KEY_DE_GOOGLE_MAPS'; // Reemplaza con tu API Key de Google Maps

  constructor(
    private alertController: AlertController,
    private navCtrl: NavController,
    private menu: MenuController,
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private roomService: RoomService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkCameraPermission();
  }

  // Abre un cuadro de diálogo para obtener permiso y muestra el mapa
  async onGpsClick() {
    const alert = await this.alertController.create({
      header: 'Ubicación',
      message: '¿Quieres ver tu ubicación?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aceptar',
          handler: async () => {
            this.showMap = true;
            await this.initializeMapWithDelay();
          },
        },
      ],
    });
    await alert.present();
  }

  async initializeMapWithDelay() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    await this.createMap();
    await this.centerMapOnUserLocation();
  }

  async createMap() {
    const mapRef = document.getElementById('map');
    if (mapRef) {
      this.map = await GoogleMap.create({
        id: 'my-map',
        element: mapRef,
        apiKey: this.apiKey,
        config: { center: { lat: 0, lng: 0 }, zoom: 8 },
      });
    } else {
      console.error('No se pudo encontrar el elemento del mapa');
    }
  }

  async centerMapOnUserLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      if (this.map) {
        await this.map.setCamera({
          coordinate: { lat: coordinates.coords.latitude, lng: coordinates.coords.longitude },
          zoom: 14,
          animate: true,
        });
      }
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
    }
  }

  closeMap() {
    this.showMap = false;
    if (this.map) {
      this.map.destroy();
    }
  }

  async checkCameraPermission(): Promise<boolean> {
    const status = await BarcodeScanner.checkPermission({ force: true });

    if (status.granted) {
      return true;
    } else if (status.denied) {
      this.showAlert('Permiso denegado', 'Por favor, habilita el permiso de cámara en la configuración.');
      return false;
    }
    return false;
  }

  async startScan() {
    const allowed = await this.checkCameraPermission();
    if (!allowed) return;

    document.body.classList.add('scanner-active');
    this.scanActive = true;

    const result = await BarcodeScanner.startScan();
    document.body.classList.remove('scanner-active');
    this.scanActive = false;

    if (result.hasContent) {
      await this.getRoomInfo(result.content);
    } else {
      this.showAlert('Escaneo fallido', 'No se detectó contenido en el escaneo.');
    }
  }

  getRoomInfo(roomId: string) {
    this.roomService.getRoomById(roomId).subscribe(
      (roomData: Room | null) => {
        if (roomData) {
          this.showAlert(
            'Información de la sala',
            `Sala: ${roomData.roomNumber}\nProfesor: ${roomData.professor}\nHora de entrada: ${roomData.startTime}\nHora de salida: ${roomData.endTime}`
          );
        } else {
          this.showAlert('Error', 'No se encontró información para la sala especificada.');
        }
      },
      error => {
        console.error('Error al obtener información de la sala:', error);
        this.showAlert('Error', 'Hubo un problema al obtener la información de la sala.');
      }
    );
  }
  

  async stopScan() {
    await BarcodeScanner.stopScan();
    document.body.classList.remove('scanner-active');
    this.scanActive = false;
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

