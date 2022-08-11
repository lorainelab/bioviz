import { convertURL, handleTooltips } from './util.js';

const urlInput = $('.input input');
const exampleUrl = $('.example .url');
const resultUrl = $('#result .url');
const resultDescription = $('#result p.description');
const resultCopy = $('div.result i#copy');
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
async function validHubUrl() {
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

// Convert UCSC URL
async function convertAction(event) {
  validationIndicator.removeClass('d-none');
  submitButton.addClass('d-none');
  // Validate input URL
  const form = inputForm[0];
  (await validHubUrl())
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
  submitButton.removeClass('d-none');
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

// Fill input field with sample URL
exampleFillIcon.click(() => {
  urlInput[0].value = exampleUrl[0].textContent;
});
