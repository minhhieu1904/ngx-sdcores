import { Component, ElementRef, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ImageCroppedEvent, ImageCropperModule, ImageTransform } from 'ngx-image-cropper';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgSnotifyService } from '../../services';
import { IMAGE_TYPES_CONST, MEDIA_TYPE_CONST, MSG_CONST, TITLE_CONST, VIDEO_TYPES_CONST } from '../../constants';
import { MediaItem, OperationResult } from '../../interfaces';
import { FunctionUtility } from '../../utilities';

@Component({
  standalone: true,
  selector: 'ngx-media-upload',
  templateUrl: './ngx-media-upload.component.html',
  styleUrls: ['./ngx-media-upload.component.scss'],
  imports: [CommonModule, FormsModule, ImageCropperModule, NgSelectModule]
})
export class NgxMediaUploadComponent {
  protected types: Map<string, string> = new Map();
  protected mediaItem: MediaItem = <MediaItem>{};
  protected acceptedExtensions: string = '';
  protected previewSrcSafe: SafeResourceUrl = '';
  protected previewType: string = '';
  protected id: string = '';
  protected tooltips: any[] = [];
  protected mediaType: typeof MEDIA_TYPE_CONST = MEDIA_TYPE_CONST;
  protected imagePlusUrl: string = 'assets/image-plus.svg';
  protected imageErrorUrl: string = 'assets/image-error.svg';
  protected imagePreviewUrl: string = 'assets/view.svg';
  protected imageCopyUrl: string = 'assets/copy.svg';
  protected imageDeleteUrl: string = 'assets/delete.svg';
  protected imageCropUrl: string = 'assets/crop.svg';
  protected cropEditImage: string = 'assets/edit.svg';
  protected cropFlipHorizontalImage: string = 'assets/flip-horizontal.svg';
  protected cropFlipVerticalImage: string = 'assets/flip-vertical.svg';
  protected cropResetChangesImage: string = 'assets/reset-changes.svg';
  protected cropRotateLeftImage: string = 'assets/rotate-left.svg';
  protected cropRotateRightImage: string = 'assets/rotate-right.svg';
  protected cropZoomInImage: string = 'assets/zoom-in.svg';
  protected cropZoomOutImage: string = 'assets/zoom-out.svg';
  protected cropRotateImage: string = 'assets/rotate.svg';
  protected cropRatioImage: string = 'assets/ratio.svg';
  protected selectionCropImage: string = 'assets/selection.svg';
  protected cropImage: MediaItem = <MediaItem>{};
  protected canvasRotation: number = 0;
  protected transform: ImageTransform = <ImageTransform>{};
  protected rotation: number = 0;
  protected scale: number = 1;
  protected containWithinAspectRatio: boolean = false;
  protected fileName: string = '';
  protected maintainAspectRatio: boolean = false;
  protected aspectRatio: number = 0;
  protected isRoundCropper: boolean = false;
  protected textToCompare: boolean = false;

  protected modal: BsModalRef | undefined;
  protected cropModal: BsModalRef | undefined;

  @ViewChild('videoSrcModal') protected modalMediaVideo: ElementRef | undefined;
  @Input() public src: string = '';
  @Input() public accept: string = 'image/*, video/*';
  @Input() public maxSize: number = 999999999999999;
  @Input() public height: number = 150;
  @Input() public file: File = new File([], '');
  @Input() public copy: boolean = false;
  @Input() public crop: boolean = false;
  @Input() public remove: boolean = false;
  @Input() public preview: boolean = false;
  @Input() public disabled: boolean = false;
  @Input() public confirmRemove: boolean = false;
  @Output() protected fileChange: EventEmitter<File> = new EventEmitter();
  @Output() protected result: EventEmitter<OperationResult> = new EventEmitter();

  constructor(
    private snotify: NgSnotifyService,
    private modalService: BsModalService,
    protected sanitizer: DomSanitizer) {
    this.id = FunctionUtility.nextID();
  }

