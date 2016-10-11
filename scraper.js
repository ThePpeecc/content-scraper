/*jshint esversion: 6*/

/**
 * X-ray is a module designed for scraper scripts
 * I use this module because it allows me to write less http code, while it takes care of the scraping on the web.
 * It is  well suported with 25 contributers and the last commit to the project having been added 6-days ago, as i write this
 * It dose use outdated modules, but since I only use two npm modules in this project it should not be a problem
 * Compared to other scraper modules, X-ray is very flexible and much better supported.
 * I could have used request for scraping the website , and then searching for the information i need.
 * But X-ray has the awesome option of adding JSON as a parameter, wich it will automaticly populate with data
 * depending on what css selectors I use
 * @type {Module}
 */
const x = require('x-ray');

/**
 * json2csv is a module that has many different and powerfull features for converting json to csv
 * It is a really well supported module with the last update having been released 3 weeks ago
 * It also has a large group of 33 contributers to the source code
 * Since this is a small module, json2csv is more than enough
 * @type {Module}
 */
const json2csv = require('json2csv');

const fs = require('fs');

/**
 * The module that holds all the scraper variables and functions
 * @type {Module}
 */
var scraper = ! function() {

    const xray = x(); //It should not change so we just make it a constant
    const siteLink = 'http://shirts4mike.com'; //The frontpage url should not change, so we define it at the start

    /**
     * Is a template for how the data for the shirts is going to be found and procesed to cvs
     * @type {Object}
     */
    var shirtInformationTemplate = {
        Title: '.shirt-picture img@alt',
        Price: '.price',
        ImageURL: '.shirt-picture img@src',
        URL: '',
        Time: ''
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
                errorLog(error);
            }
        } else {
            //Do error stuff here
            errorLog(error);
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
                errorLog(error);
            }

        } else {
            //Do error log here
            errorLog(error);
        }
    }

    /**
     * This function finds all the nessesary information about every single shirt passed in the shirts parameter
     * @param  {Array of Strings} shirts    Holds links to all the shirts on the site
     * @return {null}                       We don't return anything
     */
    function getShirtsInformation(shirts) {
        var numberOfShirts = shirts.length;
        var allTheData = []; //The data we want to save
        shirts.forEach(shirt => { //Go through all the shirts
            xray(shirt, '#content', shirtInformationTemplate)(function(error, shirtInformation) {
                numberOfShirts--;
                if (error === null) { //Incase of error
                    shirtInformation.URL = shirt; //We add the shirt url here
                    shirtInformation.Time = new Date().toLocaleString(); //We add the timestamp here
                    allTheData.push(shirtInformation);
                } else {
                    errorLog(error); //We log the error
                }
                /*
                 * We have been counting down the when moment when all
                 * the shirts have returned from their async request
                 * either with either a result or nonthing.
                 * In any case, we have to return the data that we got
                 */
                if (numberOfShirts === 0) { //All shirts have returned with thier findings
                    var fileName = getDate() + '.csv';
                    saveData(convertJSONtoCSV(allTheData), fileName, './data'); //Save the data at ./data
                }
            });
        });
    }

    /**
     * Gets the toLocaleDateString() in a different format, explanation is in the function
     * @return {String}   we return a modified date string
     */
    function getDate() {
        /*
         * Because the javascript .toLocaleDateString() returns a
         * string in this (dd/mm/yyyy) format. It screws with the file system
         * therefore I split it by the / and restich the string with - instead
         * We also reverse the date so the format should look like this (yyyy-mm-dd)
         */
        var dateToFix = new Date().toLocaleDateString().split("/").reverse();
        return dateToFix[0] + "-" + dateToFix[2] + "-" + dateToFix[1];
    }

    /**
     * Helper funciton that takes care of the conversion between JSON and CSV
     * @param  {json} JSON         The JSON data that is needed to be converted
     * @return {String (CSV)}      Return's a string formatted in csv
     */
    function convertJSONtoCSV(JSON) {
        var fields = [];
        for (let field in JSON[0]) { //We take a sample object from the json object
            fields.push(field); //And we take all of it's properties and save them in fields
        }

        try { //We try to convert the json file to a CSV file
            var result = json2csv({
                data: JSON,
                fields: fields
            });
            return result; //and we retrun the csv file
        } catch (error) {
            // Errors are thrown for bad options, or if the data is empty and no fields are provided.
            errorLog(error); //We log the error
        }
    }


    /**
     * Save's data to a defined folder, or creates the folder
     * @param  {String} data   The data to be saved
     * @param  {String} file   The file name
     * @param  {String} folder The folder name
     * @return {null}          We don't return anything
     */
    function saveData(data, file, folder) {
        //Here we try to find the folder and write the data to the file
        //If the file already exist, we just override it
        fs.writeFile(folder + '/' + file, data, (error) => {
            if (error !== null) { //In case we get an error
                if (error.code === 'ENOENT') { //If the error is because we can't find the specified folder,
                    console.log(folder + ' folder not found. Creating a new folder');
                    fs.mkdirSync(folder); //We create the folder
                    saveData(data, file, folder); //and try to save the data again with the same parameters
                } else {
                    //Log error
                    errorLog(error);
                }
            }
        });
    }

    /**
     * Function that logs an to the console and in the shape of an error log in error-logs folder
     * @param  {error} error  Any type of an error
     * @return {null}         We don't return anything
     */
    function errorLog(error) {
        var text = '[' + new Date().toLocaleString() + '] { \nError in scraper.js: '; //Base string top
        switch (error.code) { //Here we run thorugh error code where we know the cause
            case 'ENOTFOUND': //Cold not connect or find the url
                text += 'Could not connect to url, either the connection is not stable or the url is invalid \n';
                break;
            default:
                text += error.message;
                break;
        }
        text += 'Error-details: [ '; //We add the details of the error message at the bottom
        for (let errorPart in error) { //We add all the differet error parts in the error object
            text += '\n ' + errorPart + ': ' + error[errorPart];
        }
        text += '\n]}\n';
        console.log(text); //Log the error to the console
        //Last but not least we save a log of the error
        fs.appendFile('./scraper-error.log', text);
    }

    /**
     * We try to scrape all links off the front page, and trow them into the findShirts callback function,
     * That is also the function that starts the entire networking
     * @type {X-Ray}
     */
    xray(siteLink, 'a', [{
        link: '@href'
    }])(findShirts);
}();
