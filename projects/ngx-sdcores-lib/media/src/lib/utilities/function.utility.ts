import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Pagination } from "../interfaces/pagination.interface";
import { NgxSpinnerService } from "ngx-spinner";
import { NgSnotifyService } from "../services";

@Injectable({
  providedIn: "root",
})
export class FunctionUtility {
  static spinnerService: NgxSpinnerService;
  static snotify: NgSnotifyService;
  /**
   *Hàm tiện ích
   */

  constructor() { }

  /**
   * Check 1 string có phải empty hoặc null hoặc undefined ko.
   */
  static checkEmpty(str: string) {
    return !str || /^\s*$/.test(str);
  }

  /**
   * Kiểm tra số lượng phần ở trang hiện tại, nếu bằng 1 thì cho pageNumber lùi 1 trang
   * @param pagination
   */
  static calculatePagination(pagination: Pagination) {
    // Kiểm tra trang hiện tại phải là trang cuối không và trang hiện tại không phải là trang 1
    if (
      pagination.pageNumber === pagination.totalPage &&
      pagination.pageNumber !== 1
    ) {
      // Lấy ra số lượng phần tử hiện tại của trang
      let currentItemQty =
        pagination.totalCount -
        (pagination.pageNumber - 1) * pagination.pageSize;

      // Nếu bằng 1 thì lùi 1 trang
      if (currentItemQty === 1) {
        pagination.pageNumber--;
      }
    }
  }

  /**
   * Thêm hoặc xóa class tác động vào id element trên DOM
   * * @param id
   * * @param className
   * * @param type => Value bằng true thì add class. Value bằng false thì xóa class
   */
  static changeDomClassList(id: string, className: string, type: boolean) {
    type
      ? document.getElementById(id)?.classList.add(className)
      : document.getElementById(id)?.classList.remove(className);
  }

  static toFormData(obj: any, form?: FormData, namespace?: string) {
    let fd = form || new FormData();
    let formKey: string;
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        // namespaced key property
        if (!isNaN(property as any)) {
          // obj is an array
          formKey = namespace ? `${namespace}[${property}]` : property;
        } else {
          // obj is an object
          formKey = namespace ? `${namespace}.${property}` : property;
        }
        if (obj[property] instanceof Date) {
          // the property is a date, so convert it to a string
          fd.append(formKey, obj[property].toISOString());
        } else if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) {
          // the property is an object or an array, but not a File, use recursivity
          this.toFormData(obj[property], fd, formKey);
        } else {
          // the property is a string, number or a File object
          fd.append(formKey, obj[property]);
        }
      }
    }
    return fd;
  }

  /**
   * Append property HttpParams
   * * @param formValue
   */
  static toParams(formValue: any) {
    let params = new HttpParams();
    for (const key of Object.keys(formValue)) {
      const value = formValue[key];
      params = params.append(key, value);
    }
    return params;
  }

  static exportExcel(result: Blob | string, fileName: string, type?: string) {
    if (typeof result === "string") {
      let byteCharacters = atob(result);
      let byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        let slice = byteCharacters.slice(offset, offset + 512);
        let byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        let byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      result = new Blob(byteArrays, { type: 'application/xlsx' });
    }
    if (!type) type = 'xlsx';
    if (result.size == 0) {
      this.spinnerService.hide();
      return this.snotify.warning('No Data', 'Warning');
    }
    if (result.type !== `application/${type}`) {
      this.spinnerService.hide();
      return this.snotify.error(result.type.toString(), 'Error');
    }
    const blob = new Blob([result]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.${type}`);
    document.body.appendChild(link);
    link.click();
  }

  static print(result: Blob) {
    if (result.size == 0) {
      this.spinnerService.hide();
      return this.snotify.warning('No Data', "Warning")
    }
    const blob = new Blob([result], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.contentWindow?.print();
  }

  static nextID(): string {
    return Math.random().toString(36).substring(2, 9);
  };
}
