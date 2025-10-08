import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private url = 'http://3.238.158.1:3000/api';

  constructor(private http: HttpClient) {}

  public getSucursal() {
    return this.http.get(`${this.url}/sucursales`);
  }

  public getSucursalCompleta(param: string) {
    return this.http.get(`${this.url}/sucursales/detalle/${param}`);
  }

  public getSucursalbyId(id: number) {
    return this.http.get(`${this.url}/sucursales/${id}`);
  }

  public postSucursal(elemento: any) {
    return this.http.post(`${this.url}/sucursales`, elemento);
  }

  public putSucursal(id: number, elemento: any) {
    return this.http.put(`${this.url}/sucursales`, elemento);
  }

  public patchSucursal(id: number, elemento: any) {
    return this.http.patch(`${this.url}/sucursales`, elemento);
  }

  public deleteSucursal(id: number) {
    return this.http.delete(`${this.url}/sucursales/${id}`);
  }

  public getAsientos() {
    return this.http.get(`${this.url}/asientos`);
  }

  public getAsientosbyId(id: number) {
    return this.http.get(`${this.url}/asientos/${id}`);
  }

  public postAsientos(elemento: any) {
    return this.http.post(`${this.url}/asientos`, elemento);
  }

  public putAsientos(id: number, elemento: any) {
    return this.http.put(`${this.url}/asientos`, elemento);
  }

  public patchAsientos(id: number, elemento: any) {
    return this.http.patch(`${this.url}/asientos`, elemento);
  }

  public deleteAsientos(id: number) {
    return this.http.delete(`${this.url}/asientos/${id}`);
  }

  public getHorarios() {
    return this.http.get(`${this.url}/horarios`);
  }

  public getHorariosbyId(id: number) {
    return this.http.get(`${this.url}/horarios`);
  }

  public postHorarios(elemento: any) {
    return this.http.post(`${this.url}/horarios`, elemento);
  }

  public putHorarios(id: number, elemento: any) {
    return this.http.put(`${this.url}/horarios/${id}`, elemento);
  }

  public patchHorarios(id: number, elemento: any) {
    return this.http.patch(`${this.url}/horarios/${id}`, elemento);
  }

  public deleteHorarios(id: number) {
    return this.http.delete(`${this.url}/horarios/${id}`);
  }
}
