import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { Component, EventEmitter } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Subject } from 'rxjs';
import { EncryptService } from '../../services/encrypt.service';
import { DomSanitizer } from '@angular/platform-browser';
import { DataPoolService } from '../../services/data-pool.service';

export interface EstatusServidorElements {
  estatus_id: any;
  servidor_id: any;
  almaceneamiento_disponible: any;
  almacenamiento_ocupado: any;
  porcentaje_disponible: any;
  cpu: any;
  memoria: any;
  consumo_de_red: any;
}

@Component({
  selector: 'app-estatus',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    HttpClientModule,
    ReactiveFormsModule,
  ],
  templateUrl: './estatus.component.html',
  styleUrl: './estatus.component.css',
})
export class EstatusComponent {
  changes = new Subject<void>();
  firstPageLabel = $localize`Primera Página`;
  itemsPerPageLabel = $localize`Items por página:`;
  lastPageLabel = $localize`Última Página`;
  nextPageLabel = 'Siguiente Página';
  previousPageLabel = 'Página Anterior';

  public baseUrl = 'https://controlriesgos.banasan.com.co:8091/itss';
  public estatusUrl = 'https://controlriesgos.banasan.com.co:8091/itss/estatus';
  public serversUrl =
    'https://controlriesgos.banasan.com.co:8091/itss/estatusServers';
  public estatusServeUrl =
    'https://controlriesgos.banasan.com.co:8091/itss/estatusDetail';

  contServer = 0;