  public ngOnInit(): void {
    IMAGE_TYPES_CONST.forEach(type => this.types.set(type, MEDIA_TYPE_CONST.IMG));
    VIDEO_TYPES_CONST.forEach(type => this.types.set(type, MEDIA_TYPE_CONST.VIDEO));
    this.initialMediaItem();
    this.calculateAcceptedExtensions();
  }

  public reset(): void {
    this.mediaItem = <MediaItem>{
      id: this.id,
      srcSafe: this.sanitizer.bypassSecurityTrustUrl(this.src),
      src: this.src,
      type: this.checkMediaType(this.src)
    };
    this.resetImage();
    this.fileChange.emit(undefined);
    this.result.emit({ isSuccess: true, data: 'RESET' } as OperationResult);
  }

  protected async initialMediaItem(): Promise<void> {
    let file: File = new File([], '');

    if (this.src) {
      const extension: string | undefined = this.src.split('.').pop();
      const mineType: string = this.getMineType(extension as string);
      const url = this.src;
      const fileName = url.substring(url.lastIndexOf('/') + 1);
      file = await this.urltoFile(this.src, fileName, mineType);
    }

    this.mediaItem = <MediaItem>{
      id: this.id,
      srcSafe: this.sanitizer.bypassSecurityTrustUrl(this.src),
      src: this.src,
      type: this.checkMediaType(this.src),
      file: file
    };
  }

  protected checkMediaType(src: string | undefined): string {
    if (!src || typeof src === 'object' || typeof src === 'number' || !src.trim())
      return MEDIA_TYPE_CONST.IMG;

    const url: URL = new URL(src);
    const extension: string = url.pathname.split('.')[1];
    const type: string | undefined = this.types.get(extension);
    return type ? type : MEDIA_TYPE_CONST.IMG;
  }

  protected onRemoveMediaClicked(): void {
    this.confirmRemove ?
      this.snotify.confirm(TITLE_CONST.DELETE, MSG_CONST.DELETE, () => this.removeMedia()) :
      this.removeMedia();
  }

  protected removeMedia(): void {
    this.mediaItem = <MediaItem>{ id: this.id };
    this.resetImage();
    this.fileChange.emit(this.mediaItem.file);
    this.result.emit({ isSuccess: true, data: 'REMOVE' } as OperationResult);
  }

  protected onSelectFile(event: any): void {
    if (event.target.files && event.target.files[0]) {
      let file: File = event.target.files[0];
      let size: number = file.size;
      let extension: string | undefined = file.name.split('.').pop();
      this.fileName = file.name;
      if (!extension || !this.types.get(extension) || !this.acceptedExtensions.includes(extension?.toLowerCase())) {
        event.target.value = '';
        return this.result.emit({ isSuccess: false, data: 'BROWSE', error: 'INVALID_FILE_TYPE' });
      }

      if (size > this.maxSize) {
        event.target.value = '';
        return this.result.emit({ isSuccess: false, data: 'BROWSE', error: 'INVALID_FILE_SIZE' });
      }
      this.crop = IMAGE_TYPES_CONST.includes(extension);
      let mediaItem: MediaItem = <MediaItem>{ id: this.id, file, type: this.types.get(extension?.toLowerCase()) };
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        mediaItem.srcSafe = this.sanitizer.bypassSecurityTrustResourceUrl(e.target?.result?.toString() ?? '');
        mediaItem.src = e.target?.result?.toString() ?? '';
        this.mediaItem = mediaItem;
        this.fileChange.emit(mediaItem.file);
        this.result.emit({ isSuccess: true, data: 'BROWSE' } as OperationResult);
      };
    }

