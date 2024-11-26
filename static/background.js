(function(){
  chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason === "install"){
        chrome.runtime.openOptionsPage();
    }
  });
  
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchData') {
      fetch(request.url)
        .then(response => response.json())
        .then(data => sendResponse({ data }))
        .catch(error => sendResponse({ error: error.message }));
   
      // 必须返回true，以表示sendResponse将异步调用
      return true;
    }
  });
})();