  isAdmin = false;

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return $localize`Página 1 de 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return $localize`Página ${page + 1} de ${amountPages}`;
  }

  /*@ViewChild(MatPaginator) paginator: MatPaginator;
  //Variables
  displayedColumns: string[] = [
    'position',
    'Temp Datacenter',
    'Verificación 1',
    'Verificación 2',
    'Regístrado Por',
    'Fecha Registro',
    'Aprobado Por',
  ];

*/

  dataSource: any;
  user: any;
  estatus: any;
  servidores: any;
  nodos: any;
  dataCargada: boolean = false;
  idStatus: any;
  estadoStatus: any;
  public archivo1: any;
  public archivo2: any;
  public previsualizacion: string;
  public previsualizacion2: string;
  modal: boolean = true;
  estatusServers: any;
  servers: any[] = [];

  estatusForm = new FormGroup({
    registrado_por: new FormControl('', [Validators.required]),
    v_fisica_1: new FormControl('', [Validators.required]),
    v_fisica_2: new FormControl('', [Validators.required]),
    aprobado_por: new FormControl('Pendiente', [Validators.required]),
    estado: new FormControl('', [Validators.required]),
  });

  formulariosPorServidor: { [key: string]: FormGroup } = {};

  constructor(
    private service: EncryptService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private dataPoolService: DataPoolService,
    private fb: FormBuilder
  ) {
    this.service.getUser().subscribe({
      next: (res) => {
        this.user = res.data;
        if (this.user.rol == 'Admin') {
          this.isAdmin = true;
        }
        this.GetEstatus();
        this.GetServidores();
        this.GetNodos();
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  aprobar(element: any) {
    const authToken = this.service.getDecryptedToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });
    const requestBody = {
      aprobado_por: this.user.name,
    };

    this.http
      .put<any>(`${this.estatusUrl}/${element.id}`, requestBody, { headers })
      .subscribe({
        next: (res) => {
          if (res) {
            this.GetEstatus();
            if (this.user.correo == 'seguridadinformatica@banasan.com.co') {
              this.service
                .postNotificacion(
                  '../../../assets/Jersson.jpg',
                  this.user.name,
                  'Ha aprobado un registro de Estatus'
                )
                .subscribe({
                  next: (res) => {
                    this.service.getNotificaciones().subscribe({
                      next: (res) => {
                        document
                          .querySelector('.alert-success-aprob')
                          ?.classList.add('show');
                        setTimeout(function () {
                          document
                            .querySelector('.alert-success-aprob')
                            ?.classList.remove('show');
                        }, 3000);
                      },
                      error: (error) => {
                        console.log(error.error.error);
                      },
                    });
                  },
                  error: (error) => {
                    console.log(error.error.error);
                  },
                });
            }
          }
        },
        error: (error) => {
          console.log(error.error);
        },
      });
  }

  GetEstatus() {
    const authToken = this.service.getDecryptedToken();
    if (this.user) {
      this.estatusForm.get('registrado_por')?.setValue(this.user.name);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });

    this.http.get<any>(`${this.estatusUrl}`, { headers }).subscribe({
      next: (res) => {
        if (res) {
          this.estatus = res;
          if (res.length > 0) {
            const lastPosition = res.length - 1;
            if (res[lastPosition].estado == 'Pendiente') {
              this.idStatus = res[lastPosition].id;
              this.estatusForm.disable();

              this.http
                .get<any>(`${this.serversUrl}/${this.idStatus}`, { headers })
                .subscribe({
                  next: (res) => {
                    this.estatusServers = res.servers;

                    res.servers.map((server: any) => {
                      this.servers.push(parseInt(server.servidor_id));
                    });
                  },
                  error: (error) => {
                    console.error(error.error);
                  },
                });
            }
          }
        }
      },
      error: (error) => {
        console.error(error.error);
      },
    });
  }

  GetServidores() {
    const authToken = this.service.getDecryptedToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });

    this.http.get<any>(`${this.baseUrl}/servidor`, { headers }).subscribe({
      next: (res) => {
        if (res) {
          this.servidores = res;
        }
      },
      error: (error) => {
        console.log(error.error.error);
      },
    });
  }
  GetNodos() {
    const authToken = this.service.getDecryptedToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });

    this.http.get<any>(`${this.baseUrl}/nodo`, { headers }).subscribe({
      next: (res) => {
        if (res) {
          this.nodos = res;
        }
      },
      error: (error) => {
        console.log(error.error.error);
      },
    });
  }
  extraerBase64 = async ($event: any) => {
    try {
      const unsafeImg = window.URL.createObjectURL($event);
      const image = this.sanitizer.bypassSecurityTrustUrl(unsafeImg);
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.readAsDataURL($event);

        reader.onload = () => {
          resolve({
            base: reader.result,
          });
        };

        reader.onerror = (error) => {
          resolve({
            base: null,
          });
        };
      });
    } catch (e) {
      return null;
    }
  };

  enabled: boolean = true;
  onEstatus() {
    this.estatusForm.controls['estado'].setValue('Pendiente');
    if (this.estatusForm.valid) {
      const status = this.estatusForm.controls['estado'].value;
      const authToken = this.service.getDecryptedToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${authToken}`,
      });
      const formData = new FormData();
      formData.append('v_fisica_1', this.archivo1);
      formData.append('v_fisica_2', this.archivo2);
      if (this.user) {
        formData.append('registrado_por', this.user.name);
      }
      if (status) {
        formData.append('estado', status);
      }

      this.http
        .post<any>(`${this.estatusUrl}`, formData, { headers })
        .subscribe({
          next: (res) => {
            if (res) {
              this.previsualizacion = '';
              this.previsualizacion2 = '';
              this.enabled = true;
              document.querySelector('.alert-success')?.classList.add('show');
              setTimeout(function () {
                document
                  .querySelector('.alert-success')
                  ?.classList.remove('show');
              }, 3000);
            }
          },
          error: (error) => {
            console.error(error.error);
          },
        });
    } else {
      alert('Verifica los Campos, por favor.');
    }
  }
  onEstatusForm(serve: any): void {
    this.formulariosPorServidor[serve.id].controls['estatus_id'].setValue(
      this.idStatus
    );
    this.formulariosPorServidor[serve.id].controls['servidor_id'].setValue(
      serve.id
    );
    if (this.formulariosPorServidor[serve.id].valid) {
      const authToken = this.service.getDecryptedToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${authToken}`,
      });

      this.http
        .post<any>(
          `${this.estatusServeUrl}`,
          this.formulariosPorServidor[serve.id].value,
          { headers }
        )
        .subscribe({
          next: (res) => {
            if (res) {
              this.GetEstatus();
              document
                .querySelector('.alert-success-serve')
                ?.classList.add('show');
              setTimeout(function () {
                document
                  .querySelector('.alert-success-serve')
                  ?.classList.remove('show');
              }, 3000);
            }
            this.GetEstatus();
          },
          error: (error) => {
            console.error(error.error);
          },
        });
    } else {
      alert('Verifique los campos, por favor.');
    }
  }
  crearFormGroup(serve: any): FormGroup {
    if (!this.formulariosPorServidor[serve.id]) {
      if (
        this.servers.includes(serve.id) &&
        this.estatusServers.some(
          (estatus: any) => estatus.servidor_id == serve.id
        )
      ) {
        const estatusCorrespondiente = this.estatusServers.find(
          (estatus: any) => estatus.servidor_id == serve.id
        );
        this.formulariosPorServidor[serve.id] = this.fb.group({
          estatus_id: [
            estatusCorrespondiente.estatus_id,
            [Validators.required],
          ],
          servidor_id: [serve.id],
          almacenamiento_disponible: [
            estatusCorrespondiente.almacenamiento_disponible,
            [Validators.required],
          ],
          almacenamiento_ocupado: [
            estatusCorrespondiente.almacenamiento_ocupado,
            [Validators.required],
          ],
          cpu: [estatusCorrespondiente.cpu, [Validators.required]],
          memoria: [estatusCorrespondiente.memoria, [Validators.required]],
          consumo_de_red: [
            estatusCorrespondiente.consumo_de_red,
            [Validators.required],
          ],
        });
        this.formulariosPorServidor[serve.id].disable();
        this.contServer++;
        return this.formulariosPorServidor[serve.id];
      } else {
        this.formulariosPorServidor[serve.id] = this.fb.group({
          estatus_id: ['', [Validators.required]],
          servidor_id: [serve.id],
          almacenamiento_disponible: ['', [Validators.required]],
          almacenamiento_ocupado: ['', [Validators.required]],
          cpu: ['', [Validators.required]],
          memoria: ['', [Validators.required]],
          consumo_de_red: ['', [Validators.required]],
        });
        return this.formulariosPorServidor[serve.id];
      }
    }
    return this.formulariosPorServidor[serve.id];
  }

  ActualizarEstado() {
    if (this.servidores.length == this.contServer) {
      const formData = {
        estado: 'Finalizado',
      };
      const authToken = this.service.getDecryptedToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${authToken}`,
      });

      this.http
        .put<any>(`${this.estatusUrl}/${this.idStatus}`, formData, { headers })
        .subscribe({
          next: (res) => {
            if (res) {
              this.estadoStatus = 'Finalizado';
              this.contServer = 0;
              this.GetEstatus();
              document
                .querySelector('.alert-success-aprob')
                ?.classList.add('show');
              setTimeout(function () {
                document
                  .querySelector('.alert-success-aprob')
                  ?.classList.remove('show');
              }, 3000);
              window.location.reload();
            }
          },
          error: (error) => {
            console.error(error.error);
          },
        });
    } else {
      alert(
        'Para finalizar el Estatus es necesario terminar de adicionar todos los servidores.'
      );
    }
  }

  handleFileInput1(event: any): void {
    const archivoCapturadao = event.target.files[0];
    this.extraerBase64(archivoCapturadao).then((imagen: any) => {
      this.previsualizacion = imagen.base;
    });
    this.archivo1 = archivoCapturadao;
  }

  handleFileInput2(event: any): void {
    const archivoCapturado = event.target.files[0];
    this.extraerBase64(archivoCapturado).then((imagen: any) => {
      this.previsualizacion2 = imagen.base;
    });
    this.archivo2 = archivoCapturado;
  }

  getImageUrl(imagePath: string): string {
    return `${this.baseUrl}/storage/${imagePath}`;
  }

  activeModal() {
    this.modal = true;
  }
  desactiveModal() {
    this.modal = false;
    this.GetEstatus();
  }
}
