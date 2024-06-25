import {convertURL, handleTooltips} from './util.js';

const urlInput = $('.input input');
const exampleUrl = $('.example .url');
const resultUrl = $('#result .url');
const resultDescription = $('#result p.description');
const resultCopy = $('div.result i#copy');
const addDataSource = $('div.result button#addSource');
const addDataSourceDiv = $('div.result div#addSourceDiv');
const exampleFillIcon = $('i#example-fill');
const inputForm = $('form.needs-validation');
const submitButton = $('button#submit');
const validationIndicator = $('.conversion img.activity-indicator');

// Copy UCSC hub/output URL to clipboard
function copyUrl(event) {
    const classes = event.target.classList.toString().split(' ');
    if (classes.includes('result-url-copy')) {
        navigator.clipboard.writeText(resultUrl[0].textContent);
    }
    $(event.target).tooltip('show');
    setTimeout(() => {
        $(event.target).tooltip('hide');
    }, 1000);
}

// Verify that the hub URL is deemed valid by the UCSC API.
async function validHubUrl(url) {
    let hubUrl = urlInput[0].value.trim();
    if (hubUrl != '') {
        try {
            await axios.get(
                `https://api.genome.ucsc.edu/list/hubGenomes?hubUrl=${hubUrl}`
            );
            return true;
        } catch (error) {
            return false;
        }
    } else {
        return false;
    }
}

async function addDataSourceToIGB(event) {
    const classes = event.target.classList.toString().split(' ')

    if (classes.includes('add-data-sources')) {
        igbMessageToast("Connecting...", "Trying to find IGB open in the system", "cog")
        getHttpRequest('http://localhost:7085/igbStatusCheck')
            .then(res => {
                var version = res.split("=")[1].trim()
                var status = true
                var version_parts = version.split(".").map(Number);
                if(version == "true" || ((version_parts[0] <= 9)&&(version_parts[1] <= 1)&&(version_parts[2]<10))){
                    igbMessageToast("Could not add to IGB ", "Please update IGB to latest version.")
                    status = false
                }else{
                    status = true
                }
                if(status) {
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open("GET", urlInput[0].value.trim().replace("http://localhost:8000", "https://translate.bioviz.org"), false);
                    // xmlHttp.setRequestHeader("Access-Control-Allow-Origin","*")
                    xmlHttp.send(null);
                    var name = "";
                    var txtArray = xmlHttp.responseText.toString().split("\n");
                    for (let key in txtArray) {
                        if (txtArray[key].includes("shortLabel")) {
                            name = txtArray[key].replace("shortLabel ", "").replace(" ", "%20")
                        }
                    }

                    var builtURL = "http://127.0.0.1:7085/igbDataSource?"
                    builtURL += "quickloadurl=" + resultUrl[0].textContent.replace("&", "%26");
                    builtURL += "&quickloadname=" + name
                    xmlHttp.open("GET", builtURL, false);
                    xmlHttp.send(null);
                    if (xmlHttp.status != 200) {
                        $('#igbNotRunningModal').modal('toggle');
                    } else {
                        igbMessageToast("Success!", "Adding data source to IGB...", "check-circle")
                    }
                }
            })
            .catch(() => {
                // console.error('IGB is not running');
                $('#igbNotRunningModal').modal('toggle');
            });
    }
}

async function getHttpRequest(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.log(`Error: Fetching data at ${url} failed.`);
        if (url.includes('igbStatusCheck')) {
            throw error;
        }
    }
}

// Convert UCSC URL
async function convertAction(event) {
    validationIndicator.removeClass('d-none');
    submitButton.addClass('d-none');
    // Validate input URL
    const form = inputForm[0];
    (await validHubUrl(urlInput))
        ? urlInput[0].setCustomValidity('')
        : urlInput[0].setCustomValidity('Invalid hub URL');
    if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
        validationIndicator.addClass('d-none');
        submitButton.removeClass('d-none');
        form.classList.add('was-validated');
        return;
    }
    form.classList.add('was-validated');
    // Set output URL and description
    resultUrl[0].textContent = convertURL(urlInput[0].value);
    resultDescription[0].innerHTML = '';
    resultDescription[0].style.paddingTop = '0';
    // Configure display of elements
    validationIndicator.addClass('d-none');
    $("#result").removeClass("col-12")
    $("#result").addClass("col-8")
    resultCopy.removeClass('d-none');
    addDataSourceDiv.removeClass('d-none')
    submitButton.removeClass('d-none');
}

function igbMessageToast(title, message, success) {
    const igbmodaltitle = $('#igb-message-board .toast-title')
    const igbmodalbody = $('#igb-message-board .toast-body')
    const igbmessageboard = $('#igb-message-board')
    var toastIcon = ""
    if (success) {
        toastIcon = "<i class='fa fa-check-circle fa-lg text-success mr-2'></i>"
        if (success === "cog") {
            toastIcon = "<i class='fas fa-cog fa-spin mr-2 fa-lg'></i>"
        }
    } else {
        toastIcon = "<i class='fas fa-exclamation-triangle fa-lg text-danger mr-2'></i>"
    }

    igbmodaltitle.html(toastIcon + title);
    igbmodalbody.html(message);
    igbmessageboard.toast("show");
}

handleTooltips();

// Handle URL conversion
inputForm.on('submit', (event) => {
    event.preventDefault();
    convertAction(event);
});
submitButton.click((event) => {
    convertAction(event);
});

// Handle copying output URL
resultCopy.click(copyUrl);

// Reset validity on URL update
urlInput[0].addEventListener('keyup', (event) =>
    event.target.setCustomValidity('')
);
addDataSource.click(addDataSourceToIGB)
// Fill input field with sample URL
exampleFillIcon.click(() => {
    urlInput[0].value = exampleUrl[0].textContent;
});
