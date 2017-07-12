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
 * Get the code with the most frequency.
 * @param {object} frequencies - a map from code to frequency.
 * @return {string} - the code with most frequency.
 */
function highestFrequencyCode(frequencies) {
  var code;
  var max = 0;
  for(var key in frequencies) {
    if(!frequencies.hasOwnProperty(key)) continue;
    
    if(frequencies[key].frequency > max) {
      max = frequencies[key].frequency;
      code = key;
    }
  }
  return code;
}

/**
 * Construct the HTML table for displaying the results.
 * @param {object} frequencies - the key is a source code string and the value is its frequency and source urls.
 * @param {string} title - the title of the table.
 * @return {string} - the HTML for the results table.
 */
function constructHTML(frequencies, title) {
  var html = "<table><tr><th colspan='2'>"+title+"</tr><tr><th>Source URLs</th><th>Votes</th></tr>";
  for(var key in frequencies) {
    if(!frequencies.hasOwnProperty(key)) continue;
    
    var obj = frequencies[key];
    html += "<tr><td>"+obj.urls.join("<br>")+"</td>";
    html += "<td>"+obj.frequency+"</td></tr>";
  }
  return html + "</table>";
}

/**
 * Pops up a new window to display the result tables.
 * @param {boolean} success - whether the threshold was met.
 * @param {array} htmlResultTables - array of html strings representing tables.
 */
function popupTables(success, htmlResultTables) {
// Display results in a popup window.
  var win = window.open("", "Results", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=800, height=400");
  win.document.open('text/html');
  win.document.write(success ? '<h1>Consensus Reached!</h1>' : '<h1>No Consensus</h1>');
  win.document.write(htmlResultTables.join("<br>"));
  win.document.close();
}

/**
 * This entire code does not use any global variables, so the only thing in scope inside this function is the paramter name.
 * This will ensure that no existing variable from this code will be used by the script being evaluated.
 * @param {string} __.... - script to evaluate.
 */
function evaluateWithNoVariablesInScope(__$$_$_$_$_$_01234556789012345667890__useless_name_will_never_be_used_by_anyone_$$$_$_$_$_$_$$$) {
  eval(__$$_$_$_$_$_01234556789012345667890__useless_name_will_never_be_used_by_anyone_$$$_$_$_$_$_$$$);
  if(window.document.onload) 
    window.document.onload(); // fire the document.onload event
  
  var __$$_$_$_$_$_01234556789012345667890__DOMContentLoaded_event = window.document.createEvent("Event");
  __$$_$_$_$_$_01234556789012345667890__DOMContentLoaded_event.initEvent("DOMContentLoaded", true, true);
  window.document.dispatchEvent(__$$_$_$_$_$_01234556789012345667890__DOMContentLoaded_event);
}

/*
 * When the extension is loaded do the following:
 * 1. Get the currently open url.
 * 2. If the url is supported/registered in the extension:
 *    a. Get the contents of the corresponding urls.
 *    b. Compute the frequency of every version of the source code.
 *    c. Check for consensus and display the frequencies in a table.
 */
document.addEventListener('DOMContentLoaded', processScripts);
function processScripts() {
  document.removeEventListener('DOMContentLoaded', processScripts);
  
  // Read the parameters (urls of the cdns) from the current url.
  var current_url = location.href;
  var passed_parameters = current_url.substring(chrome.extension.getURL("consensus.html").length+1);
  var urls = JSON.parse(decodeURIComponent(passed_parameters));
  threshold = urls.length;
  
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
    var htmlResultTables = [ constructHTML(frequencies, "Main page") ];
    var code = highestFrequencyCode(frequencies);
    var maxFrequency = frequencies[code].frequency;
        
    if(maxFrequency >= threshold) {
      var mainElement = document.createElement("html");
      mainElement.innerHTML = code;
      
      // Loop over all script tags, store inline scripts to execute them later with eval.
      var scripts = mainElement.getElementsByTagName("script");
      var codes = [];
      promises = [];
      var promisesPositions = [];
      for(var i = 0; i < scripts.length; i++) {
        var sc = scripts[i].textContent;
        var src = scripts[i].src;
        
        // Remove script to satisfy security settings.
        //scripts[i].parentElement.removeChild(scripts[i]);
        
        if(src && src.trim().length > 0) {
          src = src.trim();
          // remember the position of this script tag.
          promisesPositions.push(i);
          if(src.startsWith("chrome-extension://federated/consensus.html?[")) {
            // Must perform federated delivery on the content of this script.
            var scriptUrls = src.substring("chrome-extension://federated/consensus.html?".length);
            scriptUrls = scriptUrls.replace(/%22/g, "\"").replace(/%20/g, " ");
            scriptUrls = JSON.parse(scriptUrls);
            codes.push(scriptUrls); // Leave a placeholder
            
            promises.push(Promise.all(getContents(scriptUrls)));
          }
          else { // No federation.
            codes.push(src); // Leave a placeholder
            promises.push(getContents([src])[0]);
          }
        } 
        else if(sc && sc.trim().length > 0) codes.push(sc);
      }

      Promise.all(promises).then(function(results) {
        for(var i = 0; i < results.length; i++) {
          var index = promisesPositions[i];
          if(typeof results[i] == "string" || typeof results[i] == "String") {
            codes[index] = results[i];
            continue;
          }
          
          var script_frequencies = computeFrequencies(codes[index], results[i]);
          htmlResultTables.push([ constructHTML(script_frequencies, "Script " + i) ]);
          var script_code = highestFrequencyCode(script_frequencies);
          maxFrequency = Math.min(maxFrequency, script_frequencies[script_code].frequency);
          codes[index] = script_code;
        }
        
        if(maxFrequency >= threshold) {
          // Load the code into the page.
          var html = document.getElementsByTagName("html")[0];
          html.removeChild(html.children[1]);
          html.removeChild(html.children[0]);
          
          for(var i = 0; i < mainElement.children.length; /* no increment, array becomes smaller */)
            html.append(mainElement.children[0]);
          
          popupTables(maxFrequency >= threshold, htmlResultTables);
          // Execute the scripts (in order) with eval.
          if(codes.length > 0)
            evaluateWithNoVariablesInScope(codes.join("\n"));
          // Eval is the last statement to be executed, even if eval modified some variable, it wont effect our code.
        } else {
          popupTables(maxFrequency >= threshold, htmlResultTables);
        }        
      }).catch(document.write);
    }
    
    else {
      popupTables(maxFrequency >= threshold, htmlResultTables);
    }
  }).catch(document.write);
};
