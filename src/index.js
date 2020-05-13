'use-strict';

import { MapApi } from './apiLoad';
import { checkStatus } from './lib/checkFetchResponseStatus';
import { initialMapStyling } from './lib/initialMapStyling';
import { doMapStyles } from './lib/doMapStyles';
import { Spinner } from 'spin.js';
import { spinnerOptions } from './spinnerOpts';
// import '../owlcarousel/owl.carousel.css';
// import '../owlcarousel/owl.carousel';

const _ = require('lodash');

let map;
let infowindow;
let places = [];
let searchRadius;
let establishmentType;
let mapWindow = document.querySelector('#map');
let shopCounter = 1;
let spinner;

const resultsDisplayArea = document.querySelector('#title-results');
const form = document.querySelector('#form');

form.onsubmit = (event) => {
  event.preventDefault();
  const searchLocationString = event.target['location-input-field'].value;
  searchRadius = event.target['search-radius'].value;
  establishmentType = event.target['place-type'].value;
  // if user has entered search string then send input to geocode function
  if (searchLocationString) {
    locationAddressSearch(searchLocationString);
  } else {
    //if not then - then make a not in the console
    console.log('input empty');
    getGeoLoc();
  }
};

function getStartedByCallingApi() {
  textAnimate();
  // use static class function to run npm package to make api request
  MapApi.loadGoogleMapsApi()
    .then((res) => initApp())
    .catch((e) => console.log('api fetch unsuccessful: ' + e));
}

function initApp() {
  // document
  //   .querySelector('#location-details')
  //   .addEventListener('click', revealInfo);
  // document.querySelector('#geolocate').addEventListener('click', getGeoLoc);

  //autocomplete for location input - restricted to uk results

  const autoOptions = {
    componentRestrictions: { country: 'uk' },
  };
  let placeInput = document.querySelector('#location-input-field');
  let autocomplete = new google.maps.places.Autocomplete(
    placeInput,
    autoOptions
  );

  //placeholder map
  map = new google.maps.Map(mapWindow, initialMapStyling);
}

//geolocation - gets users current location
function getGeoLoc(event) {
  // event.preventDefault();

  const geoLocationOptions = {
    enableHighAccuracy: true,
    timeout: 7000,
    maximumAge: 0,
  };

  // on success do a geocode search
  function success(pos) {
    let location = {
      coords: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      },
    };
    searchRadius = document.querySelector('#search-radius').value;
    establishmentType = document.querySelector('#place-type').value;
    useLocationDetails(location);
  }

  //error alert in the console and to user
  function failure(err) {
    alert('something went wrong, please enter a location manually');
    console.warn(`Error(${err.code}) : ${err.message}`);
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      success,
      failure,
      geoLocationOptions
    );
  } else {
    alert('geolocation not supported by your browser');
  }
}

