import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-leadership',
  imports: [RouterLink],
  templateUrl: './leadership.html',
  host: { style: 'display: block' },
})
export class Leadership {}
