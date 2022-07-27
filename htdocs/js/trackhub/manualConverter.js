import { convertURL, handleTooltips } from './util.js';

const urlInput = $('.input input');
const exampleUrl = $('.example .url');
const resultUrl = $('#result .url');
const resultDescription = $('#result p.description');
const resultCopy = $('div.result i#copy');
const addDataSource = $('div.result button#addSource');
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
async function addDataSourceToIGB(event){
  const classes = event.target.classList.toString().split(' ')

  if(classes.includes('add-data-sources')){
    var xmlHttp = new XMLHttpRequest();
    alert(urlInput[0].value)
    xmlHttp.open("GET", urlInput[0].value.trim().replace("http://localhost:8000","https://translate.bioviz.org"), false);
    // xmlHttp.setRequestHeader("Access-Control-Allow-Origin","*")
    xmlHttp.send(null);
    var name = "";
    var txtArray = xmlHttp.responseText.toString().split("\n");
    for(let key in txtArray){
      if(txtArray[key].includes("shortLabel")){
        name = txtArray[key].replace("shortLabel ","").replace(" ","%20")
      }
    }

    var builtURL = "http://127.0.0.1:7085/igbDataSource?"
    builtURL += "quickloadurl=" +  resultUrl[0].textContent.replace("&","%26");
    builtURL += "&quickloadname=" + name
    xmlHttp.open( "GET", builtURL, false );
    // xmlHttp.setRequestHeader("Access-Control-Allow-Origin","*")
    xmlHttp.send( null );
    if(xmlHttp.status!=200){
      if(xmlHttp.status==404){
        //Placeholder
        igbMessageBoardModal("IGB is not running:","Start IGB and try again",false)
        console.error(xmlHttp.response)

      }else {
        //Placeholder
        igbMessageBoardModal("Connection error:","Connection to IGB could not be established. Please restart IGB and try again.",false)
        console.error("The connection could not be established. Please restart IGB and try again.")
      }
    }else{
      //Placeholder
      igbMessageBoardModal("Added to IGB","Please go to the Data Sources tab in the IGB Preferences window to verify.",true)
      console.log(xmlHttp.response+": Data source added to IGB")
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
  resultCopy.removeClass('d-none');
  addDataSource.removeClass('d-none')
  submitButton.removeClass('d-none');
}
function igbMessageBoardModal(title,footer,success){
  const igbmodaltitle = $('#igb-message-board-label')
  const igbmodalfooter = $('.modal-body #igb-modal-body')
  const igbmessageboard = $('#igb-message-board')
  var icon=""
  if(success){
    icon = "<i class='fa fa-check text-success mr-2'></i>"
  }else{
    icon = "<i class='fa fa-xmark text-danger mr-2'></i>"
  }
  igbmodaltitle.html(icon+title);
  igbmodalfooter.html(footer);
  igbmessageboard.modal();
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
