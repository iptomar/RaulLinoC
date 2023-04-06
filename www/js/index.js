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
let map;

// Wait for the deviceready event before using any of Cordova's device APIs.
document.addEventListener('deviceready', onDeviceReady, false);

// Cordova is ready
function onDeviceReady() {
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

/**
 * Callback function that is called when the user's location is found;
 * Where map is defined
 * 
 * @param {*} position coordinates of the user's location
 */
function onSuccess(position) {
    // convert coordinates to leaflet object (Abrantes box corners in order to set map bounds)
    // these coordinates were acquired without any study (eye estimation)
    const UPRIGHTCORNER = L.latLng(39.494334, -8.270672);
    const DOWNLEFTCORNER = L.latLng(39.419585, -8.105805);

    // use those coordinates to define the bounds of the map
    const bounds = L.latLngBounds(UPRIGHTCORNER, DOWNLEFTCORNER);

    // create the map with the bound
    map = L.map('map', {
        center: [position.coords.latitude, position.coords.longitude],
        maxZoom: 18,
        minZoom: 14,
    }).setView([position.coords.latitude, position.coords.longitude], 13);

    // sets max bounds
    map.setMaxBounds(bounds);

    // add the OpenStreetMap tiles (making the map usable)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
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
    let currViewElem = document.getElementById(currView).style.display = "none";

    //sets current view 
    currView = view;

    currViewElem = document.getElementById(currView).style.display = "block";

    // if current view is map, loads map
    if (currView == "mapPage") {
        map.invalidateSize();
    }
}
