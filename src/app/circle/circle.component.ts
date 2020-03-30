import {Component} from '@angular/core';

@Component({
  selector: 'app-circle',
  templateUrl: './circle.component.html',
  styleUrls: ['./circle.component.scss']
})
export class CircleComponent {

  circleElements(): Array<Number> {
    return Array(100).map((x, i) => i)
  };

}
