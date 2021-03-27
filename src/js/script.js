'use strict';

const mapContainer = document.getElementById('map');
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// popup options
const popupOptions = {
	maxWidth: 250,
	minWidth: 100,
	autoClose: false,
	className: 'cycling-popup', // default value
};

// marker options
const markerOptions = {
	riseOnHover: true,
	draggable: true,
};

// let mapMarker;

/**
 * App Class
 */
class App {
	_mapObj;
	_mapEvent;

	constructor() {
		this.arrWorkouts = [];
		this._getPosition();

		// workout form event listener
		form.addEventListener('submit', e => {
			e.preventDefault();
			this._newWorkout();
			console.debug('new workout created!');
		});

		// workout type event listener
		inputType.addEventListener('change', this._toggleElevationField);

		// move to marker on workout click
		containerWorkouts.addEventListener('click', e => this._moveToMarker(e));
	}

	_getPosition() {
		// get GeoLocation
		if (navigator.geolocation) {
			// check if browser supports geolocation API
			navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
				document.querySelector('.map-load-failed').classList.remove('hidden');
			});
		}
	}

	_loadMap(position) {
		console.debug('Location received');
		// get user location from Geolocation API
		let { latitude, longitude } = position.coords;

		latitude = Number(latitude).toFixed(3);
		longitude = Number(longitude).toFixed(3);
		const coords = [latitude, longitude];

		// map options
		const mapOptions = {
			center: coords,
			zoom: 13,
			closePopupOnClick: false,
			riseOnHover: true,
		};

		// Center map on current coords
		this._mapObj = L.map(mapContainer, mapOptions);

		// Tile styles
		// {s}.tile.openstreetmap.org/{z}/{x}/{y}.png
		https: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this._mapObj);

		// Event handler for map clicks
		this._mapObj.on('click', event => {
			this._showForm(event);
		});
	}

	_showForm(event) {
		this._mapEvent = event;

		// Reveal form
		form.classList.remove('hidden');
		inputDistance.focus();
	}

	_setLocalStorage() {}

	_getLocalStorage() {}

	_newWorkout() {
		const { lat, lng } = this._mapEvent.latlng;
		const newCoords = [lat, lng];

		// get data from form
		const type = inputType.value;
		const distance = +inputDistance.value;
		const duration = +inputDuration.value;
		const elevation = +inputElevation.value;
		const cadence = +inputCadence.value;
		let newWorkout;

		// if activity === running, create running object
		if (type === 'running') {
			newWorkout = new Running(newCoords, distance, duration, cadence);
			popupOptions.className = 'running-popup';
		}

		// if activity === cycling, create cycling object
		if (type === 'cycling') {
			newWorkout = new Cycling(newCoords, distance, duration, elevation);
			popupOptions.className = 'cycling-popup';
		}

		// add new workout to workout array
		this.arrWorkouts.push(newWorkout);

		// add workout marker to map
		this._renderWorkoutMarker(newWorkout);

		// render workout to list
		this._renderWorkout(newWorkout);

		// clear form fields
		document.querySelectorAll('input').forEach(el => {
			el.value = '';
			el.blur();
		});
	}

	_renderWorkout(workout) {
		let workoutHTML;
		const animation = `animation: workout-anim .5s cubic-bezier(0.04, 0.4, 0.46, 1.04) .1s forwards;`;
		if (workout.type === 'running') {
			workoutHTML = `
				<li class="workout workout--${workout.type}" data-id="${workout.id}" style="${animation}">
					<h2 class="workout__title">${workout.description}</h2>
					<div class="workout__details">
						<span class="workout__icon">🏃‍♂️</span>
						<span class="workout__value">${workout.distance}</span>
						<span class="workout__unit">km</span>
					</div>
					<div class="workout__details">
						<span class="workout__icon">⏱</span>
						<span class="workout__value">${workout.duration}</span>
						<span class="workout__unit">min</span>
					</div>
					<div class="workout__details">
						<span class="workout__icon">⚡️</span>
						<span class="workout__value">${workout.pace.toFixed(1)}</span>
						<span class="workout__unit">min/km</span>
					</div>
					<div class="workout__details">
						<span class="workout__icon">🦶🏼</span>
						<span class="workout__value">${workout.cadence}</span>
						<span class="workout__unit">spm</span>
					</div>
				</li>
				`;
		} else if (workout.type === 'cycling') {
			workoutHTML = `
				<li class="workout workout--${workout.type}" data-id="${workout.id}" style="${animation}">
					<h2 class="workout__title">${workout.description}</h2>
					<div class="workout__details">
						<span class="workout__icon">🚴‍♀️</span>
						<span class="workout__value">${workout.distance}</span>
						<span class="workout__unit">km</span>
					</div>
					<div class="workout__details">
						<span class="workout__icon">⏱</span>
						<span class="workout__value">${workout.duration}</span>
						<span class="workout__unit">min</span>
					</div>
					<div class="workout__details">
						<span class="workout__icon">⚡️</span>
						<span class="workout__value">${workout.speed.toFixed(1)}</span>
						<span class="workout__unit">km/h</span>
					</div>
					<div class="workout__details">
						<span class="workout__icon">⛰</span>
						<span class="workout__value">${workout.elevGain}</span>
						<span class="workout__unit">m</span>
					</div>
       			 </li>
				`;
		}

		form.insertAdjacentHTML('afterend', workoutHTML);
		this._hideForm();
	}

	_renderWorkoutMarker(workout) {
		L.marker(workout.coords, markerOptions)
			.addTo(this._mapObj)
			.bindPopup(L.popup(popupOptions))
			.setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
			.openPopup();
	}

	_hideForm() {
		form.classList.add('hidden');
	}

	_toggleElevationField() {
		inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
		inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
	}

	_moveToMarker(event) {
		if (event.target.closest('.workout') === null) return;

		const id = event.target.closest('.workout').getAttribute('data-id');
		const workout = this.arrWorkouts.find(workout => workout.id === id);
		this._mapObj.setView(workout.coords, 13, { animate: true, pan: { duration: 1, easeLinearity: 0.41 } });
	}

	reset() {}
}

/**
 * Workout Class
 */
class Workout {
	constructor(coords, distance, duration) {
		this.date = new Date();
		this.id = Date.now().toString().slice(-10);
		this.coords = coords;
		this.distance = distance; // in km
		this.duration = duration; // in minutes
	}

	_setDescription() {
		const months = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];

		const day = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];

		this.description = `${this.type.slice(0, 1).toUpperCase() + this.type.slice(1)} on ${day[this.date.getDay()]}, ${
			months[this.date.getMonth()]
		} 
		${this.date.getDate()}`;

		return this.description;
	}
}

/**
 * Running
 */
class Running extends Workout {
	constructor(coords, distance, duration, cadence) {
		super(coords, distance, duration);
		this.cadence = cadence;
		this.type = 'running';
		this.calcPace();
		this._setDescription();
	}

	calcPace() {
		// min/km
		this.pace = this.duration / this.distance;
		return this.pace;
	}
}

/**
 * Cycling
 */
class Cycling extends Workout {
	constructor(coords, distance, duration, elevGain) {
		super(coords, distance, duration);
		this.elevGain = elevGain;
		this.type = 'cycling';
		this.calcSpeed();
		this._setDescription();
	}

	calcSpeed() {
		// km/h
		this.speed = this.distance / (this.duration / 60);
		return this.speed;
	}
}

// initalise App
const InitApp = new App();
