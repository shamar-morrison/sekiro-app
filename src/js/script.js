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

let map, mapEvent;

// popup options
const popupOptions = {
	maxWidth: 250,
	minWidth: 100,
	autoClose: false,
	className: 'cycling-popup',
};

// marker options
const markerOptions = {
	riseOnHover: true,
	draggable: true,
};

// initalise map
const initMap = position => {
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
	map = L.map(mapContainer, mapOptions);

	// Tile styles
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	}).addTo(map);

	// initial popup marker when map is first initialised
	// L.marker(coords, markerOptions).addTo(map).bindPopup('Start adding your workouts by clicking anywhere on the map!').openPopup();

	// Event handler for map clicks
	const mapClickHandler = function (event) {
		mapEvent = event; // set mapEvent object to a global variable

		// Reveal form
		form.classList.remove('hidden');
		inputDistance.focus();
	};
	map.on('click', mapClickHandler);
};

const formEventHandler = function (e) {
	e.preventDefault();
	const { lat, lng } = mapEvent.latlng;
	const newCoords = [lat, lng];

	popupOptions.className = inputType.value === 'cycling' ? 'cycling-popup' : 'running-popup';

	// add marker at lat, lng
	L.marker(newCoords, markerOptions).addTo(map).bindPopup('Welcome', popupOptions).openPopup();

	// clear form fields
	document.querySelectorAll('input').forEach(el => {
		el.value = '';
		el.blur();
	});
};

// workout form event listener
form.addEventListener('submit', formEventHandler);

// workout type event listener
inputType.addEventListener('change', () => {
	inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
	inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
});

// get GeoLocation
if (navigator.geolocation) {
	// check if browser supports geolocation API
	navigator.geolocation.getCurrentPosition(initMap, () => {
		document.querySelector('.map-load-failed').classList.remove('hidden');
	});
}
