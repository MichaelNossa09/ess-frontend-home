import { Component, Input, ViewChild } from '@angular/core';
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
export class Chart1Component {
  @ViewChild("chart1") chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  @Input() IPEMax : any[] = [];
  @Input() IPSMax : any[] = [];
  @Input() CPEMax : any[] = [];
  @Input() CPSMax : any[] = [];
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
          name: "IPE Max",
          data: this.IPEMax
        },
        {
          name: "IPS Max",
          data: this.IPSMax
        },
        {
          name: "CPE Max",
          data: this.CPEMax
        },
        {
          name: "CPS Max",
          data: this.CPSMax
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
