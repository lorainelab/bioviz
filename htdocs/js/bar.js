/**
 * BAR/IGB Bridge
 * by Loraine Lab
 *
 * Credit to Nick Schurch and Kyle Suttlemyre for inspiration of js/igb communication 
 */
var igbIsRunning = false;

//shim to add endsWith to strings
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}


$(window).on("load",function(e) {
    initializeIgbStatus();
    var version = $.url().param('version');
    var source = $.url().attr('source');
    var parser = new UAParser();
    if (parser.getBrowser().name == "Safari" && igbIsRunning) {
        var query_url = $.url().param('query_url');
        query_url = 'http://localhost:7085/igbStatusCheck?' + 'query_url' + '=' + query_url;
        var reqTimeout = setTimeout(function()
        {
            $("#main-container").hide();
            $("#fileNotFoundError").removeClass("hide");
        }, 4000);
        $.ajax({
            type: "GET",
            url: query_url,
            dataType: "script",
            statusCode: {
                200: function(r) {
                    //note this variable is defined in the response from IGB
                    if (remoteFileExists) {
                        $("#main-container").removeClass("hide");
                    } else {
                        $("#main-container").hide();
                        $("#fileNotFoundError").removeClass("hide");
                    }
                }
            }
        }).done(function() {
            clearTimeout(reqTimeout);
        }).fail(function(jqXHR, textStatus) {
            $("#main-container").hide();
            $("#fileNotFoundError").removeClass("hide");
        });

        if (version == null || version.length === 0 || version == '?') {
            $("#main-container").hide();
            $("#error-container").removeClass("hide");
        }
    } else {
        $("#main-container").removeClass("hide");
        if(source.endsWith('bar.html')){
             $("#main-container").hide();
             $("#bridge-info-container").removeClass("hide");
        }
        else if (version == null || version.length === 0 || version == '?') {
            $("#main-container").hide();
            $("#error-container").removeClass("hide");
        }
    }

});

// Create the XHR object.
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

function initializeIgbStatus() {
    var statusCheckUrl = 'http://127.0.0.1:7085/igbStatusCheck';
    var xhr = createCORSRequest('GET', statusCheckUrl);
    if (!xhr) {
        return;
    }
    xhr.onload = function() {
        if (xhr.status == 200) {
            igbIsRunning = true;
            $("#igbIsRunningBlock").removeClass("hide");
            setTimeout(checkDataLoadStatus(),3000);
        } else {
            $("#igbIsNotRunningBlock").removeClass("hide");
        }
    };

    xhr.onerror = function() {
        $("#igbIsNotRunningBlock").removeClass("hide");
    };
    xhr.send();
}

function checkDataLoadStatus() {
    var queryElements = parseQuery(location.search.substring(1));
    var geneResult = getTrackDataforGeneID(queryElements['gene_id']);
    if(geneResult) {
        var loadingdataUrl = constructURL(geneResult, queryElements);
    }
    
    var statusCheckUrl = loadingdataUrl;
    var xhr = createCORSRequest('GET', statusCheckUrl);
    if (!xhr) {
        return;
    }
    xhr.onload = function() {
        if (xhr.status == 204) {
            $("#loadingBarErrorBlock").addClass("hide");
            $("#loadingBlockFooter").removeClass("hide");
            $("#dataLoadCheckmark").removeClass("hide");
        }
        else {
            $("#loadingBlockFooter").addClass("hide");
            $("#loadingBarErrorBlock").removeClass("hide");
         }
    };

    xhr.onerror = function() {
        $("#dataLoadSpinner").remove();
        $("#loadingBarErrorBlock").removeClass("hide");
        $("#loadingBlockFooter").addClass("hide");
     };
    xhr.send();
}

/* This method splits query string into key value pairs */
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

/* method returns the data with seq_id, start and end attributes.
It takes geneId from bar site as a parameter */
function getTrackDataforGeneID(geneId) {
    var trackData = {};
    var trackUrl = "http://52.91.39.225/cgi-bin/geneIdLookup.py?gene_id="+geneId;
    var xhr = createCORSRequest('GET', trackUrl);
    if (!xhr) {
        return;
    }
    xhr.onload = function(res) {
        trackData = res;
        return trackData;
    };

    xhr.onerror = function(err) {
        console.log(err);
     };
    xhr.send();
    return trackData;
}

/* constructs URL compatible to IGB */
function constructURL(geneResult, queryElements) {
    var fullURL = "http://localhost:7085/IGBControl?version=A_thaliana_Jun_2009&seq_id="
    +geneResult.seq_id+"&start="+geneResult.start+"&end="+geneResult.end
    +"&server_url=http://lorainelab-quickload.scidas.org/bar"
    +"&loadresidues=True";
    for(var key in queryElements){
        if(/feature_url_/.test(key)) {
            fullURL += "&"+key+"="+queryElements[key]+"&query_url="+queryElements[key];
        }
    }
    return fullURL;
}
