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

  private dateFormat = 'medium';

  constructor(public electronService: ElectronService) {
    this.imagesSrc = [];
    this.indexImage = {
      previous: 0,
      current: 1,
      next: 2
    };
    this.slideShowConfig = {
      speedSeconds: 4
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
    const currentIndex = firstImageSrc.length > 0 ? this.imagesSrc.findIndex(image => image.name === startPath + firstImageSrc) - 1 : 0;
    this.setIndexesImages(false, currentIndex);

    if (this.intervalSelectFolder) {
      clearInterval(this.intervalSelectFolder);
    }

    this.intervalSelectFolder = setInterval(() => {
      this.loadFolder(startPath, pathFolder);
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
    }

    this.intervalBeforeShowingImage = setInterval(() => {
      this.setIndexesImages(false);
    }, this.slideShowConfig.speedSeconds * 1000);
  }

  @HostListener('document:keydown.ArrowRight', ['$event'])
  @HostListener('document:keydown.ArrowLeft', ['$event'])
  showNextImageFrom(event: Event | undefined = undefined) {
    const eventKey = event && (event as KeyboardEvent).key;
    this.setIndexesImages(eventKey === 'ArrowLeft');
  }

  setIndexesImages(isPrevious: boolean, currentIndex = this.indexImage.current): void {
    const lastIndex = this.imagesSrc.length - 1;
    const firstIndex = 0;
    if (isPrevious) {
      this.indexImage = {
        previous: this.indexImage.previous - 1 < firstIndex ? lastIndex : this.indexImage.previous - 1,
        current: this.indexImage.current - 1 < firstIndex ? lastIndex : this.indexImage.current - 1,
        next: this.indexImage.next - 1 < firstIndex ? lastIndex : this.indexImage.next - 1
      };
    } else {
      this.indexImage = {
        previous: this.indexImage.previous + 1 > lastIndex ? firstIndex : this.indexImage.previous + 1,
        current: this.indexImage.current + 1 > lastIndex ? firstIndex : this.indexImage.current + 1,
        next: this.indexImage.next + 1 > lastIndex ? firstIndex : this.indexImage.next + 1
      };
    }
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
