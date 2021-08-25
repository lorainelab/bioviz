const inputForm = $('form.needs-validation')
const urlInput = $('.input input')
const exampleUrl = $('.example .url')
const exampleFillIcon = $('i#example-fill')
const submitButton = $('button#submit')
const activityIndicator = $('img#activity-indicator')
const filterInput = $('#filter input')
const templateRow = $('template#row')
const resultContainer = $('div.result')
const resultUrl = $('#result .url')
const BACKEND_DOMAIN = 'https://127.0.0.1:8000'
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/'

/**
 * Perform a GET request for a given URL
 * @param {[string]} url [The URL to be fetched]
 * @returns {[any]}
 */
const getHttpData = async (url) => {
    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {}
}

const addToTable = (hub) => {
    const row = templateRow[0].content.cloneNode(true)
    const td = row.querySelectorAll('td')
    td[0].innerHTML = hub.name
    td[1].querySelector('div').innerHTML = hub.organismsGenomes && Object.keys(hub.organismsGenomes).length != 0  
        ? Object.keys(hub.organismsGenomes).map(organism => `${organism != 'null' ? organism : 'Unknown'} (${hub.organismsGenomes[organism].join(', ')})`).join(', ')
        : 'Not Available'
    const table = $('tbody')[0]
    table.appendChild(row)
    const tableRows = table.querySelectorAll('tr')
    tableRows[tableRows.length - 1].dataset.url = hub.url
    // Show an expand/collapse icon in rows that contain more content than the max row height allows for
    const organismsGenomesDivs = table.querySelectorAll('td.organisms-genomes div')
    const lastOrganismsGenomesDiv = organismsGenomesDivs[organismsGenomesDivs.length - 1]
    if (lastOrganismsGenomesDiv.scrollHeight != lastOrganismsGenomesDiv.clientHeight) {
        const controlIcons = td[2].querySelectorAll('i')
        const expandIcon = controlIcons[0]
        const collapseIcon = controlIcons[1]
        expandIcon.classList.remove('d-none')
        expandIcon.addEventListener('click', () => {
            expandIcon.classList.add('d-none')
            collapseIcon.classList.remove('d-none')
            lastOrganismsGenomesDiv.style.maxHeight = 'fit-content'
        })
        collapseIcon.addEventListener('click', () => {
            collapseIcon.classList.add('d-none')
            expandIcon.classList.remove('d-none')
            lastOrganismsGenomesDiv.style.maxHeight = '100px'
        })
    }
    td[3].querySelector('#copy').addEventListener('click', copyUrl)
    td[3].querySelector('#convert').addEventListener('click', convertUrl)
}

// Get track hub data from UCSC
const saveUcscData = async () => {
    if (localStorage.getItem('hubData') == null) {
        const hubs = await getHttpData('https://api.genome.ucsc.edu/list/publicHubs')
        const hubData = await Promise.all(
            hubs['publicHubs']
            .map(async (el) => {
                let hub = {}
                hub.url = el['hubUrl']
                hub.name = el['shortLabel']
                hub.organismsGenomes = {}
                const hubDetails = await getHttpData(`https://api.genome.ucsc.edu/list/hubGenomes?hubUrl=${hub.url.trim()}`)
                if (hubDetails != undefined) {
                    Object.getOwnPropertyNames(hubDetails['genomes'])
                        .forEach(genome => {
                            if (genome) {
                                const organism = hubDetails['genomes'][genome]['organism']
                                if (hub.organismsGenomes.hasOwnProperty(organism)) {
                                    hub.organismsGenomes[organism].push(genome)
                                } else {
                                    hub.organismsGenomes[organism] = [genome]
                                }
                            }
                            
                        })
                    addToTable(hub)
                    return hub
                }
            }))
        localStorage.setItem('hubData', JSON.stringify(hubData))
    } else {
        const hubData = JSON.parse(localStorage.getItem('hubData'))
        hubData.forEach(hub => {
            if (hub) {
                addToTable(hub)
            }
        })
    }
}

saveUcscData()

