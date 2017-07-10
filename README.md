[Basic Tutorial For Chrome Extension Development](https://developer.chrome.com/extensions/getstarted)

## To load the extension (taken from the above tutorial):
* Visit chrome://extensions in your browser (or open up the Chrome menu by clicking the icon to the far right of the Omnibox:  The menu's icon is three horizontal bars. and select Extensions under the Tools menu to get to the same place).
* Ensure that the Developer mode checkbox in the top right-hand corner is checked.
* Click Load unpacked extension… to pop up a file-selection dialog
* Navigate to the directory in which your extension files live, and select it.
* The extension will be loaded. You will see the extension id under its name.

## To test the extension with some sample urls:
* Testing consensus with all cdns giving correct results open:
    chrome-extension://<extension_id>/consensus.html?["http://34.211.84.202:8080/good.html","http://54.71.194.41:8080/good.html","http://52.38.97.177:8080/good.html"]
* Testing consensus with some cdns giving incorrect results open:
    chrome-extension://<extension_id>/consensus.html?["http://34.211.84.202:8080/good.html","http://54.71.194.41:8080/good.html","http://52.38.97.177:8080/bad.html"]
* Testing shamir secret sharing on code piece:
    chrome-extension://<extension_id>/mpc.html?["http://34.211.84.202:8080/good1.html","http://54.71.194.41:8080/good2.html","http://52.38.97.177:8080/good3.html"]