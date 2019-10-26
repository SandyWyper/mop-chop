"use-strict";

import { MapApi } from "./apiLoad";
import { checkStatus } from "./lib/checkFetchResponseStatus";
import { initialMapStyling } from "./lib/initialMapStyling";
import { doMapStyles } from "./lib/doMapStyles";
import { Spinner } from "spin.js";
import { spinnerOptions } from "./spinnerOpts";

const _ = require("lodash");

// // Imports the Google Cloud client library.
// const { Storage } = require("@google-cloud/storage");

// // Instantiates a client. If you don't specify credentials when constructing
// // the client, the client library will look for credentials in the
// // environment.
// const storage = new Storage();

// // Makes an authenticated API request.
// storage
//   .getBuckets()
//   .then(results => {
//     const buckets = results[0];

//     console.log("Buckets:");
//     buckets.forEach(bucket => {
//       console.log(bucket.name);
//     });
//   })
//   .catch(err => {
//     console.error("ERROR:", err);
//   });

let map;
let infowindow;
let places = [];
let locationsDisplayed = document.querySelector("#location-details");
let mapWindow = document.querySelector("#map");
let shopCounter = 1;
let spinner;

function callApi() {
    // use static class function to run npm package to make api request
    MapApi.loadGoogleMapsApi()
        .then(res => initApp())
        .catch(e => console.log("api fetch unsuccessful: " + e));
}

function initApp() {
    document.querySelector("#location-details").addEventListener("click", revealInfo);
    document.querySelector("#geolocate").addEventListener("click", getGeoLoc);
    document.querySelector("#location-submit-button").addEventListener("click", getSearchString);

    //autocomplete for location input - restricted to uk results
    const autoOptions = {
        componentRestrictions: { country: "uk" }
    };
    let placeInput = document.querySelector("#location-input-field");
    let autocomplete = new google.maps.places.Autocomplete(placeInput, autoOptions);

    //placeholder map
    map = new google.maps.Map(mapWindow, initialMapStyling);
}

//geolocation - gets users current location
function getGeoLoc() {
    const geoLocationOptions = {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0
    };

    // on success do a geocode search
    function success(pos) {
        let location = {
            coords: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            }
        };
        useLocationDetails(location);
    }

    //error alert in the console and to user
    function failure(err) {
        alert("something went wrong, please enter a location manually");
        console.warn(`Error(${err.code}) : ${err.message}`);
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, failure, geoLocationOptions);
    } else {
        alert("geolocation not supported by your browser");
    }
}

//take user input
function getSearchString(event) {
    event.preventDefault();

    let input = document.querySelector("#location-input-field").value;
    // if user has entered search string then send input to geocode function
    if (input) {
        locationAddressSearch(input);
    } else {
        //if not then - then make a not in the console
        console.log("input empty");
    }
}

