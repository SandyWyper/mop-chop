'use-strict';

import textAnimate from './lib/animateText';

import { MapApi } from './apiLoad';
import { checkStatus } from './lib/checkFetchResponseStatus';
import { initialMapStyling } from './lib/initialMapStyling';
import { doMapStyles } from './lib/doMapStyles';
import { Spinner } from 'spin.js';
import { spinnerOptions } from './spinnerOpts';
import { truncateString } from './lib/truncateString';
import { readyResultsArea } from './lib/readyResultsArea';
import { zoomExtents } from './lib/zoomExtents';

const _ = require('lodash');

let map;
let infowindow;
let places = [];
let placesResults = [];
let searchRadius;
let establishmentType;
let requestCount;
let spinner;
const resultsDisplayArea = document.querySelector('#title-results');
const mapWindow = document.querySelector('#map');

function initApp() {
  // init text animation in subheading
  textAnimate();
  // use static class function to run npm package to make api request
  MapApi.loadGoogleMapsApi()
    .then((res) => readyApp())
    .catch((e) => console.log('api fetch unsuccessful: ' + e));
}

function readyApp() {
  //autocomplete for location input - restricted to uk results
  const autoOptions = {
    componentRestrictions: { country: 'uk' },
  };
  let placeInput = document.querySelector('#location-input-field');
  let autocomplete = new google.maps.places.Autocomplete(placeInput, autoOptions);

  //placeholder map
  map = new google.maps.Map(mapWindow, initialMapStyling);
}

// Listen for user input and handle
const form = document.querySelector('#form');
form.onsubmit = (event) => {
  event.preventDefault();

  //reset array of search result places
  places = [];

  const searchLocationString = event.target['location-input-field'].value;
  searchRadius = event.target['search-radius'].value;
  establishmentType = event.target['place-type'].value;
  // if user has entered search string then send input to geocode function
  if (searchLocationString) {
    locationAddressSearch(searchLocationString);
  } else {
    //if not then get the users location by
    getGeoLoc(searchRadius, establishmentType);
  }
};

//geolocation - gets users current location
function getGeoLoc() {
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
    navigator.geolocation.getCurrentPosition(success, failure, geoLocationOptions);
  } else {
    alert('geolocation not supported by your browser');
  }
}

// take the user entered location text and use geocode to return the lat-long coordinates
function locationAddressSearch(query) {
  fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=AIzaSyCcGxKvLuBbTLpuQYStdXpa0aGiUuZr1DI`)
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

function useLocationDetails(location) {
  doMap(location);
  // while the search is being completed, show a spinning wheel
  spinner = new Spinner(spinnerOptions).spin(mapWindow);
  //start to get info on nearby hairdressers from the places api
  collatePlaceInfo(location);
}

function doMap(location) {
  let latitude = parseFloat(location.coords.lat);
  let longitude = parseFloat(location.coords.lng);

  let coords = new google.maps.LatLng(latitude, longitude);

  let options = {
    zoom: zoomExtents(searchRadius),
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
  service.nearbySearch(request, searchPlaces);
}

function searchPlaces(results, status, pagination) {
  if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
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
      // once all the places have been logged, order them in desecending order by rating.
      const sortedByRating = _.orderBy(places, ['userRating'], ['desc']);

      // then just take the top five
      let topFive = _.take(sortedByRating, 5);
      // keep a log of how many request will be made
      requestCount = topFive.length;

      // getAdditionalDetails(topFiveSalons);
      if (topFive.length > 0) {
        getAdditionalDetails(topFive);
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

  if (r === 'results') {
    alert('sorry, no results in that area');
  } else if (r === 'reviews') {
    alert('Sorry, mop-chop-shops need at least 5 reviews');
  }
}

function getAdditionalDetails(topFive) {
  let service = new google.maps.places.PlacesService(map);

  readyResultsArea(resultsDisplayArea);

  topFive.forEach(function (shop) {
    let request = {
      placeId: shop.placeId,
      fields: ['name', 'place_id', 'formatted_address', 'geometry', 'photo', 'user_ratings_total', 'formatted_phone_number', 'opening_hours', 'website', 'rating', 'review'],
    };
    service.getDetails(request, addResultToArray);
  });
  document.querySelector('#title-results').addEventListener('click', revealInfo);
  spinner.stop();
}

function addResultToArray(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    placesResults.push(results);
  }
  if (placesResults.length === requestCount) {
    const sortedByRatingAgain = _.orderBy(
      placesResults,
      // ['userRating', 'totalRatings'],
      ['rating'],
      ['desc']
    );
    sortedByRatingAgain.forEach((place, index) => {
      theseShops(place, index);
    });
  }
}

function theseShops(results, index) {
  createMarker(results, index);

  resultsDisplayArea.innerHTML += `
        <div class="location">
            <div class="location-main-section" id="${results.place_id}-section" data-id="${results.place_id}">
                <h1>${index + 1}</h1>
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
    const webUrlShort = truncateString(results.website, 35);
    document.querySelector(`#${results.place_id}-website-link`).innerHTML += `
             <a href="${results.website}" target="_blank">${webUrlShort}</a>
            `;
  }

  if (results.opening_hours) {
    let openingTimes = results.opening_hours.weekday_text;
    openingTimes.forEach((day) => {
      document.querySelector(`#${results.place_id}-open-hours`).innerHTML += `
                <div class="opening-days"><p>${day.substr(0, day.indexOf(':'))}:</p><p>${day.substr(day.indexOf(':') + 1)}</p></div>
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
  }
}

function createMarker(place, index) {
  //set the icon image and size preferences
  const iconImage = {
    url: `./images/number-icons/number_${index}.png`,
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

window.onload = initApp();
