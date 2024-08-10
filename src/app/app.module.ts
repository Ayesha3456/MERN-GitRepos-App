import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    CommonModule
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
  bootstrap: []
})
export class AppModule { }
