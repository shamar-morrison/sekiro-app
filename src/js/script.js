'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
		});

		// workout type event listener
		inputType.addEventListener('change', this._toggleElevationField);
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
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this._mapObj);

		// initial popup marker when map is first initialised
		// L.marker(coords, markerOptions).addTo(map).bindPopup('Start adding your workouts by clicking anywhere on the map!').openPopup();

		// Event handler for map clicks
		this._mapObj.on('click', event => this._showForm(event));
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
				<h2 class="workout__title">Running on April 14</h2>
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
					<span class="workout__value">${workout.calcPace()}</span>
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
					<h2 class="workout__title">Cycling on ${workout.date.toString()}</h2>
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
						<span class="workout__value">${workout.calcSpeed()}</span>
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

		containerWorkouts.insertAdjacentHTML('beforeend', workoutHTML);
	}

	_renderWorkoutMarker(workout) {
		L.marker(workout.coords, markerOptions)
			.addTo(this._mapObj)
			.bindPopup(L.popup(popupOptions))
			.setPopupContent(workout.distance + '')
			.openPopup();
	}

	_hideForm() {}

	_toggleElevationField() {
		inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
		inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
	}

	_moveToPopup() {}

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

	_setDescription() {}
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
	}

	calcSpeed() {
		// km/h
		this.speed = this.distance / (this.duration / 60);
		return this.speed;
	}
}

// initalise App
const InitApp = new App();
