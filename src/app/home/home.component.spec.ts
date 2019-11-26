import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';
import { TranslateModule } from '@ngx-translate/core';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [TranslateModule.forRoot()]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render by default folder selection', async(() => {
    expect(component.currentImageSrc).toBeUndefined();
    expect(component.imagesAreLoading).toBeUndefined();

    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('#select-folder')).toBeTruthy();
    expect(compiled.querySelector('#image-loading')).toBeFalsy();
  }));

  it('should render a label tag', async(() => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('#label-file-upload').textContent).toContain(
      'PAGES.HOME.UPLOAD_FILE'
    );
  }));

  it('should render an input file-upload', async( () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('#file-upload')).toBeTruthy();
  }));

  // it('should render an image in fullscreen', async(() => {
  //   component.currentImageSrc = 'whateverSrcImage';
  //   component.selectFolder(new Event('change'));
  //
  //   const compiled = fixture.debugElement.nativeElement;
  //   fixture.whenStable().then(() => {
  //     fixture.detectChanges();
  //     const input = compiled.querySelector('#image-fullscreen').nativeElement;
  //     spyOn(component, 'selectFolder');
  //     input.dispatchEvent(new Event('change'));
  //
  //     fixture.detectChanges();
  //
  //     expect(component.selectFolder).toHaveBeenCalled();
  //
  //     expect(compiled.querySelector('#image-fullscreen')).toBeTruthy();
  //   });
  //
  // }));
});
