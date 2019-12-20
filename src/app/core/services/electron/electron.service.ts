import {Injectable} from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import {ipcRenderer, webFrame, remote} from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as process from 'process';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;

  childProcess: typeof childProcess;
  fs: typeof fs;
  process: typeof process;

  private idPreventDisplayToSleep: number;

  get isElectron(): boolean {
    return window && window.process && window.process.type;
  }

  get isWindows(): boolean {
    return window && this.process && this.process.platform === 'win32';
  }

  get pathSeparator(): string {
    return this.isWindows ? "\\" : "/";
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.remote = window.require('electron').remote;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');
      this.process = window.require('process');
    }
  }

  preventDisplayToSleep() {
    this.idPreventDisplayToSleep = window && this.remote.powerSaveBlocker.start('prevent-display-sleep');
  }

  stopPreventDisplayToSleep() {
    if (this.idPreventDisplayToSleep) {
      window && this.remote.powerSaveBlocker.stop(this.idPreventDisplayToSleep);
    }
  }

  setFullScreen(value: boolean) {
    return window && this.remote.getCurrentWindow().setFullScreen(value);
  }
}
