/*jshint esversion: 6*/

var x = require('x-ray');


/**
 * The module that holds all the scraper variables and functions
 * @type {Module}
 */
var scraper = !function() {

  var xray = x();

  var shirtInformationTemplate = {
      imageUrl: '.shirt-picture img@src',
      price: '.price',
      title: '.shirt-picture img@alt'
  };

  /**
   * This is a callback function that finds the link where all the shirt links are located at
   * @param  {error} error                      In case of an error, xray throws an error
   * @param  {Array of Strings} possibleLinks   All the links, that xray can scrape form the site is returen with this parameter
   * @return {null}                             We don't return anything
   */
  function findShirts(error, possibleLinks) {
      if (error === null) { //As long as we have no error
          var savedLink = '';
          possibleLinks.forEach(possiblelink => { //We run through all possible links, and look for the link, that contains shirts.php
              if (possiblelink.link.includes('shirts.php')) {
                  savedLink = possiblelink.link; //This link dose so we save it
              }
          });

          if (savedLink !== '') { //If we found a link
              //We will start a new xray scrape of the site
              xray(savedLink, 'a', [{
                  link: '@href'
              }])(getShirts); //We use getShirts as the callback function here
          } else {
              //Do error log here
          }
      } else {
          //Do error stuff here
      }
  }

  /**
   * This callback function that filters away all the links not leading to a shirt.
   * @param  {error} error              In case of an error, xray throws an error
   * @param  {Array of String} links    All the links, that xray can scrape form the site is returen with this variable
   * @return {null}                     We don't retrun anything
   */
  function getShirts(error, links) {
      if (error === null) { //Incase we got an error
          var shirts = []; //Holds all the shirt links
          links.forEach(possibleShirt => { //Search an filter all non shirt links out
              if (possibleShirt.link.includes('shirt.php')) {
                  shirts.push(possibleShirt.link); //We found a shirt link, so we save it
              }
          });
          if (shirts.length > 0) { //Incase no shirt link was found
              getShirtsInformation(shirts); //Call getShirtInformation with the array of shirt link
          } else {
              //Do error log here
          }

      } else {
          //Do error stuff here
      }
  }

  /**
   * This function finds all the nessesary information about every single shirt passed in the shirts parameter
   * @param  {Array of Strings} shirts    Holds links to all the shirts on the site
   * @return {Object}                     We return a JSON object that holds all the different information about each shirt
   */
  function getShirtsInformation(shirts) {
      var numberOfShirts = shirts.length;
      var allTheData = [];
      shirts.forEach(shirt => { //Go through all the shirts
          xray(shirt, '#content', shirtInformationTemplate)(function(error, shirtInformation) {
              numberOfShirts--;
              if (error === null) {//Incase of error
                  shirtInformation.url = shirt; //We add the shirt url here
                  allTheData.push(shirtInformation);
              } else {
                  //Do error stuff here
              }
              /*
              * We have been counting down the when moment when all
              * the shirts have returned either with either a result or none
              * In any case, we have to return the data that we got
              */
              if (numberOfShirts === 0) { //All shirts have returned with thier findings
                  //Return the data
                  console.log(allTheData);
              }
          });
      });
  }

  xray('http://shirts4mike.com', 'a', [{
      link: '@href'
  }])(findShirts);

}();
