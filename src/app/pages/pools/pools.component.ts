import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EncryptService } from '../../services/encrypt.service';
import { Observable, Subject, Subscription, interval } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { Chart1Component } from '../../caroussel/pools/chart1/chart1.component';
import { Chart2Component } from '../../caroussel/pools/chart2/chart2.component';
import { DataPoolService } from '../../services/data-pool.service';
import {MatTableDataSource, MatTableModule} from '@angular/material/table'
import { MatPaginatorModule, MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';

export interface PeriodicElement {
  position: number;
  capacidad_pool_a: any;
  capacidad_disponible_pool_a: any;
  porcentaje_disponible_pool_a: any;
  capacidad_pool_b: any;
  capacidad_disponible_pool_b: any;
  porcentaje_disponible_pool_b: any;
  v_fisica_1: any;
  v_fisica_2: any;
  registrado_por: any;
  created_at: any;
  aprobado_por: any;
}

@Component({
  selector: 'app-pools',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, Chart1Component, Chart2Component, MatTableModule, MatPaginatorModule],
  providers: [{provide: MatPaginatorIntl, useClass: PoolsComponent}],
  templateUrl: './pools.component.html',
  styleUrl: './pools.component.css'
})


export class PoolsComponent implements OnDestroy, MatPaginatorIntl{
  // MatPaginatorIntl
  changes = new Subject<void>();
  firstPageLabel = $localize`Primera Página`;
  itemsPerPageLabel = $localize`Items por página:`;
  lastPageLabel = $localize`Última Página`;
  nextPageLabel = 'Siguiente Página';
  previousPageLabel = 'Página Anterior';
  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return $localize`Página 1 de 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return $localize`Página ${page + 1} de ${amountPages}`;
  }

  //Paginator
  @ViewChild(MatPaginator) paginator: MatPaginator;
  //Variables
  displayedColumns: string[] = ['position', 'Capacidad Pool A', 'Disponible Pool A', '% Disponible Pool A', 'Capacidad Pool B', '% Disponible Pool B', 'Verificación 1', 'Verificación 2', 'Regístrado Por', 'Fecha de Registro', 'Aprobado Por'];
  dataSource: any;
  dataCargada: boolean = false;
  pools:any = [];
  modal: boolean = false;
  user:any;
  success: boolean = true;
  public archivo1: any;
  public archivo2: any;
  public previsualizacion: string;
  public previsualizacion2: string;
  poola: any = [];
  poolb: any = [];
  fechas: any = [];
  bandera: boolean = false;
  notificaciones: any;
  // FormGroup
  poolsForm = new FormGroup({
    capacidad_pool_a: new FormControl('', [Validators.required]),
    capacidad_disponible_pool_a: new FormControl('', [Validators.required]),
    capacidad_pool_b: new FormControl('', [Validators.required]),
    capacidad_disponible_pool_b: new FormControl('', [Validators.required]),
    v_fisica_1: new FormControl(null, [Validators.required]),
    v_fisica_2: new FormControl(null, [Validators.required]),
    registrado_por: new FormControl('', [Validators.required]),
  });

  private menuSubscription: Subscription;
  public hasClickedMenu: boolean = true;

  constructor(private http: HttpClient,
    private service: EncryptService, private sanitizer: DomSanitizer, private dataPoolService: DataPoolService){
      this.menuSubscription = this.service.menuClick$.subscribe(() => {
        this.hasClickedMenu = !this.hasClickedMenu;
      });
      this.service.getUser().subscribe({
        next: (res) => {
          this.user = res.data;
          this.GetPools();
        },
        error: (error) => {
          console.log(error.error);
        }
      });

      interval(10000 * 6).subscribe(() => {
        this.service.getNotificaciones().subscribe({
          next: (res) => {
            this.dataPoolService.updateData(res.slice().reverse());
          },
          error: (error) => {
            console.log(error.error.error);  
          }
        });
      });
      
    }

   ngOnDestroy(): void {
    this.menuSubscription.unsubscribe();
   }

  public baseUrl = 'http://127.0.0.1:8000';
  private poolsUrl = 'http://127.0.0.1:8000/api/pool';

  GetPools(){
    const authToken = this.service.getDecryptedToken();
    if(this.user){
      this.poolsForm.get('registrado_por')?.setValue(this.user.name);
    }
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });

    this.http.get<PeriodicElement[]>(`${this.poolsUrl}`, { headers }).subscribe({
      next: (res) => {
        if (res) {
          this.pools = res;
          var ELEMENT_DATA : PeriodicElement[] = [];
          for (let i = 0; i < res.length; i++) {
            const item = res[i];
            item.position = i + 1;
            
            this.poola.push(item.porcentaje_disponible_pool_a);
            this.poolb.push(item.porcentaje_disponible_pool_b);
            this.fechas.push(item.created_at);
            ELEMENT_DATA.push(item);
          }
          ELEMENT_DATA.sort((a, b) => {
            const dateA: Date = new Date(a.created_at);
            const dateB: Date = new Date(b.created_at);

            return dateB.getTime() - dateA.getTime();
          })
          this.dataPoolService.setDataPools(res);
          this.dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);  
          this.dataSource.paginator = this.paginator;
          if(ELEMENT_DATA.length > 0){
            this.dataCargada = true;
          }
        }
      },
      error: (error) => {
        alert(error.error.error)
      },
    });
  }

    onPools(){
      if (this.poolsForm.valid) {
        const authToken = this.service.getDecryptedToken();
        const headers = new HttpHeaders({
          Authorization: `Bearer ${authToken}`,
        });
        const formData = new FormData();

        var capacidadPoolA = this.poolsForm.get('capacidad_pool_a')?.value;
        var capacidadDisponiblePoolA = this.poolsForm.get('capacidad_disponible_pool_a')?.value;
        var capacidadPoolB = this.poolsForm.get('capacidad_pool_b')?.value;
        var capacidadDisponiblePoolB = this.poolsForm.get('capacidad_disponible_pool_b')?.value;
        this.bandera = false;

        if ((capacidadPoolA !== null && capacidadPoolA !== undefined) && (capacidadDisponiblePoolA !== null && capacidadDisponiblePoolA !== undefined)) {
          if(parseInt(capacidadDisponiblePoolA, 10) > parseInt(capacidadPoolA, 10)){
            this.bandera = true;  
          }else{
            formData.append('capacidad_pool_a', capacidadPoolA);
            formData.append('capacidad_disponible_pool_a', capacidadDisponiblePoolA);
          }
        }
        
        if((capacidadPoolB !== null && capacidadPoolB !== undefined) && (capacidadDisponiblePoolB !== null && capacidadDisponiblePoolB !== undefined)){
          if(parseInt(capacidadDisponiblePoolB, 10) > parseInt(capacidadPoolB, 10)){
            this.bandera=true;
          }else{
            formData.append('capacidad_pool_b', capacidadPoolB);
            formData.append('capacidad_disponible_pool_b', capacidadDisponiblePoolB);
          }
        }
        
        formData.append('v_fisica_1', this.archivo1);
        formData.append('v_fisica_2', this.archivo2);

        if(this.user){
          formData.append('registrado_por', this.user.name);
        }
        
        if(this.bandera){
          alert('Las capacidades disponibles no pueden ser mayor a la capacidad total.');
        }else{
          this.http.post<any>(`${this.poolsUrl}`, formData, { headers })
            .subscribe({
              next: (res) => {
                if (res) {
                  this.poolsForm.reset();
                  this.modal = false;
                  this.GetPools();
                  if(this.user.correo == 'auxsistemas@banasan.com.co'){
                    this.service.postNotificacion('../../../assets/axel.png', this.user.name, 'ha agregado un nuevo registro de pools').subscribe({
                      next: (res) => {
                        this.service.getNotificaciones().subscribe({
                          next: (res) => {
                            this.dataPoolService.updateData(res.slice().reverse());
                          },
                          error: (error) => {
                            console.log(error.error.error);  
                          }
                        })
                      },
                      error: (error) => {
                        console.log(error.error.error);
                      }
                    })
                  }else if(this.user.correo == 'auxdesarrollo@agrobanacaribe.con'){
                    this.service.postNotificacion('../../../assets/michael.png', this.user.name, 'ha agregado un nuevo registro de pools').subscribe({
                      next: (res) => {
                        this.service.getNotificaciones().subscribe({
                          next: (res) => {
                            this.dataPoolService.updateData(res);
                          },
                          error: (error) => {
                            console.log(error.error.error);  
                          }
                        })
                      },
                      error: (error) => {
                        console.log(error.error.error);
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
                console.log(error.error.error);
                
              },
            });
        }
      } else {
        alert('Verifica los Campos, por favor.');
      }
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
              base: reader.result
            });
          };

          reader.onerror = error => {
            resolve({
              base: null
            });
          };
        });
      } catch (e) {
        return null;
      }
    };

    handleFileInput1(event: any): void {
      const archivoCapturadao = event.target.files[0];
      this.extraerBase64(archivoCapturadao).then((imagen : any) => {
        this.previsualizacion = imagen.base;
      })
      this.archivo1 = archivoCapturadao; 
    }

    handleFileInput2(event: any): void {
      const archivoCapturado = event.target.files[0];
      this.extraerBase64(archivoCapturado).then((imagen : any) => {
        this.previsualizacion2 = imagen.base;
      })
      this.archivo2 = archivoCapturado;
    }


    getImageUrl(imagePath: string): string {
      return `${this.baseUrl}/storage/${imagePath}`;
    }

    activeModal(){
      this.modal = true;
    }
    desactiveModal(){
      this.modal = false;
      this.GetPools();
    }
}
