
self.addEventListener('fetch', function(event) {
    
    console.error("ServiceWorker: " + event.request.url);
    
    var i = event.request.url.indexOf(".epub/");
    var isEPUB = i > 0;
    if (isEPUB) {
        var epubUrl = event.request.url.substr(0, i+5);
        var epubInnerPath = event.request.url.substr(i+6);
        
        console.log(epubUrl);
        console.log(epubInnerPath);
        
        //TODO: NPM-build a proper WORKER js, just like the Chrome app one (with Almond).
        // Otherwise the zip js lib is not accessible here
    console.debug(self.zip);
    
        //TODO: ZipResourceFetcher # _zipFs.importHttpContent()
    }
    
    event.respondWith(
        fetch(event.request.clone()).then(function(response) {
            
            if (isEPUB) {
            console.error("ServiceWorker response: ");
            console.log(response);
            }
            return response;
        })  
    );
});