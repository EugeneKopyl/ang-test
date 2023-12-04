import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class ThemeService {
	private darkMode = new BehaviorSubject<boolean>(false);
	darkMode$ = this.darkMode.asObservable();

	constructor() {}

	setDarkMode(isDarkMode: boolean): void {
		this.darkMode.next(isDarkMode);
	}

	scheduleThemeChange(sunrise: string, sunset: string) {
		const sunriseDate = new Date(sunrise);
		const sunsetDate = new Date(sunset);

		interval(1000 * 60)
			.pipe(
				startWith(0),
				map(() => new Date()),
				map((now) => !(now >= sunriseDate && now < sunsetDate))
			)
			.subscribe((isDarkMode) => {
				this.setDarkMode(isDarkMode);
			});
	}
}