// take the user entered location text and use geocode to return the lat-long coordinates
function locationAddressSearch(query) {
  fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=AIzaSyCcGxKvLuBbTLpuQYStdXpa0aGiUuZr1DI`
  )
    .then(checkStatus)
    .then((res) => res.json())
    .then(function (data) {
      let searchLocation = extractGeometry(data.results);
      useLocationDetails(searchLocation);
    })
    .catch((err) => console.log('error is : ' + err));
}

function extractGeometry(data) {
  const latitude = _.get(data, '[0].geometry.location.lat');
  const longitude = _.get(data, '[0].geometry.location.lng');
  const geometry = {
    coords: {
      lat: latitude,
      lng: longitude,
    },
  };
  return geometry;
}

// resests all out-put for a new search
function resetApp() {
  //reset shopCounter
  shopCounter = 1;
  // reset results output
  // resultsDisplayArea.innerHTML = '';
  //reset array of search result places
  places = [];
}

function useLocationDetails(location) {
  resetApp();

  doMap(location);
  // while the search is being completed, show a spinning wheel
  spinner = new Spinner(spinnerOptions).spin(mapWindow);
  //start to get info on nearby hairdressers from the places api
  collatePlaceInfo(location);
}
//depending on the size of the search radius, decide what zoom setting to display the map on.
function zoomEtents() {
  switch (searchRadius) {
    case '500':
      return 15;
    // break;
    case '1000':
      return 14;
    // break;
    case '2000':
      return 13;
    case '3000':
      return 13;
    case '4000':
      return 13;
    case '5000':
      return 12;
    default:
      return 13;
  }
}

function doMap(location) {
  let latitude = parseFloat(location.coords.lat);
  let longitude = parseFloat(location.coords.lng);

  let coords = new google.maps.LatLng(latitude, longitude);

  let options = {
    zoom: zoomEtents(),
    center: coords,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: doMapStyles,
  };

  //generate map to given location
  map = new google.maps.Map(document.querySelector('#map'), options);
}

function collatePlaceInfo(location) {
  let latitude = parseFloat(location.coords.lat);
  let longitude = parseFloat(location.coords.lng);
  let coords = new google.maps.LatLng(latitude, longitude);
  // sets parameters for places service search
  const request = {
    location: coords, //   center of search coordinates
    radius: searchRadius, //   radius of the search in meters
    type: establishmentType, //   type of establishment to search for
  };

  infowindow = new google.maps.InfoWindow();
  let service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, hairCarePlaces);
}

function hairCarePlaces(results, status, pagination) {
  if (
    status === google.maps.places.PlacesServiceStatus.OK &&
    results.length > 0
  ) {
    results.forEach(function (place, index) {
      if (results[index].user_ratings_total > 4) {
        places.push({
          placeId: place.place_id,
          userRating: place.rating,
          totalRatings: place.user_ratings_total,
        });
      }
    });
    if (pagination.hasNextPage === true) {
      // this runs the callback function again with the next set of results
      // max 2 additional pages of results. total 60 results.
      pagination.nextPage();
    } else {
      // once all the places have been logged, order them in desecending order by rating
      let sortedByRating = _.orderBy(
        places,
        ['userRating', 'totalRatings'],
        ['desc']
      );

      // then just take the top five
      let topFiveSalons = _.take(sortedByRating, 5);
      // getAdditionalDetails(topFiveSalons);
      if (topFiveSalons.length > 0) {
        getAdditionalDetails(topFiveSalons);
      } else {
        unsuccsesfulSearch('reviews');
      }
    }
  } else {
    unsuccsesfulSearch('results');
  }
}

function unsuccsesfulSearch(r) {
  spinner.stop();

  //placeholder map
  map = new google.maps.Map(mapWindow, initialMapStyling);

  resetApp();

  if (r === 'results') {
    alert('sorry, no results in that area');
  } else if (r === 'reviews') {
    alert('Sorry, mop-chop-shops need at least 5 reviews');
  }
}

function getAdditionalDetails(salons) {
  let service = new google.maps.places.PlacesService(map);
  resultsLayout();
  salons.forEach(function (shop) {
    let request = {
      placeId: shop.placeId,
      fields: [
        'name',
        'place_id',
        'formatted_address',
        'geometry',
        'photo',
        'user_ratings_total',
        'formatted_phone_number',
        'opening_hours',
        'website',
        'rating',
        'review',
      ],
    };
    service.getDetails(request, theseShops);
  });
  document
    .querySelector('#title-results')
    .addEventListener('click', revealInfo);
  spinner.stop();
  let scrollToMap = document.querySelector('#map');
  scrollToMap.scrollIntoView({ behavior: 'smooth' });
}

function theseShops(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    createMarker(results);

    resultsDisplayArea.innerHTML += `
        <div class="location">
            <div class="location-main-section" id="${results.place_id}-section" data-id="${results.place_id}">
                <h1>${shopCounter}</h1>
                <div class="name-ratings">
                    <div class="name">
                        <h5>${results.name}</h5>
                    </div>
                    <div class="ratings">
                        <h5>Rating: ${results.rating} / 5 &nbsp; &nbsp;</h5>
                        <h6><em>From ${results.user_ratings_total} ratings</em></h6>
                    </div>
                </div>
                <div class="more-info" id="${results.place_id}-down-arrow">
                <h2>&#8964;</h2>
                </div>
            </div>
          
            <div id="${results.place_id}-hidden-section" class="shown hide">
                <div class="details">
                   <div class="open-phone-address">
                        <div class="address">
                            <p>${results.formatted_address}</p>
                        </div>
                        <div class="open-hours" id="${results.place_id}-open-hours">
                            <h5>Opening times:</h5>
                        </div>
                        <div>
                          <div class="phone-number" id="${results.place_id}-phone">
                          </div>
                          <div class="website-link" id="${results.place_id}-website-link">
                          </div>
                        </div>
                    </div>
                    <div class="photo-carousel" id="${results.place_id}-photos">
                    </div>
                </div>           
                <div class="reviews" id="${results.place_id}-reviews">
                    <h2>User reviews:</h2>
                    <br>
                </div>
            </div>
        </div>
            `;
    if (results.formatted_phone_number) {
      document.querySelector(`#${results.place_id}-phone`).innerHTML += `
              <a href="tel:${results.formatted_phone_number}" style="display:flex;"><img src="./images/telephone.svg" class="phone-icon"><p> : ${results.formatted_phone_number}</p></a>                    `;
    }
    if (results.website) {
      document.querySelector(`#${results.place_id}-website-link`).innerHTML += `
             <a href="${results.website}" target="_blank">${results.website}</a>
            `;
    }

    if (results.opening_hours) {
      let openingTimes = results.opening_hours.weekday_text;
      openingTimes.forEach((day) => {
        document.querySelector(`#${results.place_id}-open-hours`).innerHTML += `
                <div class="opening-days"><p>${day.substr(
                  0,
                  day.indexOf(':')
                )}:</p><p>${day.substr(day.indexOf(':') + 1)}</p></div>
            `;
      });
    } else {
      document.querySelector(`#${results.place_id}-open-hours`).innerHTML += `
                            <p>No opening times avaiable</p>
                        `;
    }

    if (results.reviews) {
      let userReviews = results.reviews;
      for (let x = 0; x < userReviews.length; x++) {
        document.querySelector(`#${results.place_id}-reviews`).innerHTML += `
                <div>
                    <h5>Rating : ${userReviews[x].rating}</h5> <p>${userReviews[x].text}</p>
                    <p><em>${userReviews[x].author_name}</em>  ${userReviews[x].relative_time_description}</p>
                    <br>
                </div>
            `;
      }
    } else {
      document.querySelector(`#${results.place_id}-reviews`).innerHTML += `
                            <p>No reviews avaiable</p>
                        `;
    }

    if (results.photos) {
      let photos = _.take(results.photos, 5);
      photos.forEach(function (pic) {
        let eachPhoto = pic.getUrl({ maxHeight: 150 });
        document.querySelector(`#${results.place_id}-photos`).innerHTML += `
                 <img src="${eachPhoto}" alt="${results.name}">
                `;
      });
      // initCarousel(results.place_id);
    }
    // increase search result counter by one
    shopCounter++;
  }
}

function createMarker(place) {
  //set the icon image and size preferences
  const iconImage = {
    url: `./images/number-icons/number_${shopCounter}.png`,
    scaledSize: new google.maps.Size(35, 35),
  };
  //create a marker
  let marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    icon: iconImage,
  });

  //instill each info window with content and the abitlity to open upon click event
  google.maps.event.addListener(marker, 'click', function () {
    //info window content
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}

function revealInfo(event) {
  // finds the nearest thing with a given class from the click target
  if (event.target.closest('.location-main-section')) {
    let boxToExpand = event.target.closest('.location-main-section');
    let id = boxToExpand.dataset.id;
    // use the place_id from this section to reveal the correct box
    document.querySelector(`#${id}-hidden-section`).classList.toggle('hide');
    document.querySelector(`#${id}-down-arrow`).classList.toggle('spin');
    document.querySelector(`#${id}-section`).classList.toggle('activeTab');
  }
}