// Fill input field with sample URL
exampleFillIcon.click(() => {
    urlInput[0].value = exampleUrl[0].textContent
})

// Copy UCSC hub/output URL to clipboard
function copyUrl(event) {
    const classes = event.target.classList.toString().split(' ')
    if (classes.includes('result-url-copy')) {
        navigator.clipboard.writeText(resultUrl[0].textContent)
    } else if (classes.includes('ucsc-hub-copy')) {
        navigator.clipboard.writeText($(event.target).closest('tr')[0].dataset.url)
    }
    $(event.target).tooltip('show')
    setTimeout(() => {
        $(event.target).tooltip('hide')
    }, 500)
}

$('#result #copy').click(copyUrl)

// Convert public UCSC URL to IGB data source
function convertUrl(event) {
    // Set output URL
    const url = $(event.target).closest('tr')[0].dataset.url
    resultUrl[0].textContent = `${BACKEND_DOMAIN}/rest_api/?hubUrl=${url}&fileName=/`
    // Ensure result container is visible
    resultContainer.removeClass('d-none')
}

// Close tooltips on outside click
$('body').click((e) => {
    const elementClicked = $(e.target)
    if (!elementClicked.hasClass('info') && !elementClicked.hasClass('tooltip-inner')) {
        $('.info').each((ind, el) => {
            $(el).tooltip('hide')
        })
    }
})

// Reset validity on URL update
urlInput[0].addEventListener('keyup', (event) => event.target.setCustomValidity(''))

// Verify that the target resource of the input hub URL starts with the word 'hub'.
const validHubUrl = async () => {
    let valid
    if (urlInput[0].value.trim() != '') {
        try {
            const response = await axios.get(CORS_PROXY + urlInput[0].value, {timeout: 3000, headers: {'X-Requested-With': 'https://bioviz.org'}})
            if (response.data.split(' ')[0].trim() === 'hub') {
                valid = true
            }
        } catch (error) {
            valid = false
        }
    } else {
        valid = false
    }
    return valid
}

// Convert UCSC URL
const convert = async (event) => {
    activityIndicator.removeClass('d-none')
    submitButton.addClass('d-none')
    // Validate input URL
    const form = inputForm[0]
    await validHubUrl() ? urlInput[0].setCustomValidity('') : urlInput[0].setCustomValidity('Invalid hub URL')
    if (form.checkValidity() === false) {
        event.preventDefault()
        event.stopPropagation()
        activityIndicator.addClass('d-none')
        submitButton.removeClass('d-none')
        form.classList.add('was-validated')
        return
    }
    form.classList.add('was-validated');
    // Set output URL
    resultUrl[0].textContent = `${BACKEND_DOMAIN}/rest_api/?hubUrl=${urlInput[0].value}&fileName=/`
    // Configure display of elements
    activityIndicator.addClass('d-none')
    resultContainer.removeClass('d-none')
    submitButton.removeClass('d-none')
}

inputForm.on('submit', (event) => {
    event.preventDefault()
    convert(event)
})

submitButton.click(event => {convert(event)})

// Check if all terms in search input match to a particular reference string
const allQueryTermsMatch = (queryTerms, queryIndex, reference) => {
    if (queryIndex < queryTerms.length) {
      if (reference.indexOf(queryTerms[queryIndex]) > -1) {
        return allQueryTermsMatch(queryTerms, queryIndex + 1, reference);
      } else {
          return false
      }
    } else {
      return true
    }
  }

  // Display rows in table of public UCSC hubs based on search input
  const filterPublicHubs = () => {
      const query = filterInput[0].value.toUpperCase()
      const tableRowElements = $('tbody tr')
      for (const el of tableRowElements) {
        const cols = el.querySelectorAll('td')
        const reference = cols[0].innerText + ' ' + cols[1].innerText
        if (allQueryTermsMatch(query.split(' '), 0, reference.toUpperCase())) {
            el.style.display = ""
        } else {
            el.style.display = "none"
        }
      }
  };

// Filter public hub rows based on user input
filterInput[0].addEventListener('keyup', filterPublicHubs)
