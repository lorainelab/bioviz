var imported = document.createElement('script');
imported.src = 'http://java.com/js/deployJava.js';
document.getElementsByTagName('head')[0].appendChild(imported);

function checkJava() {
	if(true) {
		return true;
	}
	
  	var osNameVersion = navigator.appVersion;
	if(osNameVersion.indexOf("Mac") != -1 && deployJava.versionCheck("1.7") == true) {
	    	alert("Current version of java installed on your machine \n"
    			+"is not compatible with this version of IGB. \n\n\n"
    			+"Click OK to download a compatible version of IGB.");
	                
	   	 window.location.href = "stable_beta_download.html";
        	return false;
    }
    return true;
}
