import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpStatusCode, } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
@Injectable()
export class GlobalHttpInterceptor implements HttpInterceptor {
    constructor(
        private router: Router,
        private spinnerService: NgxSpinnerService
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = '';
                if (error.error instanceof ErrorEvent) {
                    // Get client-side error
                    errorMessage = error.error.message;
                } else {
                    // Get service-side error
                    if (error.status === HttpStatusCode.Unauthorized) {
                        localStorage.clear();
                        this.router.navigate(['/login']);
                    }
                    errorMessage = error.error;
                }

                this.spinnerService.hide();
                return throwError(() => errorMessage);
            })
        );
    }
}
