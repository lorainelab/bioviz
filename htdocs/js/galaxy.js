/**
 * Galaxy/IGB Bridge
 * by Loraine Lab
 *
 * Credit to Nick Schurch and Kyle Suttlemyre for inspiration of js/igb communication 
 */
var igbIsRunning = false;
var count = 0;

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


$(window).load(function() {
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
                        var bookmarkUrl = 'http://localhost:7085/igbGalaxyDataView' + window.location.search;
                        $("#bookmarkUrl").val(bookmarkUrl);
                        loadBookmark(bookmarkUrl);
                        $("#customLaunchBtn").click(function() {
                            downloadURL($("#jarName").val());
                        });
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
        var bookmarkUrl = 'http://localhost:7085/igbGalaxyDataView' + window.location.search;
        $("#bookmarkUrl").val(bookmarkUrl);
        loadBookmark(bookmarkUrl);
        $("#customLaunchBtn").click(function() {
            downloadURL($("#jarName").val());
        });
        if(source.endsWith('galaxy.html')){
             $("#main-container").hide();
             $("#bridge-info-container").removeClass("hide");
        }
        else if (version == null || version.length === 0 || version == '?') {
            $("#main-container").hide();
            $("#error-container").removeClass("hide");
        }
    }

});

var downloadURL = function downloadURL(url) {
    var hiddenIFrameID = 'hiddenDownloader',
            iframe = document.getElementById(hiddenIFrameID);
    if (iframe === null) {
        iframe = document.createElement('iframe');
        iframe.id = hiddenIFrameID;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    iframe.src = url;
};

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
            var refreshId = setInterval(function()
            {
                checkDataLoadStatus(refreshId, count++);
            }, 2000);
        } else {
            $("#igbIsNotRunningBlock").removeClass("hide");
        }
    };

    xhr.onerror = function() {
        $("#igbIsNotRunningBlock").removeClass("hide");
    };
    xhr.send();
}

function loadBookmark(bookmarkurl) {
    var xhr = createCORSRequest('GET', bookmarkurl);
    if (!xhr) {
        return;
    }
    xhr.onload = function() {
        if (xhr.status == 200) {
            $("#dataLoadSpinner").removeClass("hide");
            //do nothing
        } else {
            //do nothing for now...
        }
    };
    xhr.send();

}


function checkDataLoadStatus(refreshId, count) {
    if (count > 3) {
        if (!igbIsRunning) {
            clearInterval(refreshId);
        }
    }
    var dataSetUrl = getParameterByName('feature_url_0');
    var loadStatusParam = 'checkLoadStatusForDataSet';
    var statusCheckUrl = 'http://127.0.0.1:7085/igbStatusCheck?' + loadStatusParam + '=' + dataSetUrl;
    var xhr = createCORSRequest('GET', statusCheckUrl);
    if (!xhr) {
        return;
    }

    xhr.onload = function() {
        if (xhr.responseText == 'complete') {
            $("#dataLoadSpinner").remove();
            $("#loadingBlockFooter").removeClass("hide");
            $("#loadingErrorBlock").addClass("hide");
            $("#dataLoadMessage").html("Your data is ready to view.");
            $("#dataLoadCheckmark").removeClass("hide");
            clearInterval(refreshId);
        } else {
            $("#dataLoadSpinner").remove();
            $("#loadingBlockFooter").addClass("hide");
            $("#loadingErrorBlock").removeClass("hide");
        }
    }

    xhr.onerror = function() {
        $("#dataLoadSpinner").remove();
        $("#loadingErrorBlock").removeClass("hide");
        $("#loadingBlockFooter").addClass("hide");
    };

    xhr.send();
    count++;
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
