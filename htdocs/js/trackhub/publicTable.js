import { BACKEND_DOMAIN, convertURL, handleTooltips } from './util.js';

const filterInput = $('#filter input');
const filterCancel = $('#filter #cancel');
const templateRow = $('template#row');

// Perform a GET request for a given URL
async function getHttpRequest(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {}
}

async function postHttpRequest(url, body) {
  try {
    const response = await axios.post(url, body);
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
  td[1].innerHTML = hub.description;
  td[2].querySelectorAll('.copyable').forEach(copyableEl => {
      copyableEl.addEventListener('click', copyUrl);
  });
  td[3].querySelector('div').innerHTML =
    hub.organismsGenomes && Object.keys(hub.organismsGenomes).length != 0
      ? Object.keys(hub.organismsGenomes)
          .map(organism => {
                let genomeVersions = '';
                const igbLink = document.createElement('img');
                igbLink.setAttribute('src', '/htdocs/images/open_in_genome_browser.png')
                igbLink.setAttribute('class', 'igb-icon clickable');
                const ucscGenomes = hub.organismsGenomes[organism];
                const igbOrganismGenomes = hub.igbOrganismGenomes;
                for (const ucscGenomeInd in ucscGenomes) {
                    genomeVersions += ucscGenomes[ucscGenomeInd];
                    if (organism != 'null') {
                        genomeVersions += ` (<span class="organism">${organism}</span>)`;
                    }
                    const igbGenomeVersion = igbOrganismGenomes[organism][ucscGenomeInd]
                    if (igbGenomeVersion !== 'None') {
                        igbLink.setAttribute('href', `http://localhost:7085/IGBControl?version=${igbGenomeVersion}`);
                        genomeVersions += igbLink.outerHTML;
                    }
                    genomeVersions += '<br>';
                }
                return genomeVersions;
            }
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
    const controlIcons = td[4].querySelectorAll('i');
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
  if (localStorage.getItem('hubData') == null) {
    $('.browser div.fetching')[0].classList.remove('d-none');
    const hubs = await getHttpRequest(
      'https://api.genome.ucsc.edu/list/publicHubs'
    );
    let hubData = await Promise.all(
      hubs['publicHubs'].map(async (el, ind) => {
        let hub = {};
        hub.number = ind + 1;
        hub.url = el['hubUrl'];
        hub.name = el['shortLabel'];
        hub.description = el['longLabel'];
        hub.organismsGenomes = {};
        const hubDetails = await getHttpRequest(
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
    hubData = hubData.filter(el => el != null)
    localStorage.setItem('hubData', JSON.stringify(hubData));
    $('.browser div.fetching')[0].classList.add('d-none');
  }
}

// Save IGB genome version data
async function saveIgbGenomes() {
    const hubData = JSON.parse(localStorage.getItem('hubData'));
    if (hubData[0].igbOrganismGenomes !== undefined) {
        return;
    }
    const genomes = hubData.map(el => el.organismsGenomes);
    const igbOrganismGenomes = (await postHttpRequest(`https://${BACKEND_DOMAIN}/api/igbGenomeVersions`, {ucscGenomes: JSON.stringify(genomes)}));
    igbOrganismGenomes.forEach((_, ind) => {
        hubData[ind]['igbOrganismGenomes'] = igbOrganismGenomes[ind];
    })
    localStorage.setItem('hubData', JSON.stringify(hubData));
}

// Copy UCSC hub/output URL to clipboard
function copyUrl(event) {
  const classes = event.target.classList.toString().split(' ');
  if (classes.includes('quickload-copy')) {
    navigator.clipboard.writeText(convertURL(event.target.closest('tr').dataset.url));
  } else if (classes.includes('ucsc-hub-copy')) {
    navigator.clipboard.writeText(event.target.closest('tr').dataset.url);
  } else {
      return
  }
  $(event.target).tooltip('show');
  setTimeout(() => {
    $(event.target).tooltip('hide');
  }, 1000);
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
    const name = row.querySelector('td.name').innerText;
    const description = row.querySelector('td.description').innerText;
    const genomes = row.querySelector('td.genomes div').innerText;
    const reference = name + ' ' + description + ' ' + genomes
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

async function main() {
    handleTooltips();
    await saveUcscData();
    await saveIgbGenomes();
    const hubData = JSON.parse(localStorage.getItem('hubData'));
    hubData.forEach((hub) => {
        if (hub) {
            addToTable(hub);
        }
    });
    document.querySelectorAll('img.igb-icon').forEach(img => {
        img.addEventListener('click', event => {
            const url = event.target.getAttribute('href');
            getHttpRequest('http://localhost:7085/bringIGBToFront');
            getHttpRequest(url);
        });
    });
}

main();
