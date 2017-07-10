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
  var html = "<table><tr><th>Source URLs</th><th>Votes</th></tr>";
  for(var key in frequencies) {
    if(!frequencies.hasOwnProperty(key)) continue;
    
    var obj = frequencies[key];
    html += "<tr><td>"+obj.urls.join("<br>")+"</td>";
    html += "<td>"+obj.frequency+"</td></tr>";
  }
  return html + "</table>";
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
  // Read the parameters (urls of the cdns) from the current url.
  var current_url = location.href;
  var passed_parameters = current_url.substring(chrome.extension.getURL("consensus.html").length+1);
  var urls = JSON.parse(decodeURIComponent(passed_parameters));
  
  // Check if the current url is supported.
  if(urls == null || typeof urls != "object" || urls.length <= 0) {
    document.write("<h1>Not Applicable</h1>");
    return;
  }
  
  // Get the content of all urls corresponding to the currently open url.
  var promises = getContents(urls);
  
  Promise.all(promises).then(function(results) {
    // Compute the frequencies and display the result.
    var frequencies = computeFrequencies(urls, results);
    var consensusReached = frequencies[results[0]].frequency == results.length;
    var htmlResultTable = constructHTML(frequencies);
    
    // Display results in a popup window.
    var win = window.open("", "Results", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=800, height=400");
    win.document.open('text/html');
    win.document.write(consensusReached ? '<h1>Consensus Reached!</h1>' : '<h1>No Consensus</h1>');
    win.document.write(htmlResultTable);
    win.document.close();
    
    if(consensusReached) { document.open('text/html'); document.write(results[0]); document.close(); }
  }).catch(document.write);
});
