import { Component, QueryList, ViewChildren } from '@angular/core';
import '@utilities/extension-methods';
import { OperationResult } from '@utilities/operation-result';
import { NgxMediaUploadComponent } from 'projects/ngx-sdcores-lib/src/public_api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ngx-sdcores';

  @ViewChildren('srcUploader') srcUploaders!: QueryList<NgxMediaUploadComponent>;
  modelB: Model = <Model>{};

  files: File[] = [];
  images: string[] | any = [
    'http://localhost:4200/assets/samples/square.jpg',
    'http://localhost:4200/assets/samples/tall.jpg',
    'http://localhost:4200/assets/samples/fat.jpg',
    'http://localhost:4200/assets/samples/video.mp4',
    'http://localhost:4200/assets/samples/image-error.png',
    'http://localhost:4200/assets/samples/video-error.mp4',
    null,
    undefined,
    '',
    '                ',
    { hello: 'world' },
    ['a', 'b', 'c'],
    new Date(),
    9999999
  ]

  handleResult(event: OperationResult): void {
    console.log(event);
  }
}

interface Model {
  src: string;
  file: File;
}
