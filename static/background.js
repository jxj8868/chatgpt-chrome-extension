/**
* 运行在后台的单实例
*/
chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason === "install"){
      
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
.catch((error) => console.error(error));

chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  if (request.contentScriptQuery == "fetchUrl") {
    fetch(request.url)
        .then(response => response.text())
        .then(text => sendResponse(text))
        .catch(error => console.log(error))
    return true;  // Will respond asynchronously.
  }
}
);