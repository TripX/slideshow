import {Component, HostListener, OnInit} from '@angular/core';
import {ElectronService} from "../core/services";
import Timeout = NodeJS.Timeout;
import {Dirent} from "fs";

enum ESlideshowState {
  RUNNING,
  STOPPED
}

interface ISlideshowState {
  state: ESlideshowState,
  speedSeconds: number;
}

interface IFile {
  name: string;
  time: number;
}

interface IIndexImage  {
  previous: number;
  current: number;
  next: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  private slideShowState: ISlideshowState;
  private imagesSrc: IFile[];
  private indexImage: IIndexImage;
  private filesDateOldToRecent: boolean;

  private intervalBeforeShowingImage: Timeout;
  private intervalSelectFolder: Timeout;

  private dateFormat = 'medium';

  constructor(public electronService: ElectronService) {
    this.imagesSrc = [];
    this.filesDateOldToRecent = true;
    this.indexImage = {
      previous: 0,
      current: 1,
      next: 2
    };
    this.slideShowState = {
      state: ESlideshowState.STOPPED,
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

  // TODO Vraiment choisir un dossier et non un fichier
  selectFolder(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0 && target.files[0].path) {
      this.startLoadingFolder(target.files[0].path);
      this.startShowingSlideshow(false);
    } else {
      console.error('Error event from selectFolder', event);
    }
  }

  private startLoadingFolder(chosenFilePath: string) {

    const pipe = (...fns: any[]) => (x: any) => fns.reduce((y, f) => f(y), x);

    const pathFolder = chosenFilePath.substring(0, chosenFilePath.lastIndexOf(this.electronService.pathSeparator) + 1);

    const getFilesProperties = (dirents: Dirent[]): IFile[] => {
      return dirents
        .filter(item => !item.isDirectory())
        .map(file => {
          const fullPath = pathFolder + file.name;
          return {
            name: 'file:///' + fullPath,
            time: this.electronService.fs.statSync(fullPath).mtime.getTime()
          }
        });
    };

    const sortFromOldToRecent = (files: IFile[]): IFile[] => {
      return files.sort(((a, b) => a.time - b.time))
    };

    const sortFromRecentToOld = (files: IFile[]): IFile[] => {
      return files.sort(((a, b) => b.time - a.time))
    };

    if (this.intervalSelectFolder) {
      clearInterval(this.intervalSelectFolder);
    }

    this.intervalSelectFolder = setInterval(() => {
      const loadedFiles = this.electronService.fs.readdirSync(pathFolder, {withFileTypes: true});
      if (this.filesDateOldToRecent) {
        this.imagesSrc = pipe(getFilesProperties, sortFromOldToRecent)(loadedFiles);
      } else {
        this.imagesSrc = pipe(getFilesProperties, sortFromRecentToOld)(loadedFiles);
      }
    }, 500);
  }

  private stopSlideshow() {
    if (this.intervalBeforeShowingImage) {
      clearInterval(this.intervalBeforeShowingImage);
      this.slideShowState.state = ESlideshowState.STOPPED;
    }
  }

  private startShowingSlideshow(withWithFullscreen: boolean) {

    this.electronService.setFullScreen(withWithFullscreen);

    this.stopSlideshow();

    this.slideShowState.state = ESlideshowState.RUNNING;

    this.intervalBeforeShowingImage = setInterval(() => {
      this.setIndexesImages({isPrevious: false});
    }, this.slideShowState.speedSeconds * 1000);
  }

  @HostListener('document:keydown.ArrowRight', ['$event'])
  @HostListener('document:keydown.ArrowLeft', ['$event'])
  showNextImageFrom(event: KeyboardEvent) {
    this.setIndexesImages({isPrevious: (event && event.key) === 'ArrowLeft'});
  }

  setIndexesImages({isPrevious}: {isPrevious: boolean}): void {
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

  setSpeedSlideShow(event: Event) {
    if (event && event.target) {
      const newSpeed = (event.target as HTMLInputElement).valueAsNumber;
      this.slideShowState.speedSeconds = newSpeed && newSpeed >= 1 ? newSpeed : 1;
      this.startShowingSlideshow(false);
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

  isSlideshowRunning() {
    return this.slideShowState.state === ESlideshowState.RUNNING;
  }

  isSlideshowStopped() {
    return this.slideShowState.state === ESlideshowState.STOPPED;
  }

  inverseSorting() {
    this.filesDateOldToRecent = !this.filesDateOldToRecent;
  }
}
