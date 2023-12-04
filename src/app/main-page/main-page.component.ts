import {
	ChangeDetectionStrategy,
	Component,
	OnDestroy,
	OnInit,
} from '@angular/core';
import { LoremIpsum } from 'lorem-ipsum';
import { Item } from '../models/item.model';
import { Statuses } from '../consts/statuses.enum';
import { Icons } from '../consts/icons.enum';
import { SunInfo } from '../models/sunInfo.model';
import { Subscription } from 'rxjs';
import { ThemeService } from '../services/theme.service';

@Component({
	selector: 'app-root',
	templateUrl: './main-page.component.html',
	styleUrls: ['./main-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent implements OnInit, OnDestroy {
	public items: Item[] = [];

	public selected = new Set<symbol>();

	public Icons = Icons;
	public deleteItems: boolean = false;
	public isLightAvailable: boolean = !(
		window.matchMedia &&
		window.matchMedia('(prefers-color-scheme: dark)').matches
	);
	public darkMode: boolean =
		window.matchMedia &&
		window.matchMedia('(prefers-color-scheme: dark)').matches;

	public sunInfo: SunInfo = {
		sunrise: '',
		sunset: '',
		solar_noon: '',
		day_length: 0,
		civil_twilight_begin: '',
		civil_twilight_end: '',
		nautical_twilight_begin: '',
		nautical_twilight_end: '',
		astronomical_twilight_begin: '',
		astronomical_twilight_end: '',
	};

	private lorem = new LoremIpsum({
		sentencesPerParagraph: {
			max: 8,
			min: 1,
		},
		wordsPerSentence: {
			max: 16,
			min: 1,
		},
	});
	private themeSubscription?: Subscription;

	public constructor(private themeService: ThemeService) {
		window
			.matchMedia('(prefers-color-scheme: dark)')
			.addEventListener('change', (e) => {
				this.darkMode = e.matches;
				this.isLightAvailable = !e.matches;
				this.applyTheme();
			});
		this.applyTheme();
	}

	public ngOnInit(): void {
		this.getLocationAndTimes();
		this.themeSubscription = this.themeService.darkMode$.subscribe(
			(isDarkMode) => {
				this.darkMode = isDarkMode;
				this.applyTheme();
			}
		);
	}

	public ngOnDestroy(): void {
		this.themeSubscription?.unsubscribe();
	}

	public addItem(): void {
		const item: Item = {
			id: Symbol(),
			label: this.lorem.generateWords(this.randomWordsQty),
			description: this.lorem.generateSentences(this.randomSentencesQty),
			status: this.randomStatus,
			foto: this.randomFoto,
			isVisible: true,
		};

		this.items.unshift(item);
	}

	public checkItem(isChecked: boolean, id: symbol): void {
		if (isChecked) {
			this.selected.add(id);
		} else {
			this.selected.delete(id);
		}
	}

	public deleteSelected(): void {
		Array.from(this.selected).forEach((itemId) => {
			const doomedIndex = this.items.findIndex(
				(item) => item.id === itemId
			);
			this.items[doomedIndex].isVisible = false;
		});
		this.deleteItems = true;
	}

	public deleteById(id: symbol): void {
		const doomedIndex = this.items.findIndex((item) => item.id === id);

		this.items.splice(doomedIndex, 1);
		this.selected.delete(id);
		if (this.selected.size === 0) {
			this.deleteItems = false;
		}
	}

	public print(): void {
		globalThis.print();
	}

	public toggleTheme(): void {
		this.darkMode = !this.darkMode;
		this.themeService.setDarkMode(this.darkMode);
		this.applyTheme();
	}

	private applyTheme(): void {
		document.body.classList.toggle('dark-theme', this.darkMode);
	}

	private getSunTimes(latitude: number, longitude: number, date: string): void {
		const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${date}&formatted=0`;

		fetch(url)
			.then((response) => response.json())
			.then((data) => {
				if (data.status === 'OK') {
					this.sunInfo = data.results;
					this.changeThemeAutomatically();
				} else {
					console.error('Sunrise-Sunset API error:', data.status);
				}
			})
			.catch((error) =>
				console.error(
					'There was an error fetching the sunrise-sunset data:',
					error
				)
			);
	}

	private changeThemeAutomatically(): void {
		this.themeService.scheduleThemeChange(
			this.sunInfo.sunrise,
			this.sunInfo.sunset
		);
	}

	private getLocationAndTimes(): void {
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					this.getSunTimes(
						position.coords.latitude,
						position.coords.longitude,
						'today'
					);
				},
				(error) => {
					console.error('Error obtaining location:', error);
				}
			);
		} else {
			console.error('Geolocation is not supported by this browser.');
		}
	}

	private get randomSentencesQty() {
		return Math.floor(Math.random() * 20);
	}

	private get randomWordsQty() {
		return Math.floor(Math.random() * 8);
	}

	private get randomStatus() {
		return Math.round(Math.random()) === 1
			? Statuses.active
			: Statuses.inactive;
	}

	private get randomFoto() {
		return Math.round(Math.random()) === 1
			? '/assets/items/foto1.jpg'
			: '/assets/items/foto2.png';
	}
}
