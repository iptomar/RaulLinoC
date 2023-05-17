/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// when page is loaded, loads home view
window.onload = () => {
    changeView('home');
}

// holds the view that is currently being displayed
let currView = "home";
// holds map object
let map, gpsPosition;
//bool to control current status of the user location marker
let markerExists = false;

// convert coordinates to leaflet object (Abrantes box corners in order to set map bounds)
// these coordinates were acquired without any study (eye estimation)
const UPLEFTCORNER = L.latLng(39.510042, -8.296089);
const DOWNRIGHTCORNER = L.latLng(39.401459, -8.050828);

// use those coordinates to define the bounds of the map
const bounds = L.latLngBounds(UPLEFTCORNER, DOWNRIGHTCORNER);

//ask for geolocation permission
document.addEventListener('deviceready', function () {
    cordova.plugins.diagnostic.requestLocationAuthorization(
        function (status) {
            //different possibilites of permission success, need to check all of them
            if (status == cordova.plugins.diagnostic.permissionStatus.GRANTED || status == cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE) {
                console.log("Permission granted.");
                navigator.geolocation.getCurrentPosition(onSuccess, onError);
            } else {
                console.log("Permission denied.");
                onError("Permission denied. Permission needede for the app run correctly.\nPlease allow acess to location in device settings.");
            }
        }, function (error) {
            console.error("The following error occurred: " + error);
            alert("\nThe following error occurred: " + error.code + " - " + error.message);
        }, false
    );
}, false);

//loads current user location into gpsPosition global variable
function onLocationFound(e) {
    gpsPosition = e.coords;
}

//if the current location couldn't be retrieved, logs an error message
function onLocationError(e) {
    console.error("There was an error getting the current location.");
}

/**
 * Callback function that is called when the user's location is found;
 * Where map is defined
 * 
 * @param {*} position coordinates of the user's location
 */
function onSuccess(position) {
    console.log("Starting map loading.")
    // create the map with
    map = L.map('map', {
        center: [position.coords.latitude, position.coords.longitude],
        maxZoom: 18,
        minZoom: 12,
    }).setView([position.coords.latitude, position.coords.longitude], 12);
 
    // create fullscreen control and add it to the map
    L.control.fullscreen({
        title: 'FullScreen Mode', // change the title of the button, default Full Screen
        titleCancel: 'Exit FullScreen Mode', // change the title of the button when fullscreen is on, default Exit Full Screen
        forceSeparateButton: true, // separate button from zoom buttons
        forcePseudoFullscreen: true // force use of pseudo full screen, makes the fullscreen work incase the api fails
      }).addTo(map);
    
    // sets max bounds
    map.setMaxBounds(bounds);
    //call onLocationFound when user location is found
    map.on('locationfound', onLocationFound);

    // add the OpenStreetMap tiles (making the map usable)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);


    //costum marker    
    const marker = L.icon({
        iconUrl: 'img\\icons\\localizacao_verde.svg',
        iconSize: [50, 50],
        //icon allignment set to bottom mid corner of the icon
        iconAnchor: [25, 50],
        //popup allignment set to top mid corner of the icon
        popupAnchor: [-5, -40]
    });


    // fetches data from json file and add the markers based on the each elemnts coordinates to the map
    fetch("dados_raulLino.json")
        .then(response => response.json())
        .then(json => {
            json.data.forEach(element => {
                L.marker([element.coords[0], element.coords[1]], { icon: marker })
                    .addTo(map)
                    .bindPopup('<a style="cursor:pointer;" onclick="pointsDescription(' + element.id + ');">' + element.title + '</a>');
            });
        });

    //call the refresh function every 5 seconds
    setInterval(refreshUserMarker, 5000);

    //update user coords every 5 seconds
    navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
        maximumAge: 1000,
        timeout: 2000
    });
};

/**
 * Callback function that shows an error message if the user's location is not found (or denied)
 * @param {*} error 
 */
function onError(error) {
    alert("There was an error getting the current location. Please turn on your location.");
    console.log("error code:" + error.code);
    console.log("error message:" + error.message);
}

/**
 * Changes the page view
 * 
 * @param {*} view view to be displayed
 */
function changeView(view) {
    let currViewElem = document.getElementById(currView);

    //hides last view
    currViewElem.style.display = "none";

    //resets last view line color
    if (currView != "desc") {
        document.getElementById(currView + "Line").classList.remove('yellow-divisor');
        document.getElementById(currView + "Line").classList.add('transparent-divisor');
    }

    //sets current view 
    currView = view;

    //shows new view
    currViewElem = document.getElementById(currView);
    currViewElem.style.display = "";

    //sets new view line color
    if (currView != "desc") {
        document.getElementById(currView + "Line").classList.remove('transparent-divisor');
        document.getElementById(currView + "Line").classList.add('yellow-divisor');
    }

    // if current view is map, loads map
    if (currView == "mapPage") {
        map.invalidateSize();
        refreshUserMarker();
    }
}


/**
 * Setup and refresh of the user location marker
 */
function refreshUserMarker() {

    //creates the user icon to be added to the map
    var userIcon = L.icon({
        iconUrl: 'img/icons/userIcon.svg',

        iconSize: [20, 40], // size of the icon
        iconAnchor: [10, 40], // point of the icon which will correspond to marker's location
        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
    });

    //if the user is within the defined bounds, adds or updates his current location into a marker, otherwise removes it if it exists
    if (bounds.contains(new L.latLng(gpsPosition.latitude, gpsPosition.longitude))) {
        if (markerExists) {
            marker.setLatLng([gpsPosition.latitude, gpsPosition.longitude]);
        } else {
            marker = L.marker([gpsPosition.latitude, gpsPosition.longitude], { icon: userIcon })
                .addTo(map)
                .bindPopup('<strong> You are here.</strong>');
            markerExists = true;
        }
    } else {
        if (markerExists) {
            map.removeLayer(marker);
            markerExists = false;
        }
    }
}


/**
 * Creates a new page with the description of the point
 * 
 * @param {*} id id of the point
 */
function pointsDescription(id) {
    var aux = '';
    fetch("dados_raulLino.json")
        .then(response => response.json())
        .then(json => {
            aux += '<div class="container">';
            aux += '<h1 class="display-6">' + json.data[id].title + '</h1><br />';
            aux += '<p>' + json.data[id].info + '</p>';
            aux += '<p>Ano: ' + json.data[id].year + '</p>';
            aux += '<p>Morada: ' + json.data[id].location + '</p>';
            aux += '<p>Tipo de Edifício: ' + json.data[id].type + '</p>';
            aux += '<div>';
            json.data[id].images.forEach(element => {
                aux += '<img  style="max-width:1000px; max-height:800px;" src="' + element + '" class="d-block w-100" ><br />';
                
            });
            aux += '</div></div>';
            document.getElementById("iterPDesc").innerHTML = aux;
        });
    changeView("desc");
}
