// Mod instead of javascript's remainder (%)
function mod(x, y) {
  return (x < 0) ? ((x%y)+y)%y : x%y;
}

/**
 * Uses Lagrange polynomials to interpolate the polynomial described by the given shares (points).
 * @param {array} shares - the index+1 is the x-coordinate and the value is the y-coordinate.
 * @param {int} party_count - the total number of parties.
 * @return {string} the value (one character) of the polynomial at x = 0 (the secret).
 */
function lagrange(shares, party_count) {
  var lagrange_coeff = [];

  // Compute the Langrange coefficients at 0
  for(var i = 1; i <= party_count; i++) {
    lagrange_coeff[i] = 1;
    for(var j = 1; j <= party_count; j++) {
      if(j != i) lagrange_coeff[i] = lagrange_coeff[i] * (0 - j) / (i - j);
    }
  }

  // Reconstruct the secret via Lagrange interpolation
  var recons_secret = 0;
  for(var i = 1; i <= party_count; i++)
    recons_secret = recons_secret + (shares[i-1].charCodeAt(0)-32) * lagrange_coeff[i];
  
  recons_secret = 32 + mod(recons_secret, 127-32);
  return String.fromCharCode(recons_secret);
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

/*
 * When the extension is loaded:
 * 1. retrieve the cdn urls encoded in the url
 * 2. retrieve the content of each cdn.
 * 3. recombine the secret shares into the actual value (character by character).
 * 4. load the recombined code.
 */
document.addEventListener('DOMContentLoaded', function() {
  // Read the parameters (urls of the cdns) from the current url.
  var current_url = location.href;
  var passed_parameters = current_url.substring(chrome.extension.getURL("mpc.html").length+1);
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
    var secret = [];
    for(var i = 0; i < results[0].length; i++) {
      var shares = [];
      for(var j = 0; j < results.length; j++) 
        shares[j] = results[j].charAt(i);
      secret.push(lagrange(shares, results.length));
    }
  
    console.log(secret.join(""));
    document.open('text/html'); 
    document.write(secret.join("")); 
    document.close();
  }).catch(document.write);
});
