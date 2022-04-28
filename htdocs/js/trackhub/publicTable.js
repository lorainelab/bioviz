import { BACKEND_DOMAIN, convertURL, handleTooltips } from './util.js';

const filterInput = $('#filter input');
const filterCancel = $('#filter #cancel');
const templateRow = $('template#row');
const BACKEND_BASE_URL = BACKEND_DOMAIN.includes("http") ? BACKEND_DOMAIN : `https://${BACKEND_DOMAIN}`

const UCSC_BROWSER_URL = "https://genome.ucsc.edu/cgi-bin/hgTracks"
// Perform a GET request for a given URL
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

async function postHttpRequest(url, body) {
  try {
    const response = await axios.post(url, body);
    return response.data;
  } catch (error) {}
}

async function renderTable() {
    let hubData = JSON.parse(localStorage.getItem('hubData'));
    if (hubData) {
        initializeTable(hubData.length);
        hubData.forEach((hub, ind) => {
            initializeRow(hub.number, hub.url, hub.name, hub.description, ind);
            finalizeRow(hub.organismsGenomes, hub.igbOrganismsGenomes, ind);
        })
        return;
    }
    const pubHubs = await getPublicHubs();
    initializeTable(pubHubs.length);
    hubData = Array(pubHubs.length);
    await Promise.all(
        pubHubs.map(async (pubHub, ind) => {
            let hub = {};
            hub.number = ind + 1;
            hub.url = pubHub['hubUrl'];
            hub.name = pubHub['shortLabel'];
            hub.description = pubHub['longLabel'];
            initializeRow(hub.number, hub.url, hub.name, hub.description, ind);
            hub.organismsGenomes = {};
            const genomeData = await getGenomeData(hub.url);
            if (genomeData) {
                Object.keys(genomeData).forEach(genome => {
                    const organism = genomeData[genome]['organism'];
                    if (hub.organismsGenomes.hasOwnProperty(organism)) {
                        hub.organismsGenomes[organism].push(genome);
                    } else {
                        hub.organismsGenomes[organism] = [genome];
                    }
                })
                hub.igbOrganismsGenomes = await getIgbGenomes(hub.organismsGenomes);
            } else {
                // TODO: hide rows that don't have genome data? currently genome column is set as 'trackhub unreachable'
            }
            finalizeRow(hub.organismsGenomes, hub.igbOrganismsGenomes, ind);
            hubData[ind] = hub;
        })
    )
    localStorage.setItem('hubData', JSON.stringify(hubData));
}

async function getPublicHubs() {
    return (await getHttpRequest(
        'https://api.genome.ucsc.edu/list/publicHubs'
      ))['publicHubs'];
}

async function getGenomeData(hubUrl) {
    const requestUrl = `https://api.genome.ucsc.edu/list/hubGenomes?hubUrl=${hubUrl.trim()}`;
    const res = (await getHttpRequest(requestUrl))
    return res ? res['genomes'] : null
}

function initializeTable(numRows) {
    [...Array(numRows)].forEach((_, ind) => {
        const table = $('tbody')[0];
        const row = templateRow[0].content.cloneNode(true);
        table.appendChild(row);
    })
}

function initializeRow(number, url, name, description, rowInd) {
    const row = document.querySelectorAll('tbody tr')[rowInd];
    const dataCols = row.querySelectorAll('td');
    const genomesDiv = row.querySelector('td.genomes div');
    row.querySelector('th').textContent = number;
    row.dataset.url = url;
    dataCols[0].textContent = name;
    dataCols[1].textContent = description;
    dataCols[2].querySelectorAll('.copyable').forEach(copyableEl => {
        copyableEl.addEventListener('click', copyUrl);
    });
    const collapsedHeight = row.querySelector('td.name').offsetHeight - 5;
    genomesDiv.style.height = `${collapsedHeight}px`;
    genomesDiv.dataset.collapsedHeight = collapsedHeight;
}

async function getIgbGenomes(organismsGenomes) {
    return (await postHttpRequest(`${BACKEND_BASE_URL}/api/igbGenomeVersions`, {ucscGenomes: [organismsGenomes]}))[0];
}

