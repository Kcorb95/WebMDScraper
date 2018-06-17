const express = require('express');
const fs = require('fs');
const request = require('request-promise');
const cheerio = require('cheerio');

const app = express();
// The zipcode we wish to search
const ZIP_CODE = '12540';
let pageNumber = 1;
let doctorCount = 0;

app.get('/scrape', (req, res) => {
    const options = {
        method: 'GET',
        uri: `https://doctor.webmd.com/results?so=&zip=${ZIP_CODE}&ln=Family%20Medicine&pagenumber=${pageNumber}`,
        headers: {
            'User-Agent': 'Request-Promise',
            'Authorization': 'Basic QWxhZGRpbjpPcGVuU2VzYW1l'
        },
        transform: body => {
            return cheerio.load(body);
        }
    };
    request(options)
        .then(async $ => {
            let output = { doctors: [] };
            output.doctors = output.doctors.concat(fetchResults($));

            let data = await loadPage();
            output.doctors = output.doctors.concat(data);

            // TODO output to file
            console.log(output);
        })
        .catch(err => console.error(err));

    /**
     * This function loads a new page and calls fetchResults to parse the data
     */
    function loadPage() {
        pageNumber++; // Increment the page number
        const options = {
            method: 'GET',
            uri: `https://doctor.webmd.com/results?so=&zip=${ZIP_CODE}&ln=Family%20Medicine&pagenumber=${pageNumber}`,
            headers: {
                'User-Agent': 'Request-Promise',
                'Authorization': 'Basic QWxhZGRpbjpPcGVuU2VzYW1l'
            },
            transform: body => {
                return cheerio.load(body);
            }
        };
        request(options)
            .then(async $ => {
                let results = await fetchResults($);
                return results;
            })
            .catch(err => console.error(err.message));
    }

    /**
     * This function parses the results from an HTML page into valid JSON
     * @param $ the html data
     * @returns {Array} Valid JSON data
     */
    function fetchResults($) {
        const data = $('script')[1].children[0].data; // Data is already in a script tag formatted in JSON for us ezpz
        const dataCleaned = data.substring(data.indexOf('{'), data.indexOf(';')); // strip the garbage leaving pure JSON
        const results = JSON.parse(dataCleaned); // Parse the cleaned string (It's JSON data!) into a valid JSON object
        const out = [];
        for (let result of results.features) {
            out.push({
                firstName: result.properties.firstName,
                lastName: result.properties.lastName,
                phoneNumber: result.properties.phone,
                address: `${result.properties.address} ${result.properties.city}`
            });
            doctorCount++;
        }
        return out;
    }
});
app.listen('8081');
exports = module.exports = app;