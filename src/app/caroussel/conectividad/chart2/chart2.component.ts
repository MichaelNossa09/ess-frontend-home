import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { DataPoolService } from '../../../services/data-pool.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EncryptService } from '../../../services/encrypt.service';

type ChartOptions = {
  series: any;
  chart: any;
  responsive: any;
  labels: any;
};

@Component({
  selector: 'app-chart2',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './chart2.component.html',
  styleUrl: './chart2.component.css'
})

export class Chart2Component{

  @ViewChild("chart2") chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  data: any;
  contPendiente = 0;
  contAprobado = 0;
  estado: any;

  constructor(private dataPoolService: DataPoolService, private service: EncryptService, private http: HttpClient) {
    this.GetConectitys();
  }

  GetConectitys() {
    const authToken = this.service.getDecryptedToken();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });

    this.http.get<any>('http://ess:8090/api/conectividad', { headers })
      .subscribe({
        next: (res) => {
          if (res) {
            this.data = res;
            for (const item of this.data) {
              if (item.aprobado_por) {
                this.contAprobado++;
              } else {
                this.contPendiente++;
              }
            }
            setTimeout(() => {
              this.generateChart();
            }, 1000)
            
          }
        },
        error: (error) => {
          console.log(error.error);
        },
      });
  }

  generateChart(){
    this.chartOptions = {
      series: [this.contAprobado, this.contPendiente],
      chart: {
        width: 380,
        type: "pie"
      },
      labels: ["Aprobados", "Pendientes"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    };
  }
}