function finalizeRow(organismsGenomes, igbOrganismsGenomes, rowInd) {
    const row = document.querySelectorAll('tbody tr')[rowInd];
    const genomesDiv = row.querySelector('td.genomes div');
    const controlIcons = row.querySelectorAll('td.expand i');
    if (Object.keys(organismsGenomes).length === 0) {
        genomesDiv.textContent = 'Trackhub Unreachable';
        genomesDiv.style.color = 'red';
        return;
    }
    // Update genome column
    genomesDiv.innerHTML = Object.keys(organismsGenomes)
        .map(organism => {
            let genomeVersions = '';
            const ucscGenomes = organismsGenomes[organism];
            const igbGenomes = igbOrganismsGenomes[organism];
            for (const genomeInd in ucscGenomes) {
                const igbGenomeVersion = igbGenomes[genomeInd]
                if (igbGenomeVersion !== 'None') {
                    genomeVersions += `${ucscGenomes[genomeInd]} (${igbGenomes[genomeInd]})`
                } else {
                    genomeVersions += ucscGenomes[genomeInd];
                }
                if (igbGenomeVersion !== 'None') {
                    const openInIgb = document.createElement('a');
                    openInIgb.textContent = 'Open in IGB';
                    openInIgb.setAttribute('class', 'open-in-igb clickable');
                    openInIgb.dataset.igbGenomeVersion = igbGenomeVersion;
                    openInIgb.title="Click to open this genome version in IGB browser"
                    genomeVersions += ' ' + openInIgb.outerHTML;
                }
                 //Add "Open in UCSC" link
                 let ucscGenomeVersion= ucscGenomes[genomeInd]
                 const openInUCSC = document.createElement('a');
                 openInUCSC.textContent = 'Open in UCSC';
                 openInUCSC.setAttribute('class', 'open-in-ucsc clickable');
                 openInUCSC.dataset.ucscGenomeVersion = ucscGenomeVersion;
                 openInUCSC.title = "Click to open this genome version in UCSC browser"
                 genomeVersions += ' ' + openInUCSC.outerHTML;
                genomeVersions += '<br>';
            }
            return genomeVersions;
        }
        )
        .join('')
    // Open supported genomes in IGB
    genomesDiv.querySelectorAll('a.open-in-igb').forEach(el => {
        el.addEventListener('click', (event) => {
            console.log(`Opening ${event.target.dataset.igbGenomeVersion} in IGB`);
            getHttpRequest('http://localhost:7085/igbStatusCheck')
            .then(res => {
                console.log(res);
                getHttpRequest('http://localhost:7085/bringIGBToFront');
                getHttpRequest(`http://localhost:7085/IGBControl?version=${event.target.dataset.igbGenomeVersion}`);
            })
            .catch(() => {
                console.error('IGB is not running');
                $('#igb-not-running').modal();
            });

        });
    })
    //Open supported genomes in UCSC
    genomesDiv.querySelectorAll('a.open-in-ucsc').forEach(el => {
      el.addEventListener('click', (event) => {
        let ucscViewURL = UCSC_BROWSER_URL+"?genome="+event.target.dataset.ucscGenomeVersion
        ucscViewURL+='&position=lastDbPos'
        ucscViewURL+="&hubUrl="+event.target.closest('tr').dataset.url
        window.open(ucscViewURL, '_blank');
        console.log(`Opening`+ ucscViewURL+` in UCSC browser`);
      });
    })
    // Add column expansion toggle icon, if needed
    if (genomesDiv.scrollHeight >= genomesDiv.clientHeight + 20) {
        const expandIcon = controlIcons[0];
        const collapseIcon = controlIcons[1];
        expandIcon.classList.remove('d-none');
        expandIcon.addEventListener('click', () => {
            expandIcon.classList.add('d-none');
            collapseIcon.classList.remove('d-none');
            genomesDiv.style.height = 'fit-content';
        });
        collapseIcon.addEventListener('click', () => {
            const collapsedHeight = genomesDiv.dataset.collapsedHeight
            collapseIcon.classList.add('d-none');
            expandIcon.classList.remove('d-none');
            genomesDiv.style.height = `${collapsedHeight}px`;
        });
    }
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
    const hubUrl = row.dataset.url;
    const reference = `${name} ${description} ${genomes} ${hubUrl}`
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
    // Initialize bootstrap tooltips
    handleTooltips();
    // Save and render quick-loading UCSC hub data
    await renderTable();
}

main();
