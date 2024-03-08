import { Component, OnDestroy, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { Subject, Subscription } from 'rxjs';
import { EncryptService } from '../../services/encrypt.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { DataPoolService } from '../../services/data-pool.service';
import { Chart2Component } from '../../caroussel/conectividad/chart2/chart2.component';
import { Chart1Component } from '../../caroussel/conectividad/chart1/chart1.component';

export interface ConectityElements {
  position: number;
  estado_conectate: any;
  velocidad_conectate: any;
  estado_itelkom: any;
  velocidad_itelkom: any;
  alertas_graves: any;
  observaciones_graves: any;
  alertas_medias: any;
  observaciones_medias: any;
  alertas_menores: any;
  observaciones_menores: any;
  alertas_totales: any;
  informacion_workspace: any;
  pico_entrante_max_itelkom: any;
  pico_salida_max_itelkom: any;
  pico_entrante_max_conectate: any;
  pico_salida_max_conectate: any;
  temperatura_datacenter: any;
  registrado_por: any;
  v_fisica_1: any;
  v_fisica_2: any;
  created_at: any;
  aprobado_por: any;
}

@Component({
  selector: 'app-conectividad',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    HttpClientModule,
    ReactiveFormsModule,
    Chart2Component,
    Chart1Component,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: ConectividadComponent }],
  templateUrl: './conectividad.component.html',
  styleUrl: './conectividad.component.css',
})
export class ConectividadComponent implements MatPaginatorIntl{
  // MatPaginatorIntl
  changes = new Subject<void>();
  firstPageLabel = $localize`Primera Página`;
  itemsPerPageLabel = $localize`Items por página:`;
  lastPageLabel = $localize`Última Página`;
  nextPageLabel = 'Siguiente Página';
  previousPageLabel = 'Página Anterior';

