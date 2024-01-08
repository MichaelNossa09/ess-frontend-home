import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';

type ChartOptions = {
  series: any;
  chart: any;
  xaxis: any;
  stroke: any;
  tooltip: any;
  dataLabels: any;
};

@Component({
  selector: 'app-chart1',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './chart1.component.html',
  styleUrl: './chart1.component.css'
})
export class Chart1Component{
  @ViewChild("chart1") chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  @Input() poola : any[] = [];
  @Input() poolb : any[] = [];
  @Input() fechas : any[] = [];

  constructor(){ 
    setTimeout(() => {
      this.generateChart()
    }, 1000)
  }

  generateChart(){
    this.chartOptions = {
      series: [
        {
          name: "% Disponibilidad Pool A",
          data: this.poola
        },
        {
          name: "% Disponibilidad Pool B",
          data: this.poolb
        }
      ],
      chart: {
        height: 300,
        type: "area"
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth"
      },
      xaxis: {
        type: "datetime",
        categories: this.fechas
      },
      tooltip: {
        x: {
          format: "dd/MM/yy HH:mm"
        }
      }
    };
  }
}
