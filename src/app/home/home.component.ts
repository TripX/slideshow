import {Component, HostListener, OnInit} from '@angular/core';
import {ElectronService} from "../core/services";
import Timeout = NodeJS.Timeout;
import {Dirent} from "fs";

enum ESlideshowState {
  RUNNING,
  STOPPED
}

enum ESortingState {
  OLD_TO_NEW = 'Des plus anciennes aux plus récentes',
  NEW_TO_OLD = 'Des plus récentes aux plus anciennes'
}

interface ISlideshowState {
  state: ESlideshowState,
  sortingState: ESortingState,
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

  private slideShow: ISlideshowState;
  private imagesSrc: IFile[];
  private indexImage: IIndexImage;

  private intervalBeforeShowingImage: Timeout;
  private intervalSelectFolder: Timeout;

  private dateFormat = 'medium';

  constructor(public electronService: ElectronService) {
    this.imagesSrc = [];

    this.indexImage = this.resetImageIndexes();

    this.slideShow = {
      state: ESlideshowState.STOPPED,
      sortingState: ESortingState.OLD_TO_NEW,
      speedSeconds: 4
    };
  }

  ngOnInit(): void {
    this.electronService.setFullScreen(false);
    this.electronService.preventDisplayToSleep();
  }

  get currentImageSource(): string {
    return this.imagesSrc[this.indexImage.current]?.name
  };

  selectFolder(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0 && target.files[0].path) {
      this.startLoadingFolder(target.files[0].path);
    } else {
      console.warn('No images', event);
    }

    this.startShowingSlideshow(false);

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
            time: this.electronService.fs.statSync(fullPath).birthtimeMs
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
      if (this.slideShow.sortingState === ESortingState.OLD_TO_NEW) {
        this.imagesSrc = pipe(getFilesProperties, sortFromOldToRecent)(loadedFiles);
      } else {
        this.imagesSrc = pipe(getFilesProperties, sortFromRecentToOld)(loadedFiles);
      }
    }, 500);
  }

  private stopSlideshow() {
    if (this.intervalBeforeShowingImage) {
      clearInterval(this.intervalBeforeShowingImage);
      this.slideShow.state = ESlideshowState.STOPPED;
    }
  }

  private startShowingSlideshow(withWithFullscreen: boolean) {

    this.electronService.setFullScreen(withWithFullscreen);

    this.stopSlideshow();

    this.slideShow.state = ESlideshowState.RUNNING;

    this.intervalBeforeShowingImage = setInterval(() => {
      this.setIndexesImages({isPrevious: false});
    }, this.slideShow.speedSeconds * 1000);
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

  resetImageIndexes(): IIndexImage {
    return {
      previous: 0,
      current: 1,
      next: 2
    };
  }

  setSpeedSlideShow(event: Event) {
    if (event && event.target) {
      const newSpeed = (event.target as HTMLInputElement).valueAsNumber;
      this.slideShow.speedSeconds = newSpeed && newSpeed >= 1 ? newSpeed : 1;
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
    return this.slideShow.state === ESlideshowState.RUNNING;
  }

  isSlideshowStopped() {
    return this.slideShow.state === ESlideshowState.STOPPED;
  }

  inverseSorting() {
    this.slideShow.sortingState === ESortingState.NEW_TO_OLD ? this.slideShow.sortingState = ESortingState.OLD_TO_NEW : this.slideShow.sortingState = ESortingState.NEW_TO_OLD;
    this.indexImage = this.resetImageIndexes();
  }

  isSortingOldToNew() {
    return this.slideShow.sortingState === ESortingState.OLD_TO_NEW;
  }
}
