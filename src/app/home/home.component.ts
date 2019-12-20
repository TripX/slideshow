import {Component, HostListener, OnInit} from '@angular/core';
import {ElectronService} from "../core/services";
import Timeout = NodeJS.Timeout;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public currentImageSrc: string;
  public imagesAreLoading: boolean;
  public speedSlideShowInSeconds: number;
  private imagesSrc: string[];
  private pathFolder: string;
  private currentIndexImage: number;
  private interval: Timeout;

  constructor(public electronService: ElectronService) {
  }

  ngOnInit(): void {
    this.imagesSrc = [];
    this.speedSlideShowInSeconds = 3;
  }

  selectFolder(event: Event) {
    this.electronService.setFullScreen(false);
    this.stopSlideShow(null);
    this.setPathFolder(event);
    this.startSlideShow();
  }

  setSpeedSlideShow(event: Event) {
    if (event && event.target) {
      const target = event.target as HTMLInputElement;
      this.speedSlideShowInSeconds = target.valueAsNumber;
    }
  }

  private startSlideShow() {
    this.electronService.preventDisplayToSleep();
    this.electronService.setFullScreen(true);
    this.imagesAreLoading = true;
    this.interval = setInterval(() => {
      this.updateFolderImage();
      this.showImage();
    }, this.speedSlideShowInSeconds * 1000);
  }

  @HostListener('document:keydown.escape', ['$event'])
  @HostListener('document:keydown.f11', ['$event'])
  stopSlideShow(event: KeyboardEvent | null) {
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Prevent default F11 to put in fullscreen
    if (event && event.key !== 'F11') {
      this.electronService.setFullScreen(false);
    }

    this.imagesSrc = [];
    this.imagesAreLoading = false;
    this.currentImageSrc = "";
    this.electronService.stopPreventDisplayToSleep();
  }

  @HostListener('click', ['$event'])
  @HostListener('document:keydown.ArrowRight', ['$event'])
  showImage(event: Event | null = null, previous = false) {
    if (this.imagesSrc && this.imagesSrc.length > 0) {
      previous ? this.currentIndexImage-- : this.currentIndexImage++;
      if (this.currentIndexImage < 0) {
        this.currentIndexImage = this.imagesSrc.length - 1;
      } else if (this.currentIndexImage > this.imagesSrc.length - 1) {
        this.currentIndexImage = 0;
      }
      this.currentImageSrc = this.imagesSrc[this.currentIndexImage];

      this.detectOrientation();
    }
  }

  @HostListener('document:keydown.ArrowLeft', ['$event'])
  showPreviousImage() {
    this.showImage(null, true);
  }

  private detectOrientation() {
    let img = new Image();

    img.onload = function () {
      // TODO found orientation
    };
    img.src = this.currentImageSrc;
  }

  private setPathFolder(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
      const firstImageSrc = target.files[0].path;
      this.pathFolder = firstImageSrc.substring(0, firstImageSrc.lastIndexOf(this.electronService.pathSeparator) + 1);
      this.updateFolderImage(firstImageSrc);
    }
  }

  private updateFolderImage(firstImageSrc: string = "") {
    if (this.pathFolder) {
      const startPath = 'file:///';
      this.imagesSrc = this.electronService.fs.readdirSync(this.pathFolder, {withFileTypes: true})
        .filter(item => !item.isDirectory())
        .map(item => startPath + this.pathFolder + item.name);

      if (firstImageSrc.length > 0) {
        this.currentIndexImage = this.imagesSrc.indexOf(startPath + firstImageSrc) - 1;
      }

      this.imagesAreLoading = false;
    }
  }
}
