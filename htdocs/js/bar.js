/**
 * BAR/IGB Bridge
 * by Loraine Lab
 */

var igbIsRunning = false;
var igb_url = "";

$(window).on("load",function(e) {
    var source = $.url().attr('source');
    if (source.endsWith('bar.html')) {
        $("#noParametersBlock").removeClass("hide");
    }
    else {
	openIgb();
    }
});


// If IGB is running, open REST URL to IGB. 
// Otherwise, invite user to download and launch IGB.
function openIgb() {
    var statusCheckUrl = 'http://127.0.0.1:7085/igbStatusCheck';
    var xhr = createCORSRequest('GET', statusCheckUrl);
    if (!xhr) {
        return;
    }
    xhr.onload = function() {
        if (xhr.status == 200) {
	    // IGB answered with response code 200 and JSON data
            igbIsRunning = true;
            $("#igbIsRunningBlock").removeClass("hide");
            setTimeout(loadData(),3000);
        } else {
	    // IGB answered but response code not 200
            $("#igbIsNotRunningBlock").removeClass("hide");
	    igbIsRunning = false;
        }
    };
    xhr.onerror = function() {
	// IGB did not answer (is not running)
        $("#igbIsNotRunningBlock").removeClass("hide");
	igbIsRunning = false;
    };
    xhr.send();
}

/**
IGB 9.0.1 and earlier returns no content:

wget http://localhost:7085/IGBControl?version=A_thaliana_Jun_2009
--2018-08-07 13:37:23--  http://localhost:7085/IGBControl?version=A_thaliana_Jun_2009
Resolving localhost (localhost)... ::1, 127.0.0.1
Connecting to localhost (localhost)|::1|:7085... connected.
HTTP request sent, awaiting response... 204 No Content
2018-08-07 13:37:23 (0.00 B/s) - ‘IGBControl?version=A_thaliana_Jun_2009’ saved [0]

*/

function loadData() {
    console.log("start loadData()")
    var query_elements = parseQuery(location.search.substring(1));
    var igb_params = getIgbParameters(query_elements); // calls Web service
    if (!isAllowedRequest(igb_params)) {
	$("wrongParametersBlock").removeClass("hide");
    }
    else {
	// try to send data to igb
	$("#igbIsRunningBlock").removeClass("hide");
	$("#dataAreLoading").removeClass("hide");
	igb_url = makeIgbUrl(igb_params);
	var xhr = createCORSRequest('GET', igb_url);
	if (!xhr) {
            return;
	}
	xhr.onload = function() {
            if (xhr.status == 204) {
		$("#dataAreLoading").addClass("hide");
		$("#dataLoaded").removeClass("hide");
            }
            else {
		$("#dataAreLoading").addClass("hide");
		$("#dataLoadingError").removeClass("hide");
            }
	};
	xhr.onerror = function() {
	    $("#dataAreLoading").addClass("hide");
            $("#dataLoadingError").removeClass("hide");
	};
	xhr.send();
    }
    console.log("End loadData()");
}


// only version is strictly required to make IGB do a thing
// to make IGB load a file, give it featur_url_N and server_url
// to make IGB go to a place, give it seq_id, start, end 
//   **or** 
// if version is A_thaliana_Jun_2011, give it an Araport11 gene id
// see below
function isAllowedRequest(igb_params) {
    if (igb_params["version"]) {
	return true;
    }
    else {
	return false;
    }	
}

// Supported parameters:
// genome - IGB genome assembly version code; required; e.g., A_thaliana_Jun_2009
// version - synonym for genome 
// seq_id, start, end - optional, but if one of these three is provided, all three must be provided;
//                      location coordinates in genome assembly specified by version
// gene_id - optional, must be an AGI code for a gene locus from annotation_set, ignored if
//           seq_id, start, end are provided
// annotation_set - code indicating annotation set that gene_id belongs to; required if 
//                  gene_id is provided; e.g., Araport11
//                  If provided and it matches a known annotation set, infer version if version
//                  not provided.
// feature_url_N - optional, URL of a data set hosted on a QuickLoad site (N is >= 0)
// server_url - required if featur_url_N provided; URL of the quickload site
function getIgbParameters(query_elements) {
    var igb_params={}
    var server_url = query_elements['server_url'];
    if (server_url == 'bar') {
	igb_params['server_url']='http://lorainelab-quickload.scidas.org/bar';
    }
    var version = query_elements['version'];
    if (!version) {
	version = query_elements['genome'];
    }
    var annotation_set = query_elements['annotation_set']
    if (annotation_set == 'Araport11' & !version) {
	version = 'A_thaliana_Jun_2009';
    }
    if (version) {
	igb_params['version']=version;
    }
    var seq_id = query_elements['seq_id'];
    if (seq_id) {
	igb_params['seq_id']=seq_id
	var start = query_elements['start'];
	if (start) {igb_params['start']=start;}
	var end = query_elements['end'];
	if (end) {igb_params['end']=end;}
    }
    else {
	var gene_id = query_elements['gene_id'];
	if (gene_id) {
	    gene_coords = getCoordinatesForGeneId(gene_id);
	    igb_params['start']=gene_coords['start'];
	    igb_params['end']=gene_coords['end'];
	    igb_params['seq_id']=gene_coords['seq_id'];
	}
    }
    return igb_params;
}

// make a bookmark-style URL references a data set available
// in quickload site server_url
function makeIgbUrl(igb_params) {
    var igb_url="http://localhost:7085/IGBControl?";
    feature_urls=0;
    for (var index in igb_params) {
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
    return igb_url;
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

/* Split query string into key value pairs */
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

// Use Web service to get gene coordinates
function getCoordinatesForGeneId(geneId) {
    console.log("start getCoordinatesForGeneId()");
    var gene_coords = {}
    var gene_url = location.origin+"/cgi-bin/geneIdLookup.py?gene_id="+geneId;
    var xhr = createCORSRequest('GET', gene_url);
    if (!xhr) {
       console.log("Could not form request: "+ gene_url);
    }
    xhr.onload = function() {
	console.log("getCoordinatesForGeneId(): onload");
	console.log("got response: " + this.response);
	gene_coords = this.response;
	//console.log("got gene coordinates: " + gene_coords);
    };
    xhr.onerror = function(err) {
        console.log(err);
    };
    xhr.send();
    console.log("got gene coordinates: " + gene_coords);
    console.log("end getCoordinatesForGeneId()");
    return gene_coords;
}