    event.target.value = '';
  }

  protected calculateAcceptedExtensions(): void {
    let result: string = this.accept;

    if (!this.accept || !this.accept.trim())
      result += IMAGE_TYPES_CONST.map(type => `.${type}`).join(', ') + ', ' + VIDEO_TYPES_CONST.map(type => `.${type}`).join(', ');

    if (this.accept.includes('image/*'))
      result = result.replace('image/*', IMAGE_TYPES_CONST.map(type => `.${type}`).join(', '));

    if (this.accept.includes('video/*'))
      result = result.replace('video/*', VIDEO_TYPES_CONST.map(type => `.${type}`).join(', '));

    this.acceptedExtensions = result;
  }

  protected openModal(template: TemplateRef<any>) {
    if (this.preview && this.mediaItem && this.mediaItem.srcSafe && this.mediaItem.type) {
      this.previewSrcSafe = this.mediaItem.srcSafe;
      this.previewType = this.mediaItem.type;
      this.modal = this.modalService.show(template, { class: 'modal-lg' });
    }
  }

  protected copySrc() {
    navigator.clipboard.writeText(this.src);
    this.result.emit({ isSuccess: true, data: 'COPY' } as OperationResult);
  }

  protected openCropModal(template: TemplateRef<any>) {
    if (this.crop && this.mediaItem && this.mediaItem.file && this.mediaItem.type) {
      this.cropImage = { ... this.mediaItem };
      this.cropModal = this.modalService.show(template, { class: 'modal-lg imageCropper', backdrop: 'static' });
    }
  };

  protected imageCropped(event: ImageCroppedEvent) {
    this.cropImage.src = event.base64 ?? event.objectUrl ?? '';
    this.cropImage.srcSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.cropImage.src);
  }

  protected rotateLeft() {
    this.canvasRotation--;
    this.flipAfterRotate();
  }

  protected rotateRight() {
    this.canvasRotation++;
    this.flipAfterRotate();
  }

  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH
    };
  }


  protected flipHorizontal() {
    this.transform = {
      ...this.transform,
      flipH: !this.transform.flipH
    };
  }

  protected flipVertical() {
    this.transform = {
      ...this.transform,
      flipV: !this.transform.flipV
    };
  }

  protected resetImage() {
    this.canvasRotation = 0;
    this.transform = {};
    this.rotation = 0;
    this.scale = 1;
    this.containWithinAspectRatio = false;
    this.fileName = '';
    this.maintainAspectRatio = false;
    this.aspectRatio = 0;
    this.textToCompare = false;
    this.updateCropper();
  }

  protected zoomOut() {
    this.scale -= .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  protected zoomIn() {
    this.scale += .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  protected toggleContainWithinAspectRatio() {
    this.containWithinAspectRatio = !this.containWithinAspectRatio;
  }

  protected updateRotation() {
    this.transform = {
      ...this.transform,
      rotate: this.rotation
    };
  }

  protected updateRatio() {
    this.maintainAspectRatio = this.aspectRatio > 0;
  }

  protected updateCropper() {
    this.maintainAspectRatio = this.textToCompare;
    this.aspectRatio = this.textToCompare ? 1 : 0;
    this.isRoundCropper = this.textToCompare;
  }

  protected async saveImage() {
    this.mediaItem.file = await this.urltoFile(this.cropImage.src as string, this.mediaItem.file.name, this.mediaItem.file.type);
    this.mediaItem.srcSafe = this.cropImage.srcSafe;
    this.fileChange.emit(this.mediaItem.file);
    this.result.emit({ isSuccess: true, data: 'CROP' } as OperationResult);
    this.cropModal?.hide();
  }

  protected async urltoFile(url: string, fileName: string, mimeType: string): Promise<File> {
    mimeType = mimeType || (url.match(/^data:([^;]+);/) || '')[1];
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new File([buf], fileName, { type: mimeType });
  }

  protected async urlToFile(url: string): Promise<File> {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new File([], 'fileName');
  }

  protected getMineType(extension: string): string {
    const isImage = IMAGE_TYPES_CONST.includes(extension?.toLowerCase());
    return `${isImage ? 'image' : 'video'}/${extension}`;
  }
}
