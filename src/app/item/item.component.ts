import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
	Output,
	ViewChild,
} from '@angular/core';
import { Icons } from '../consts/icons.enum';
import { Item } from '../models/item.model';
import { FormControl } from '@angular/forms';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { Statuses } from '../consts/statuses.enum';
import {
	animate,
	state,
	style,
	transition,
	trigger,
} from '@angular/animations';

@Component({
	selector: 'app-item',
	templateUrl: './item.component.html',
	styleUrls: ['./item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('itemState', [
			state('in', style({ transform: 'translateX(0)' })),
			transition('void => *', [
				style({ transform: 'translateX(-100vw)' }),
				animate('300ms ease-out'),
			]),
			state('out', style({ transform: 'translateX(-100vw)' })),
			transition('* => void', [
				animate(
					'300ms ease-in',
					style({ transform: 'translateX(-100vw)' })
				),
			]),
		]),
	],
})
export class ItemComponent implements OnDestroy, OnInit, AfterViewInit {
	@Output()
	public killMe = new EventEmitter<void>();

	@Output()
	private isChecked = new EventEmitter<boolean>();

	@Input()
	public item!: Item;

	@Input()
	public deleteItems: boolean = false;

	@Input() isEven: boolean = false;

	@ViewChild('description') descriptionElement!: ElementRef;
	public isExpanded = false;
	public isOverflowing = false;
	public isActive: boolean = false;

	public Icons = Icons;

	public checkbox = new FormControl();

	private checkSubscription!: Subscription;
	private resizeSubject = new Subject<Event>();
	private resizeObservable = this.resizeSubject
		.asObservable()
		.pipe(debounceTime(100));

	public constructor() {
		this.resizeObservable.subscribe(() => this.checkOverflow());
	}

	@HostListener('window:resize', ['$event'])
	onResize(event: Event) {
		this.resizeSubject.next(event);
	}

	public ngOnInit(): void {
		this.checkSubscription = this.checkbox.valueChanges.subscribe(
			(isChecked: boolean) => {
				this.isChecked.emit(isChecked);
			}
		);
		this.isActive = this.item.status === Statuses.active;
	}

	public ngAfterViewInit(): void {
		setTimeout(() => this.checkOverflow(), 100);
	}

	public ngOnDestroy(): void {
		this.checkSubscription.unsubscribe();
	}

	public deleteItem() {
		this.item.isVisible = false;
	}

	public onAnimationDone(event: any) {
		if (event.toState === 'void') {
			this.killMe.emit();
		}
	}

	public toggleExpand() {
		this.isExpanded = !this.isExpanded;
	}

	private checkOverflow() {
		const element = this.descriptionElement?.nativeElement;
		element.style.height = 'auto';
		if (!element.className.includes('expanded')) {
			this.isOverflowing = element?.scrollHeight > element?.offsetHeight;
		}
	}
}
