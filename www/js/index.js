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

// holds the view that is currently being displayed
let currView = "home";
// holds map object
let map, gpsPosition;
//bool to control current status of the user location marker
let markerExists = false;

// convert coordinates to leaflet object (Abrantes box corners in order to set map bounds)
// these coordinates were acquired without any study (eye estimation)
const UPLEFTCORNER = L.latLng(39.509396, -8.263140);
const DOWNRIGHTCORNER = L.latLng(39.402366, -8.169918);

// use those coordinates to define the bounds of the map
const bounds = L.latLngBounds(UPLEFTCORNER, DOWNRIGHTCORNER);

// Wait for the deviceready event before using any of Cordova's device APIs.
document.addEventListener('deviceready', onDeviceReady, false);

// Cordova is ready
function onDeviceReady() {
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

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

    // create the map with
    map = L.map('map', {
        center: [position.coords.latitude, position.coords.longitude],
        maxZoom: 18,
        minZoom: 12,
    }).setView([position.coords.latitude, position.coords.longitude], 12);
    
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
                L.marker([element.coords[0], element.coords[1]], { icon: marker }).addTo(map).bindPopup(element.title);
            });
        });
};

/**
 * Callback function that shows an error message if the user's location is not found (or denied)
 * @param {*} error 
 */
function onError(error) {
    console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}

/**
 * Changes the page view
 * 
 * @param {*} view view to be displayed
 */
function changeView(view) {
    //hides last view
    let currViewElem = document.getElementById(currView).style.display = "none";
    //resets last view line color
    document.getElementById(currView + "Line").style.backgroundColor = "#FFFFFF";
    //sets current view 
    currView = view;

    //shows new view
    currViewElem = document.getElementById(currView).style.display = "block";
    //sets new view line color
    document.getElementById(currView + "Line").style.backgroundColor = "#e2d301";

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
    if (bounds.contains( new L.latLng(gpsPosition.latitude, gpsPosition.longitude))) {
        if (markerExists) {
            marker.setLatLng([gpsPosition.latitude, gpsPosition.longitude]);
        } else {
            marker = L.marker([gpsPosition.latitude, gpsPosition.longitude], {icon: userIcon})
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

//call the refresh function every 5 seconds
setInterval(refreshUserMarker, 5000);

//gets user location every 5 seconds
navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
    maximumAge: 1000,
    timeout: 5000
});
