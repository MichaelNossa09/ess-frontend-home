import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { DataPoolService } from '../../../services/data-pool.service';

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

  constructor(private dataPoolService: DataPoolService) {
    this.dataPoolService.dataPools$.subscribe((data) => {
      this.contAprobado=0;
      this.contPendiente=0;
      for (const item of data) {
        if (item.aprobado_por) {
          this.contAprobado++;
        } else {
          this.contPendiente++;
        }
      }
    });
    setTimeout(() => {
      this.generateChart();
    }, 1000)
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
