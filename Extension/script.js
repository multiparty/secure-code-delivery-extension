/**
 * Turns an array buffer into a string.
 */
function ab2str(arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    var byteString = '';
    for (var i = 0; i < byteArray.byteLength; i++) {
        byteString += String.fromCharCode(byteArray[i]);
    }
    return byteString;
}

/**
 *  Turns a string into an array buffer.
 */
function str2ab(str) {
    var b = new ArrayBuffer(str.length);
    var view = new Uint8Array(b);
    for (var i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return b;
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
      x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded;charset=utf-8');
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
 * @param {string} codeHash - the hash of the actual code, used for highlighting the corresponding row.
 * @return {string} - the HTML for the results table.
 */
function constructHTML(frequencies, codeHash) {
  var html = "<table><tr><th>Source URLs</th><th>Frequency</th></tr>";
  for(var key in frequencies) {
    if(!frequencies.hasOwnProperty(key)) continue;
    
    var obj = frequencies[key];
    var background = "";
    if(key == codeHash) background = " style='background-color: blue;'";
    
    html += "<tr"+background+"><td style='text-align: center; padding: 10px;'>"+obj.urls.join("<br>")+"</td>";
    html += "<td style='text-align: center; padding: 10px;'>"+obj.frequency+"</td></tr>";
  }
  return html + "</table>";
}

/**
 * Pops up a new window to display the result tables.
 * @param {boolean} success - whether the threshold was met.
 * @param {array} htmlResultTable - html string representing the result table.
 */
function popupTables(success, htmlResultTable) {
// Display results in a popup window.
  var win = window.open("", "Results", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=800, height=400");
  win.document.open('text/html');
  win.document.write(success ? '<h1>Threshold Reached!</h1>' : '<h1 style="color:\'red\';">Threshold not met</h1>');
  win.document.write(htmlResultTable);
  win.document.close();
}

/*
 * When the user provides the url do the following:
 * 1. Parse the url for the urls of all the cdns and threshold (if provided).
 * 2. Get the contents of the corresponding urls (hashcodes).
 * 3. Compute the frequency of every version of the hashcode code.
 * 4. Check if the hashcode of the page's original code has a frequency higher than the threshold.
 * 5. Display the results and load the code if threshold is met.
 */
function start() {
  var PREFIX = "?federated_plugin=";
  
  // Read the parameters (urls of the cdns) from the provided url.
  var url = document.getElementById("link").value;
  var index = url.indexOf(PREFIX);
  if(index == -1) {
    document.write("<h1>Not Applicable</h1>");
    return;
  }
  
  var passed_parameters = url.substring(index+PREFIX.length);
  var urls = JSON.parse(decodeURIComponent(passed_parameters));
  
  // Check if the current url is supported.
  if(urls == null || typeof urls != "object") {
    document.write("<h1>Not Applicable</h1>");
    return;
  }
  
  // Get the threshold if provided.
  var threshold;
  if(urls.threshold != undefined) {
    threshold = urls.threshold;
    urls = urls.urls;
  }
  else {
    threshold = Math.floor(urls.length/2)+1;
  }
  
  // Finally, add the url of the actual page.
  urls.unshift(url.substring(0, index));
  
  // Get the content of all urls corresponding to the currently open url.
  var promises = getContents(urls);
  Promise.all(promises).then(function(results) {
    // Original url code is the first element, the rest are hash codes from cdns.
    var code = results[0];
    results.shift();
    urls.shift();
    
    // Hash the code.
    window.crypto.subtle.digest({ name: "SHA-256" }, str2ab(code))
    .then(function(hash) {
      var codeHash = ab2str(hash);
      
      // Compute the frequencies and display the result.
      var frequencies = computeFrequencies(urls, results);
      var frequency = frequencies[codeHash] ? frequencies[codeHash].frequency : 0;
      var htmlResultTable = constructHTML(frequencies, codeHash);
      
      popupTables(frequency >= threshold, htmlResultTable);
      if(frequency >= threshold) {
        chrome.tabs.getSelected(null, function(tab) {
          chrome.tabs.executeScript(tab.id, {code:" document.open(\"text/html\"); document.write(`"+code+"`); document.close();"});
        });
      }
    }).catch(document.write);
  }).catch(document.write);
};

// Set onclick event for the fetch button.
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("fetch_button").onclick = start;
});

// http://34.211.84.202:8080/good.html?federated_plugin=["http://54.71.194.41:8080/badhash.html","http://52.38.97.177:8080/goodhash.html"]
// http://34.211.84.202:8080/good.html?federated_plugin=["http://54.71.194.41:8080/goodhash.html","http://52.38.97.177:8080/goodhash.html"]