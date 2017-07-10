// Maps one url to an array of corresponding urls. 
// The content of all/majority of these urls should match that of the original url.
var urls = {
    "http://34.211.84.202:8080/jquery-2.2.4.min.js": [
        "http://34.211.84.202:8080/jquery-2.2.4.min.js", 
        "http://54.71.194.41:8080/jquery-2.2.4.min.js", 
        "http://52.38.97.177:8080/jquery-2.2.4.min.js"
    ]
};

/**
 * Get the current URL.
 * @param {function(string)} callback - called when the URL of the current tab is found.
 */
function getCurrentTabUrl(callback) {
  var queryInfo = { // Get the active tab in the active window.
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) { // tabs: array of tabs that match the query.
    callback(tabs[0].url); // Exactly one tab is active in any window.
  });
}

/**
 * Get the content of the given urls.
 * @param {array} urls - an array of urls.
 * @return {array} - an array of promises, each of which is a promise to the content of 
 *                   the url that matches its index.
 */
function getContents(urls) {
  var promises = [];
  for(var i = 0; i < urls.length; i++) {
    promises.push(new Promise(function(resolve, reject) {
      var x = new XMLHttpRequest();
      x.open("GET", urls[i], true);
      x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      x.setRequestHeader('Access-Control-Allow-Origin', '*');
      x.onload = function() { resolve(x.responseText); };
      x.onerror = function(error) { reject(error); };
      x.send();
    }));
  }
  
  return promises;
}

/**
 * Compute the frequency of every string in results.
 * @param {array} urls - an array of source urls.
 * @param {array} results - an array containing the content for every given url (matches by index).
 * @return {object} - an object where the key is a source code string and the value is its frequency and source urls.
 */
function computeFrequencies(urls, results) {
  var frequencies = {};
  for(var i = 0; i < results.length; i++) {
    if(frequencies[results[i]] == null) {
      var obj = { "frequency": 1, "urls": [ urls[i] ] };
      frequencies[results[i]] = obj;
    }
    
    else {
      var obj = frequencies[results[i]];
      obj.frequency++;
      obj.urls.push(urls[i]);
    }
  }
      
  return frequencies;
}

/**
 * Construct the HTML table for displaying the results.
 * @param {object} frequencies - the key is a source code string and the value is its frequency and source urls.
 * @return {string} - the HTML for the results table.
 */
function constructHTML(frequencies) {
  var html = "<tr><th>Source URLs</th><th>Votes</th></tr>";
  for(var key in frequencies) {
    if(!frequencies.hasOwnProperty(key)) continue;
    
    var obj = frequencies[key];
    html += "<tr><td>"+obj.urls.join("<br>")+"</td>";
    html += "<td>"+obj.frequency+"</td></tr>";
  }
  return html;
}

/**
 * Show the status message and empty the result table.
 * @param {string} statusText - the text to be displayed in the HTML.
 */
function renderStatus(statusText) {
  document.getElementById("status").textContent = statusText;
  document.getElementById("result-table").innerHTML = "";
}

/*
 * When the extension is loaded do the following:
 * 1. Get the currently open url.
 * 2. If the url is supported/registered in the extension:
 *    a. Get the contents of the corresponding urls.
 *    b. Compute the frequency of every version of the source code.
 *    c. Check for consensus and display the frequencies in a table.
 */
document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {
    // Check if the current url is supported.
    if(urls[url] == null) {
      renderStatus("Not Applicable");
      return;
    }
    
    // Get the content of all urls corresponding to the currently open url.
    renderStatus('Checking for consensus');
    var promises = getContents(urls[url]);
    
    Promise.all(promises).then(function(results) {
      // Compute the frequencies and display the result.
      var frequencies = computeFrequencies(urls[url], results);
      var consensusReached = frequencies[results[0]].frequency == results.length;
      var htmlResultTable = constructHTML(frequencies);
      
      if(consensusReached) {    
        renderStatus('Consensus Reached!');
        document.getElementById("result-table").innerHTML = htmlResultTable;
      } else {
        renderStatus('Results ready');
        document.getElementById("result-table").innerHTML = htmlResultTable;
      }
    });//.catch(renderStatus);
  });
});
