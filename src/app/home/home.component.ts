import {Component, HostListener, OnInit} from '@angular/core';
import {ElectronService} from "../core/services";
import Timeout = NodeJS.Timeout;

interface ISlideShowConfig {
  speedSeconds: number;
}

interface IFile {
  name: string;
  time: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public slideShowConfig: ISlideShowConfig;
  private imagesSrc: IFile[];
  private indexImage: {
    previous: number
    current: number
    next: number
  };

  private intervalBeforeShowingImage: Timeout;
  private intervalSelectFolder: Timeout;

  constructor(public electronService: ElectronService) {
    this.imagesSrc = [];
    this.indexImage = {
      previous: 0,
      current: 1,
      next: 2
    };
    this.slideShowConfig = {
      speedSeconds: 3
    };
  }

  ngOnInit(): void {
    this.electronService.setFullScreen(false);
    this.electronService.preventDisplayToSleep();
  }

  isLoadingFolder(): boolean {
    return this.imagesSrc && this.imagesSrc.length > 0 && !this.imagesSrc[this.indexImage.current];
  }

  selectFolder(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
      this.startLoadingFolder(target.files[0]);
      this.startShowingSlideshow();
    } else {
      console.error('Error event from selectFolder', event);
    }
  }

  private startLoadingFolder(firstFile: File) {
    const firstImageSrc = firstFile.path;
    const startPath = 'file:///';
    const pathFolder = firstImageSrc.substring(0, firstImageSrc.lastIndexOf(this.electronService.pathSeparator) + 1);

    this.loadFolder(startPath, pathFolder);
    console.log('First Load Folder');
    const currentIndex = firstImageSrc.length > 0 ? this.imagesSrc.findIndex(image => image.name === startPath + firstImageSrc) - 1 : 0;
    this.setIndexesImages(currentIndex, false);

    if (this.intervalSelectFolder) {
      clearInterval(this.intervalSelectFolder);
      console.log('Clear Interval Load Folder');
    }

    this.intervalSelectFolder = setInterval(() => {
      this.loadFolder(startPath, pathFolder);
      console.log('Interval Load Folder');
    }, 500);
  }

  private loadFolder(startPath: string, pathFolder: string): void {
    this.imagesSrc = this.electronService.fs.readdirSync(pathFolder, {withFileTypes: true})
      .filter(item => !item.isDirectory())
      .map(file => {
        return {
          name: startPath + pathFolder + file.name,
          time: this.electronService.fs.statSync(pathFolder + '/' + file.name).mtime.getTime()
        }
      })
      .sort((a, b) => a.time - b.time)
      .map((v) => v);
  }

  private startShowingSlideshow() {
    if (this.intervalBeforeShowingImage) {
      clearInterval(this.intervalBeforeShowingImage);
      console.log('Clear Interval Show Next Image');
    } else {
      // First time load without waiting
      this.showNextImage();
      console.log('First Show Next Image');
    }

    this.intervalBeforeShowingImage = setInterval(() => {
      this.showNextImage();
      console.log('Interval Show Next Image');
    }, this.slideShowConfig.speedSeconds * 1000);
  }

  @HostListener('document:keydown.ArrowRight', ['$event'])
  showNextImage(event: Event | undefined = undefined) {
    if (this.imagesSrc && this.imagesSrc.length > 0) {
      this.setIndexesImages(this.indexImage.current, false);
    }
  }

  @HostListener('document:keydown.ArrowLeft', ['$event'])
  showPreviousImage(event: Event | undefined = undefined) {
    if (event && (event as KeyboardEvent).key === 'ArrowLeft') {
      this.setIndexesImages(this.indexImage.current, true);
    }
  }

  setIndexesImages(currentIndex: number, isPrevious: boolean): void {
    let indexImage;
    const lastIndex = this.imagesSrc.length - 1;

    if (isPrevious) {
      indexImage = {
        previous: currentIndex - 2,
        current: currentIndex - 1,
        next: currentIndex
      };

      // TODO previous ne fonctionne pas ici
      if (currentIndex - 2 < 0) {
        indexImage = {
          previous: lastIndex,
          current: 0,
          next: 1
        };
      }
    } else {
      indexImage = {
        previous: currentIndex,
        current: currentIndex + 1,
        next: currentIndex + 2 > lastIndex ? 0 : currentIndex + 2
      };

      if (currentIndex > lastIndex - 1) {
        indexImage = {
          previous: lastIndex,
          current: 0,
          next: 1
        };
      }
    }

    this.indexImage = indexImage;
    console.log(this.indexImage, lastIndex);
  }

  @HostListener('document:keydown.escape', ['$event'])
  @HostListener('document:keydown.f11', ['$event'])
  stopFullScreen(event: KeyboardEvent | null) {
    // Prevent default F11 to put in fullscreen
    if (event && event.key !== 'F11') {
      this.electronService.setFullScreen(false);
    }
  }

  setSpeedSlideShow(event: Event) {
    if (event && event.target) {
      const newSpeed = (event.target as HTMLInputElement).valueAsNumber;
      this.slideShowConfig.speedSeconds = newSpeed && newSpeed >= 1 ? newSpeed : 1;
      this.startShowingSlideshow();
    }
  }
}
