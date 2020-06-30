/**
 * BAR/IGB Bridge
 * by Loraine Lab
 */

/**
Supports:
   genome - IGB genome assembly version code; required; e.g., A_thaliana_Jun_2009
   version - synonym for genome
   seqid, start, end - optional, but if one of these three is provided, all three must be provided;
                        location coordinates in genome assembly specified by version
   gene_id - optional, must be an AGI code for a gene locus from annotation_set, ignored if
             seqid, start, end are provided
   annotation_set - code indicating annotation set that gene_id belongs to; required if
                    gene_id is provided; e.g., Araport11
                    If provided and it matches a known annotation set, infer version if version
                    not provided.
   feature_url_N - optional, URL of a data set hosted on a QuickLoad site (N is >= 0)
   server_url - required if feature_url_N provided; URL of the quickload site
*/

var igbIsRunning = false;
var igb_params = {};

$(window).on("load",function(e) {
    var source = $.url().attr('source');
    if (source.endsWith('bar.html')) {
        $("#noParametersBlock").removeClass("d-none");
    }
    else {
	contactIgb();
    }
});


// If IGB is running, open REST URL to IGB.
// Otherwise, invite user to download and launch IGB.
function contactIgb() {
    var statusCheckUrl = 'http://127.0.0.1:7085/igbStatusCheck';
    var xhr = createCORSRequest('GET', statusCheckUrl);
    if (!xhr) {
        return;
    }
    xhr.onload = function() {
        if (xhr.status == 200) {
	    // IGB answered with response code 200 and JSON data
            igbIsRunning = true;
            $("#igbIsRunningBlock").removeClass("d-none");
            $("#dataAreLoading").removeClass("d-none");
	    loadData();
            //setTimeout(loadData(),3000);
        } else {
	    // IGB answered but response code not 200
            $("#igbIsNotRunningBlock").removeClass("d-none");
	    igbIsRunning = false;
        }
    };
    xhr.onerror = function() {
	// IGB did not answer (is not running)
        $("#igbIsNotRunningBlock").removeClass("d-none");
	igbIsRunning = false;
    };
    xhr.send();
}

function loadData() {
    var query_elements = parseQuery(location.search.substring(1));
    var server_url = query_elements['server_url']; // any Quickload site URL
    var bar_quickload_url = "http://lorainelab-quickload.scidas.org/bar/"
    if (server_url.match(/bar/i)) {
	// requires exact match to Quickload site as appears in IGB Preferences > Data Sources
	igb_params['server_url']=bar_quickload_url;
    }
    // Note: To deploy a new BAR Quickload site, run makeBarQuickload.py
    // https://bitbucket.org/lorainelab/igbquickload/raw/master/makeBarQuickload.py
    var version = query_elements['version'];
    if (!version) {
	version = query_elements['genome']; // more syntactic sugar
    }
    var annotation_set = query_elements['annotation_set'];
    if (!version & annotation_set == 'Araport11') {
	version = 'A_thaliana_Jun_2009';
    }
    if (version) {
	igb_params['version']=version;
    }
    else {
	// version is required; need to know which genome to load
	$("#dataAreLoading").addClass("d-none");
	$("wrongParametersBlock").removeClass("d-none");
	return;
    }
    // TO-DO: make sure suffix is 0 or a positive integer
    //        if not, ignore it
    for (index in query_elements) {
	if (index.startsWith('feature_url_')) {
	    // Quickload site not using https
	    // Quickload site file URL must match BAR link
	    var value = query_elements[index];
	    if (value.startsWith("https")) {
		value = value.replace("https","http");
	    }
	    igb_params[index]=value;
	}
    }
    // seqid is optional
    var seqid = query_elements['seqid'];
    if (seqid) {
	igb_params['seqid']=seqid
	var start = query_elements['start'];
	var end = query_elements['end'];
	if (start & end) {
	    igb_params['start']=parseInt(start);
	    igb_params['end']=parseInt(end);
	    makeAndOpenIgbUrl();
	    return;
	}
	if (start || end) {
	    // can't have one without the other
	    $("#dataAreLoading").addClass("d-none");
	    $("wrongParametersBlock").removeClass("d-none");
	    return;
	}
    }
    else {
	gene_id=query_elements['gene_id']
	if (gene_id) { // need to look up seqid, start, end for this gene
	    addCoordinatesForGeneId(gene_id);
	    // Note: calls back to makeAndOpenIgbUrl in REST call's onload method
	}
	else {
	    makeAndOpenIgbUrl(); // no need to query web service
	}
    }
}

