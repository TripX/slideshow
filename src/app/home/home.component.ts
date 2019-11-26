import {Component, HostListener, OnInit} from '@angular/core';
import {ElectronService} from "../core/services";
import Timeout = NodeJS.Timeout;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  private currentImageSrc: string;
  private imagesSrc: string[];
  private pathFolder: string;
  private currentIndexImage: number;
  private interval: Timeout;
  private imagesAreLoading: boolean;

  constructor(public electronService: ElectronService) {
    this.imagesSrc = [];
  }

  ngOnInit(): void {
  }

  selectFolder(event: Event) {
    this.electronService.setFullScreen(false);
    this.stopSlideShow(null);
    this.setPathFolder(event);
    this.startSlideShow();
  }

  startSlideShow() {
    this.electronService.setFullScreen(true);
    this.currentIndexImage = -1;
    this.imagesAreLoading = true;
    this.interval = setInterval(() => this.changeImage(), 3000);
  }

  changeImage() {
    this.updateFolderImage();
    if (this.imagesSrc && this.imagesSrc.length > 0) {
      this.currentIndexImage++;
      if (this.currentIndexImage > this.imagesSrc.length - 1) {
        this.currentIndexImage = 0;
      }
      this.showNextImage();
    }
  }

  @HostListener('click', ['$event'])
  showNextImage(eventClick = null) {
    if (eventClick) {
      this.currentIndexImage++;
    }
    this.currentImageSrc = this.imagesSrc[this.currentIndexImage];
  }

  setPathFolder(event: any) {
    if (event && event.target && event.target.files.length > 0) {
      const firstImageSrc = event.target.files[0].path;
      this.pathFolder = firstImageSrc.substring(0, firstImageSrc.lastIndexOf(this.getPathSeparator()) + 1);
      this.updateFolderImage();
    }
  }

  getPathSeparator(): string {
    return this.electronService.isWindows ? "\\" : "/";
  }

  updateFolderImage() {
    if (this.pathFolder) {
      this.electronService.fs.readdirSync(this.pathFolder, {withFileTypes: true})
        .filter(item => !item.isDirectory())
        .map(item => {
          this.imagesSrc.push('file:///' + this.pathFolder + item.name);
        });
      this.imagesAreLoading = false;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  @HostListener('document:keydown.f11', ['$event'])
  stopSlideShow(event: KeyboardEvent) {
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Prevent default F11 to put in fullscreen
    if (event && event.key !== 'F11') {
      this.electronService.setFullScreen(false);
    }

    this.imagesSrc = [];
    this.imagesAreLoading = false;
    this.currentImageSrc = null;
  }

}
