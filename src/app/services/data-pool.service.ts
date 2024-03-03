import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataPoolService {
  private dataPoolsSubject = new BehaviorSubject<any>([]);
  private dataSubject = new BehaviorSubject<any>([]);
  constructor() {}
}
