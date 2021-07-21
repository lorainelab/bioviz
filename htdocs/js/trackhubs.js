const inputForm = $('form.needs-validation')
const urlInput = $('.input input')
const exampleUrl = $('.example .url')
const exampleFillIcon = $('i#example-fill')
const activityIndicator = $('img#activity-indicator')
const resultContainer = $('div.result')
const resultUrl = $('#result .url')
const copyIcon = $('i#copy')
const submitButton = $('button#submit')
const BACKEND_DOMAIN = 'https://127.0.0.1:8000'

// Fill input field with sample URL
exampleFillIcon.click(() => {
    urlInput[0].value = exampleUrl[0].textContent
})

// Copy output URL to clipboard
copyIcon.click(() => {
    navigator.clipboard.writeText(resultUrl[0].textContent)
    copyIcon.tooltip('show')
    setTimeout(() => {
        copyIcon.tooltip('hide')
    }, 500)
})

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

// Convert UCSC URL
submitButton.click(async (event) => {
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
    
})

/**
 * Verify that the target resource of the input hub URL starts with the word 'hub'.
 */
const validHubUrl = async () => {
    let valid
    if (urlInput[0].value.trim() != '') {
        try {
            const response = await axios.get(urlInput[0].value)
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