function resultsLayout() {
  // reset results output
  resultsDisplayArea.innerHTML = '';
  injectHeader();
  resultsDisplayArea.style['grid-row'] = '1 / 3';
}

function injectHeader() {
  resultsDisplayArea.innerHTML += `
  <div class="title-bar-small">
    <a href='/'><h1>High-5!</h1></a>
  </div>
  `;
}

// credit to Gregory Schier for this cool typing effect
// https://codepen.io/gschier/pen/jkivt
var TxtRotate = function (el, toRotate, period) {
  this.toRotate = toRotate;
  this.el = el;
  this.loopNum = 0;
  this.period = parseInt(period, 10) || 2000;
  this.txt = '';
  this.tick();
  this.isDeleting = false;
};

TxtRotate.prototype.tick = function () {
  var i = this.loopNum % this.toRotate.length;
  var fullTxt = this.toRotate[i];

  if (this.isDeleting) {
    this.txt = fullTxt.substring(0, this.txt.length - 1);
  } else {
    this.txt = fullTxt.substring(0, this.txt.length + 1);
  }

  this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';

  var that = this;
  var delta = 300 - Math.random() * 100;

  if (this.isDeleting) {
    delta /= 2;
  }

  if (!this.isDeleting && this.txt === fullTxt) {
    delta = this.period;
    this.isDeleting = true;
  } else if (this.isDeleting && this.txt === '') {
    this.isDeleting = false;
    this.loopNum++;
    delta = 500;
  }

  setTimeout(function () {
    that.tick();
  }, delta);
};

function textAnimate() {
  var elements = document.getElementsByClassName('txt-rotate');
  for (var i = 0; i < elements.length; i++) {
    var toRotate = elements[i].getAttribute('data-rotate');
    var period = elements[i].getAttribute('data-period');
    if (toRotate) {
      new TxtRotate(elements[i], JSON.parse(toRotate), period);
    }
  }
  // INJECT CSS
  var css = document.createElement('style');
  css.type = 'text/css';
  css.innerHTML = '.txt-rotate > .wrap { border-right: 0.08em solid #666 }';
  document.body.appendChild(css);
}
window.onload = getStartedByCallingApi();
