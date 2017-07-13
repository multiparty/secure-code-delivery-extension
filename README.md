# Federated Code Delivery
Requires Google Chrome version 45 and higher.

## Setup
* download the source code.
* Visit chrome://extensions in your Chrome browser.
* Ensure that the Developer mode checkbox in the top right-hand corner is checked.
* Click "Load unpacked extension" to pop up a file-selection dialog
* Navigate to the <source_code_directory> and choose the "Extension" directory.
* The extension will be loaded. You should see the icon with a big "F" letter in the top-right corner of Chrome (in the toolbar).

## Testing
* Choose one of the two scenarios below and copy its the url. 
* Click on the "F" icon in the top-right corner of Chrome.
* Paste the url inside the popup panel, then click Fetch.

### Majority satisfied:
    http://34.211.84.202:8080/good.html?federated_plugin=["http://54.71.194.41:8080/badhash.html","http://52.38.97.177:8080/goodhash.html"]
    
### Majority not satisfied:
    http://34.211.84.202:8080/good.html?federated_plugin=["http://54.71.194.41:8080/goodhash.html","http://52.38.97.177:8080/goodhash.html"
    
## Custom Threshold
By default, the extension checks for a majority (more than half).  You can change the threshold by providing it in the url as follows:

    http://.../...?federated_plugin={"threshold":<threshold_number>,"urls":["url1","url2",...]}

## Supporting your own custom webpage
To allow the extension to federate the code delivery process for your webpage, you need 3 simple steps:
* Host your webpage at some url.
* Provide other urls that serve a SHA-256 hash of your code.
* Pick a threshold and construct a url according to the extension's format:

    http://your/page/url?federated_plugin={"threshold":your_threshold,"urls":["url_hash_1","url_hash2",...]}

## License
MIT