// take the user entered location text and use geocode to return the lat-long coordinates
function locationAddressSearch(query) {
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=AIzaSyBfDBAUx0xCfMvsNyNHPea7yR3Fj-8ZLRU`)
        .then(checkStatus)
        .then(res => res.json())
        .then(function(data) {
            let searchLocation = extractGeometry(data.results);
            useLocationDetails(searchLocation);
        })
        .catch(err => console.log("error is : " + err));
}

function extractGeometry(data) {
    const latitude = _.get(data, "[0].geometry.location.lat");
    const longitude = _.get(data, "[0].geometry.location.lng");
    const geometry = {
        coords: {
            lat: latitude,
            lng: longitude
        }
    };
    return geometry;
}

// resests all out-put for a new search
function resetApp() {
    //reset shopCounter
    shopCounter = 1;
    // reset results output
    locationsDisplayed.innerHTML = "";
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

function doMap(location) {
    let latitude = parseFloat(location.coords.lat);
    let longitude = parseFloat(location.coords.lng);
    //   console.log(location.coords.lat, location.coords.lng);

    //   console.log(latitude, longitude);
    let coords = new google.maps.LatLng(latitude, longitude);

    //   let coords = { Lat: latitude, longitude };

    //   console.log("coords = ", coords.lat);
    //
    let options = {
        zoom: 14,
        // center: new google.maps.LatLng(location.coords.lat, location.coords.lng),
        center: coords,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: doMapStyles
    };
    //   console.log(coords);
    //generate map to given location
    map = new google.maps.Map(document.querySelector("#map"), options);
}

function collatePlaceInfo(location) {
    let latitude = parseFloat(location.coords.lat);
    let longitude = parseFloat(location.coords.lng);
    let coords = new google.maps.LatLng(latitude, longitude);
    // sets parameters for places service search
    const request = {
        location: coords, //   center of search coordinates
        radius: "750", //   radius of the search in meters
        type: "hair_care" //   type of establishment to search for
    };

    infowindow = new google.maps.InfoWindow();
    let service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, hairCarePlaces);
}

function hairCarePlaces(results, status, pagination) {
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        results.forEach(function(place, index) {
            if (results[index].user_ratings_total > 4) {
                places.push({
                    placeId: place.place_id,
                    userRating: place.rating,
                    totalRatings: place.user_ratings_total
                });
            }
        });
        if (pagination.hasNextPage === true) {
            // console.log("has next page available");

            // this runs the callback function again with the next set of results
            // max 2 additional pages of results. total 60 results.
            pagination.nextPage();
        } else {
            // once all the places have been logged, order them in desecending order by rating
            let sortedByRating = _.orderBy(places, ["userRating", "totalRatings"], ["desc"]);

            // then just take the top five
            let topFiveSalons = _.take(sortedByRating, 5);
            // getAdditionalDetails(topFiveSalons);
            if (topFiveSalons.length > 0) {
                getAdditionalDetails(topFiveSalons);
            } else {
                unsuccsesfulSearch("reviews");
            }
        }
    } else {
        unsuccsesfulSearch("results");
    }
}

function unsuccsesfulSearch(r) {
    spinner.stop();

    //placeholder map
    map = new google.maps.Map(mapWindow, initialMapStyling);

    resetApp();

    if (r === "results") {
        alert("sorry, no results in that area");
    } else if (r === "reviews") {
        alert("Sorry, mop-chop-shops need at least 5 reviews");
    }
}

function getAdditionalDetails(salons) {
    let service = new google.maps.places.PlacesService(map);

    salons.forEach(function(shop) {
        let request = {
            placeId: shop.placeId,
            fields: [
                "name",
                "place_id",
                "formatted_address",
                "geometry",
                "photo",
                "user_ratings_total",
                "formatted_phone_number",
                "opening_hours",
                "website",
                "rating",
                "review"
            ]
        };
        service.getDetails(request, theseShops);
    });

    spinner.stop();
    let scrollToMap = document.querySelector("#map");
    scrollToMap.scrollIntoView({ behavior: "smooth" });
}

function theseShops(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        createMarker(results);

        locationsDisplayed.innerHTML += `
        <section class="location">
            <div class="location-main-section" id="${results.place_id}-section" data-id="${results.place_id}">
                <h1>${shopCounter}</h1>
                <div class="name-ratings">
                    <div class="name">
                        <h3>${results.name}</h3>
                    </div>
                    <div class="ratings">
                        <h3>Rating: ${results.rating} / 5 &nbsp; &nbsp;</h3>
                        <h5><em>From ${results.user_ratings_total} ratings</em></h5>
                    </div>
                </div>
                <div class="more-info" id="${results.place_id}-down-arrow">
                <h1>&#8964;</h1>
                </div>
            </div>
          
            <div id="${results.place_id}-hidden-section" class="shown hide">
                <div class="details">
                   <div class="open-phone-address">
                        <div class="address">
                            <p>${results.formatted_address}</p>
                        </div>
                        <div class="open-hours" id="${results.place_id}-open-hours">
                            <p><strong>Opening times:</strong></p>
                        </div>
                        <div>
                          <div class="phone-number" >
                              <a href="tel:${results.formatted_phone_number}" style="display:flex;"><img src="./images/telephone.svg" class="phone-icon"><p> : ${results.formatted_phone_number}</p></a>
                          </div>
                          <div class="website-link" id="${results.place_id}-website-link">
                          </div>
                        </div>
                    </div>
                    <div class="photos">    
                        <div class="photos" id="${results.place_id}-photos">
                        </div>

                    </div> 
                </div>           
                <div class="reviews" id="${results.place_id}-reviews">
                    <h2>User reviews:</h2>
                    <br>
                </div>
            </div>
        </section>
            `;

        if (results.website) {
            document.querySelector(`#${results.place_id}-website-link`).innerHTML += `
             <a href="${results.website}" target="_blank" style="display:flex;"><img src="./images/website.png"><p>: Check out our website!</p></a>
            `;
        }

        if (results.opening_hours) {
            let openingTimes = results.opening_hours.weekday_text;
            openingTimes.forEach(
                day =>
                    (document.querySelector(`#${results.place_id}-open-hours`).innerHTML += `
                <p>${day}</p>
            `)
            );
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
                    <p><strong>Rating : ${userReviews[x].rating}</strong> &nbsp;${userReviews[x].text}</p>
                    <p><b>${userReviews[x].author_name}</b>  ${userReviews[x].relative_time_description}</p>
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
            let photos = _.take(results.photos, 3);
            photos.forEach(function(pic) {
                let eachPhoto = pic.getUrl({ maxWidth: 150, maxHeight: 150 });
                document.querySelector(`#${results.place_id}-photos`).innerHTML += `
                 <img src="${eachPhoto}">

                `;
            });
        }
        // increase search result counter by one
        shopCounter++;
    }
}

function createMarker(place) {
    //set the icon image and size preferences
    const iconImage = {
        url: `./images/number-icons/number_${shopCounter}.png`,
        scaledSize: new google.maps.Size(35, 35)
    };
    console.log(place);
    //create a marker
    let marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: iconImage
    });

    //instill each info window with content and the abitlity to open upon click event
    google.maps.event.addListener(marker, "click", function() {
        //info window content
        infowindow.setContent(place.name);
        infowindow.open(map, this);
    });
}

function revealInfo(event) {
    // finds the nearest thing with a given class from the click target
    if (event.target.closest(".location-main-section")) {
        let boxToExpand = event.target.closest(".location-main-section");
        let id = boxToExpand.dataset.id;
        // use the place_id from this section to reveal the correct box
        document.querySelector(`#${id}-hidden-section`).classList.toggle("hide");
        // document.querySelector(`.${id}-hidden-section`).style.height = '900px';
        document.querySelector(`#${id}-down-arrow`).classList.toggle("spin");
        document.querySelector(`#${id}-section`).classList.toggle("active");
    }
}

window.onload = callApi();
