import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataPoolService {
  private dataPoolsSubject = new BehaviorSubject<any>([]);
  private dataSubject = new BehaviorSubject<any>([]);
  dataPools$ = this.dataPoolsSubject.asObservable();
  data$ = this.dataSubject.asObservable();
  constructor() {}

  setDataPools(data: any): void {
    this.dataPoolsSubject.next(data);
  }

  updateData(newData: any) {
    this.dataSubject.next(newData);
  }
}
