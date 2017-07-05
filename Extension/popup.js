// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

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
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

function getAllUrls(urls, callback, errorCallback) {
  function getOneUrl(results, index) {
    if(index >= urls.length) {
      callback(results);
      return;
    }
    
    console.log("Start: " + urls[index]);
    
    var x = new XMLHttpRequest();
    x.open("GET", urls[index], true);
    x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    x.setRequestHeader('Access-Control-Allow-Origin', '*');
    x.onload = function() {
      var response = x.responseText;
      results.push(response);
      
      getOneUrl(results, index+1);
    };
    x.onerror = function(error) {
      console.log("ERROR: " + urls[index]);
      console.log(error);
      errorCallback("Network error.");
    };
    
    x.send();
  }
  
  getOneUrl([], 0);
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {
    // Put the image URL in Google search.
    if(urls[url] == null) {
      renderStatus("Not Applicable");
      return;
    }
    
    renderStatus('Checking for consensus');
    getAllUrls(urls[url], function(results) {
      var votes = {};
      
      for(var i = 0; i < results.length; i++) {
        if(votes[results[i]] == null) {
          var obj = { "votes": 1, "urls": [ urls[url][i] ] };
          votes[results[i]] = obj;
        }
        
        else { 
          var obj = votes[results[i]];
          obj.votes++;
          obj.urls.push(urls[url][i]);
        }
      }
      
      var count = 0;
      var tableBody = "<tr><th>Source URL</th><th>Votes</th></tr>";
      for(var key in votes) {
        if(!votes.hasOwnProperty(key)) continue;
        
        var obj = votes[key];
        tableBody += "<tr><td>"+obj.urls[0]+"</td><td>"+obj.votes+"</td></tr>";
        count++;
      }
      
      if(count == 1) {        
        renderStatus('Consensus Reached!');
        document.getElementById("result-table").innerHTML = tableBody;
      } else {
        renderStatus('Results ready');
        document.getElementById("result-table").innerHTML = tableBody;
      }
    }, renderStatus);
  });
});
