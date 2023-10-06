import { SafeResourceUrl } from "@angular/platform-browser";

export interface MediaItem {
  id?: string;
  srcSafe?: SafeResourceUrl;
  src?: string;
  file: File;
  type?: string;
}