import { convertURL, handleTooltips } from './util.js';

const filterInput = $('#filter input');
const filterCancel = $('#filter #cancel');
const templateRow = $('template#row');
const resultUrl = $('#result .url');
const resultDescription = $('#result p.description');
const resultCopy = $('div.result i#copy');

// Perform a GET request for a given URL
async function getHttpData(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {}
}

// Add a trackhub as a row to the table
function addToTable(hub) {
  const row = templateRow[0].content.cloneNode(true);
  const head = row.querySelector('th');
  const td = row.querySelectorAll('td');
  head.textContent = hub.number;
  td[0].innerHTML = hub.name;
  td[1].querySelector('#copy').addEventListener('click', copyUrl);
  td[1].querySelector('#convert').addEventListener('click', setConvertedURL);
  td[2].querySelector('div').innerHTML =
    hub.organismsGenomes && Object.keys(hub.organismsGenomes).length != 0
      ? Object.keys(hub.organismsGenomes)
          .map(
            (organism, ind) => `${hub.organismsGenomes[organism].join(', ')}
                ${organism != 'null' ? '(' + organism + ')' : ''}${
              ind != Object.keys(hub.organismsGenomes).length - 1 ? '; ' : ''
            }`
          )
          .join('')
      : 'Not Available';
  const table = $('tbody')[0];
  table.appendChild(row);
  const tableRows = table.querySelectorAll('tr');
  tableRows[tableRows.length - 1].dataset.url = hub.url;
  // Show an expand/collapse icon in rows that contain more content than the max row height allows for
  const genomesDivs = table.querySelectorAll('td.genomes div');
  const lastGenomeDiv = genomesDivs[genomesDivs.length - 1];
  if (lastGenomeDiv.scrollHeight != lastGenomeDiv.clientHeight) {
    const controlIcons = td[3].querySelectorAll('i');
    const expandIcon = controlIcons[0];
    const collapseIcon = controlIcons[1];
    expandIcon.classList.remove('d-none');
    expandIcon.addEventListener('click', () => {
      expandIcon.classList.add('d-none');
      collapseIcon.classList.remove('d-none');
      lastGenomeDiv.style.maxHeight = 'fit-content';
    });
    collapseIcon.addEventListener('click', () => {
      collapseIcon.classList.add('d-none');
      expandIcon.classList.remove('d-none');
      lastGenomeDiv.style.maxHeight = '110px';
    });
  }
}

// Get track hub data from UCSC
async function saveUcscData() {
  let hubData;
  if (localStorage.getItem('hubData') == null) {
    $('.browser div.fetching')[0].classList.remove('d-none');
    const hubs = await getHttpData(
      'https://api.genome.ucsc.edu/list/publicHubs'
    );
    hubData = await Promise.all(
      hubs['publicHubs'].map(async (el, ind) => {
        let hub = {};
        hub.number = ind + 1;
        hub.url = el['hubUrl'];
        hub.name = el['shortLabel'];
        hub.organismsGenomes = {};
        const hubDetails = await getHttpData(
          `https://api.genome.ucsc.edu/list/hubGenomes?hubUrl=${hub.url.trim()}`
        );
        if (hubDetails != undefined) {
          Object.getOwnPropertyNames(hubDetails['genomes']).forEach(
            (genome) => {
              if (genome) {
                const organism = hubDetails['genomes'][genome]['organism'];
                if (hub.organismsGenomes.hasOwnProperty(organism)) {
                  hub.organismsGenomes[organism].push(genome);
                } else {
                  hub.organismsGenomes[organism] = [genome];
                }
              }
            }
          );
          return hub;
        }
      })
    );
    localStorage.setItem('hubData', JSON.stringify(hubData));
    $('.browser div.fetching')[0].classList.add('d-none');
  } else {
    hubData = JSON.parse(localStorage.getItem('hubData'));
  }
  hubData.forEach((hub) => {
    if (hub) {
      addToTable(hub);
    }
  });
}

// Copy UCSC hub/output URL to clipboard
function copyUrl(event) {
  const classes = event.target.classList.toString().split(' ');
  if (classes.includes('result-url-copy')) {
    navigator.clipboard.writeText(resultUrl[0].textContent);
  } else if (classes.includes('ucsc-hub-copy')) {
    navigator.clipboard.writeText(event.target.closest('tr').dataset.url);
  }
  $(event.target).tooltip('show');
  setTimeout(() => {
    $(event.target).tooltip('hide');
  }, 1000);
}

resultCopy.click(copyUrl);

// Convert public UCSC URL to IGB data source
function setConvertedURL(event) {
  // Set output URL and description
  const closestRow = $(event.target).closest('tr')[0];
  const url = closestRow.dataset.url;
  const hubName = closestRow.querySelectorAll('td')[0].textContent;
  const hubNumber = closestRow.querySelectorAll('th')[0].textContent;
  resultUrl[0].textContent = convertURL(url);
  resultDescription[0].innerHTML = `Public hub ${hubNumber}: <i>${hubName}</i>`;
  resultDescription[0].style.paddingTop = '10px';
  resultCopy.removeClass('d-none');
  window.scroll({
    top: $('#result')[0].getBoundingClientRect().top + window.scrollY - 125,
    left: 0,
    behavior: 'smooth',
  });
}

// Check if all terms in search input match to a particular reference string
function allQueryTermsMatch(queryTerms, queryIndex, reference) {
  if (queryIndex < queryTerms.length) {
    if (reference.indexOf(queryTerms[queryIndex]) > -1) {
      return allQueryTermsMatch(queryTerms, queryIndex + 1, reference);
    } else {
      return false;
    }
  } else {
    return true;
  }
}

// Display rows in table of public UCSC hubs based on search input
function filterPublicHubs() {
  const query = filterInput[0].value.toUpperCase();
  const tableRowElements = $('tbody tr');
  for (const row of tableRowElements) {
    const cols = row.querySelectorAll('td');
    const reference = cols[0].innerText + ' ' + cols[2].innerText;
    if (allQueryTermsMatch(query.split(' '), 0, reference.toUpperCase())) {
      row.classList.remove('d-none');
    } else {
      row.classList.add('d-none');
    }
  }
}

// Filter public hub rows based on user input
filterInput[0].addEventListener('keyup', filterPublicHubs);

// Clear filter input
filterCancel.on('click', (event) => {
  event.target.parentNode.querySelector('input').value = '';
  filterPublicHubs();
});

handleTooltips();
saveUcscData();