function makeAndOpenIgbUrl() {
    var igb_url="http://127.0.0.1:7085/IGBControl?";
    feature_urls=0;
    for (var index in igb_params) { // igb_params is global; should be fully populated by now
	if (igb_url.endsWith("?")) {
            igb_url = igb_url + index + "=" +igb_params[index];
	}
	else {
	    igb_url = igb_url + "&" + index + "=" +igb_params[index];
	}
	// note: we can tolerate anything with prefix feature_url_
	if (index.startsWith('feature_url_')) {
	    // this is horrible - fix it in IGB
	    // see comment in IGBF-1367
	    igb_url = igb_url + "&query_url=" + igb_params[index];
	}
    }
    if (igb_params['start']) {
	// note: need to check if IGB asks user if they want to
	// cache sequence if bookmarks being used
	igb_url = igb_url + '&loadresidues=True';
    }
    var xhr = createCORSRequest('GET', igb_url);
    if (!xhr) {
        return;
    }
    xhr.onload = function() {
        if (xhr.status == 204) {
	    // Note: Ann noticed that these calls sometimes fail to
	    // open data set, navigate to the gene, etc.
	    // Probably this is related to threading in IGB.
	    // If yes, we may want to send instructions to IGB in
	    // more than one URL, e.g., first load the genome,
	    // then go to a location, then open the data set, then
	    // load the residues, etc. Also, we need to make sure that
	    // IGB does not bother the user with any dialogs, e.g.,
	    // useless notifications to zoom in or accept a certificate.
            $("#dataAreLoading").addClass("d-none");
            $("#dataLoaded").removeClass("d-none");
        }
        else {
            $("#dataAreLoading").addClass("d-none");
            $("#dataLoadingError").removeClass("d-none");
        }
    };
    xhr.onerror = function() {
        $("#dataAreLoading").addClass("d-none");
        $("#dataLoadingError").removeClass("d-none");
    };
    console.log("Opening IGB Url: " + igb_url);
    xhr.send();
}


// Look up seqid, start, and end for the given geneId
// Add these values to global variable igb_params
function addCoordinatesForGeneId(geneId) {
    // Note: geneIdLookup.py is version-controlled in bioviz repository
    var gene_url = location.origin+"/cgi-bin/geneIdLookup.py?gene_id="+geneId;
    var xhr = createCORSRequest('GET', gene_url);
    if (!xhr) {
       console.log("Could not form request: "+ gene_url);
    }
    xhr.onload = function() {
        if (xhr.status=200){
            gene_coords = JSON.parse(this.response);
	    igb_params["start"]=parseInt(gene_coords["start"])-500;
	    igb_params["end"]=parseInt(gene_coords["end"])+500;
	    igb_params["seqid"]=gene_coords["seqid"];
            makeAndOpenIgbUrl();
        }
    };
    xhr.onerror = function(err) {
        console.log(err);
    };
    xhr.send();
}


// Create and return an XHR object.
function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        // CORS not supported.
        xhr = null;
    }
    return xhr;
}

// Split query string into key value pairs
function parseQuery(str) {
    var ret = {};
    $.each(str.split("&"), function() {
        var data = this.split('='),
            name = decodeURIComponent(data.shift()),
            val = decodeURIComponent(data.join("=")).replace('+', ' '),
            nameVal = name.match(/(.*)\[(.*)\]/);
        if (nameVal === null) {
            ret[name] = val;
        }
        else {
            name = nameVal[1];
            nameVal = nameVal[2];
            if (!ret[name]) {
                ret[name] = nameVal ? {} : [];
            }
            if ($.isPlainObject(ret[name])) {
                ret[name][nameVal] = val;
            }
            else if($.isArray(ret[name])){
                ret[name].push(val);
            }
        }
    });
    return ret;
}