  public baseUrl = 'http://ess:8090/';
  public conectividadUrl = 'http://ess:8090/api/conectividad';


  
  isAdmin = false;


  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return $localize`Página 1 de 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return $localize`Página ${page + 1} de ${amountPages}`;
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  //Variables
  displayedColumns: string[] = [
    'position',
    'Estado Conectate',
    'Velocidad Conectate',
    'Estado Itelkom',
    'Velocidad Itelkom',
    'Alertas Graves',
    'Observaciones Graves',
    'Alertas Medias',
    'Observaciones Medias',
    'Alertas Menores',
    'Observaciones Menores',
    'Alertas Totales',
    'Workspace',
    'I - Pico Entrante Max',
    'I - Pico Salida Max',
    'C - Pico Entrante Max',
    'C - Pico Salida Max',
    'Temp Datacenter',
    'Verificación 1',
    'Verificación 2',
    'Regístrado Por',
    'Fecha Registro',
    'Aprobado Por',
  ];



  dataSource: any;
  user: any;
  conectividades: any;
  dataCargada: boolean = false;
  public archivo1: any;
  public archivo2: any;
  public previsualizacion: string;
  public previsualizacion2: string;
  modal: boolean = false;
  IPEMax: any = [];
  IPSMax: any = [];
  CPEMax: any = [];
  CPSMax: any = [];
  fechas: any = [];


  conectsForm = new FormGroup({
    estado_conectate: new FormControl('', [Validators.required]),
    velocidad_conectate: new FormControl('', [Validators.required]),
    estado_itelkom: new FormControl('', [Validators.required]),
    velocidad_itelkom: new FormControl('', [Validators.required]),
    alertas_graves: new FormControl(0, [Validators.required]),
    observaciones_graves: new FormControl('Ninguna', [Validators.required]),
    alertas_medias: new FormControl(0, [Validators.required]),
    observaciones_medias: new FormControl('Ninguna', [Validators.required]),
    alertas_menores: new FormControl(0, [Validators.required]),
    observaciones_menores: new FormControl('Ninguna', [Validators.required]),
    alertas_totales: new FormControl(0, [Validators.required]),
    informacion_workspace: new FormControl('Sin Novedades', [Validators.required]),
    pico_entrante_max_itelkom: new FormControl(null, [Validators.required]),
    pico_salida_max_itelkom: new FormControl('', [Validators.required]),
    pico_entrante_max_conectate: new FormControl(null, [Validators.required]),
    pico_salida_max_conectate: new FormControl('', [Validators.required]),
    temperatura_datacenter: new FormControl(20, [Validators.required]),
    v_fisica_1: new FormControl('', [Validators.required]),
    v_fisica_2: new FormControl('', [Validators.required]),
    registrado_por: new FormControl(null, [Validators.required]),
    aprobado_por: new FormControl('Pendiente', [Validators.required]),
  });

  constructor(
    private service: EncryptService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private dataPoolService: DataPoolService) {
   this.service.getUser().subscribe({
      next: (res) => {
        this.user = res.data;
        if (this.user.rol == 'Admin') {
          this.isAdmin = true;
        }
        this.GetConectitys();
      },
      error: (error) => {
        console.error(error);
      },
    });

    this.conectsForm.get('alertas_graves')?.valueChanges.subscribe(() => {
      this.actualizarAlertasTotales();
    });

    this.conectsForm.get('alertas_medias')?.valueChanges.subscribe(() => {
      this.actualizarAlertasTotales();
    });

    this.conectsForm.get('alertas_menores')?.valueChanges.subscribe(() => {
      this.actualizarAlertasTotales();
    });
  }
  actualizarAlertasTotales(){
    const alertasGraves = this.conectsForm.get('alertas_graves')?.value ?? 0;
    const alertasMedias = this.conectsForm.get('alertas_medias')?.value ?? 0;
    const alertasMenores = this.conectsForm.get('alertas_menores')?.value ?? 0;

    const alertasTotales = alertasGraves + alertasMedias + alertasMenores;

    this.conectsForm.get('alertas_totales')?.setValue(alertasTotales);
  }


  aprobar(element: any) {
    const authToken = this.service.getDecryptedToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });
    const requestBody = {
      aprobado_por: this.user.name
    };
    
    this.http.put<any>(`${this.conectividadUrl}/${element.id}`, requestBody, { headers }).subscribe({
      next: (res) => {
        if (res) {
          this.GetConectitys();
          if (this.user.correo == 'seguridadinformatica@banasan.com.co') {
            this.service
              .postNotificacion(
                '../../../assets/Jersson.jpg',
                this.user.name,
                'Ha aprobado un registro de Conectividad'
              )
              .subscribe({
                next: (res) => {
                  this.service.getNotificaciones().subscribe({
                    next: (res) => {
                      document.querySelector('.alert-success-aprob')?.classList.add('show');
                      setTimeout(function() {
                        document.querySelector('.alert-success-aprob')?.classList.remove('show');
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



  GetConectitys() {
    const authToken = this.service.getDecryptedToken();
    if (this.user) {
      this.conectsForm.get('registrado_por')?.setValue(this.user.name);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });

    this.http
      .get<ConectityElements[]>(`${this.conectividadUrl}`, { headers })
      .subscribe({
        next: (res) => {
          if (res) {
            this.conectividades = res;

            var ELEMENT_DATA: ConectityElements[] = [];
            for (let i = 0; i < res.length; i++) {
              const item = res[i];
              item.position = i + 1;

              this.IPEMax.push(item.pico_entrante_max_itelkom);
              this.IPSMax.push(item.pico_salida_max_itelkom);
              this.CPEMax.push(item.pico_entrante_max_conectate);
              this.CPSMax.push(item.pico_salida_max_conectate);
              this.fechas.push(item.created_at);
              ELEMENT_DATA.push(item);
            }
            ELEMENT_DATA.sort((a, b) => {
              const dateA: Date = new Date(a.created_at);
              const dateB: Date = new Date(b.created_at);
              return dateB.getTime() - dateA.getTime();
            });
            this.dataSource = new MatTableDataSource<ConectityElements>(
              ELEMENT_DATA
            );
            this.dataSource.paginator = this.paginator;
            if (ELEMENT_DATA.length > 0) {
              this.dataCargada = true;
            }
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

  onConect() {
    if (this.conectsForm.valid) {
      const authToken = this.service.getDecryptedToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${authToken}`,
      });
      const formData = new FormData();
      const estado_conectate = this.conectsForm.get('estado_conectate')?.value;
      const velocidad_conectate = this.conectsForm.get('velocidad_conectate')?.value;
      const estado_itelkom = this.conectsForm.get('estado_itelkom')?.value;
      const velocidad_itelkom = this.conectsForm.get('velocidad_itelkom')?.value;
      const alertas_graves = this.conectsForm.get('alertas_graves')?.value;
      const observaciones_graves = this.conectsForm.get('observaciones_graves')?.value;
      const alertas_medias = this.conectsForm.get('alertas_medias')?.value;
      const observaciones_medias = this.conectsForm.get('observaciones_medias')?.value;
      const alertas_menores = this.conectsForm.get('alertas_menores')?.value;
      const observaciones_menores = this.conectsForm.get('observaciones_menores')?.value;
      const alertas_totales = this.conectsForm.get('alertas_totales')?.value;
      const informacion_workspace = this.conectsForm.get('informacion_workspace')?.value;
      const pico_entrante_max_itelkom = this.conectsForm.get('pico_entrante_max_itelkom')?.value;
      const pico_salida_max_itelkom = this.conectsForm.get('pico_salida_max_itelkom')?.value;
      const pico_entrante_max_conectate = this.conectsForm.get('pico_entrante_max_conectate')?.value;
      const pico_salida_max_conectate = this.conectsForm.get('pico_salida_max_conectate')?.value;
      const temperatura_datacenter = this.conectsForm.get('temperatura_datacenter')?.value;


      formData.append('estado_conectate', estado_conectate ?? '');
      formData.append('velocidad_conectate', velocidad_conectate ?? '');
      formData.append('estado_itelkom', estado_itelkom ?? '');
      formData.append('velocidad_itelkom', velocidad_itelkom ?? '');
      formData.append('alertas_graves', alertas_graves?.toString() ?? '');
      formData.append('observaciones_graves', observaciones_graves ?? '');
      formData.append('alertas_medias', alertas_medias?.toString() ?? '');
      formData.append('observaciones_medias', observaciones_medias ?? '');
      formData.append('alertas_menores', alertas_menores?.toString() ?? '');
      formData.append('observaciones_menores', observaciones_menores ?? '');
      formData.append('alertas_totales', alertas_totales?.toString() ?? '');
      formData.append('informacion_workspace', informacion_workspace ?? '');
      formData.append('pico_entrante_max_itelkom', pico_entrante_max_itelkom ?? '');
      formData.append('pico_salida_max_itelkom', pico_salida_max_itelkom ?? '');
      formData.append('pico_entrante_max_conectate', pico_entrante_max_conectate ?? '');
      formData.append('pico_salida_max_conectate', pico_salida_max_conectate ?? '');
      formData.append('temperatura_datacenter', temperatura_datacenter?.toString() ?? '');
      formData.append('v_fisica_1', this.archivo1);
      formData.append('v_fisica_2', this.archivo2);
      if(this.user){
        formData.append('registrado_por', this.user.name);
      }


      
      this.http.post<any>(`${this.conectividadUrl}`, formData, { headers })
        .subscribe({
          next: (res) => {
            if (res) {
              this.conectsForm.reset();
              this.GetConectitys();            
              if(this.user.correo == 'auxsistemas@banasan.com.co'){
                this.service.postNotificacion('../../../assets/axel.png', this.user.name, 'ha agregado un nuevo registro de Conectividad').subscribe({
                  next: (res) => {
                    this.service.getNotificaciones().subscribe({
                      next: (res) => {
                        console.log(res);
                      },
                      error: (error) => {
                        console.error(error.error.error);  
                      }
                    })
                  },
                  error: (error) => {
                    console.error(error.error.error);
                  }
                })
              }else if(this.user.correo == 'auxdesarrollo@agrobanacaribe.con'){
                this.service.postNotificacion('../../../assets/michael.png', this.user.name, 'ha agregado un nuevo registro de Conectividad').subscribe({
                  next: (res) => {
                    this.service.getNotificaciones().subscribe({
                      next: (res) => {
                        console.log(res);
                        
                      },
                      error: (error) => {
                        console.error(error.error.error);  
                      }
                    })
                  },
                  error: (error) => {
                    console.error(error.error.error);
                  }
                })
              }
              document.querySelector('.alert-success')?.classList.add('show');
              setTimeout(function() {
                document.querySelector('.alert-success')?.classList.remove('show');
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
    this.GetConectitys();
  }
}